/**
 * Bid service — placing, accepting, rejecting, and cancelling bids (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import type { Bid, CreateBidDTO } from '@/models/bid.model';
import { getCurrentUserId } from './auth.service';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const BID_SELECT = `
  id,
  listingId:listing_id,
  bidderId:bidder_id,
  amount,
  isBuyNow:is_buy_now,
  message,
  status,
  createdAt:created_at,
  updatedAt:updated_at
`;

const USER_BRIEF_SELECT = `
  id,
  name,
  avatar,
  university,
  isVerified:is_verified,
  rating,
  major,
  year
`;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toBid(row: any): Bid {
  return {
    id: row.id,
    listingId: row.listingId,
    bidderId: row.bidderId,
    amount: toNumber(row.amount),
    isBuyNow: !!row.isBuyNow,
    message: row.message ?? undefined,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function clearBidNotificationsForUser(userId: string, bidId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('related_entity_type', 'bid')
    .eq('related_entity_id', bidId);

  if (error || !data?.length) return;

  await supabase.from('notifications').delete().in('id', data.map((row) => row.id));
}

async function getOrCreateConversation(buyerId: string, sellerId: string, listingId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (createError || !created) return null;
  return created.id;
}

export async function place(dto: CreateBidDTO) {
  await simulateLatency(150, 300);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in to place a bid');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, title, status, negotiable_min_price, mrp, price')
    .eq('id', dto.listingId)
    .single();

  if (listingError || !listing) {
    throwApiError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throwApiError(400, 'This listing is no longer active');
  }
  if (listing.seller_id === bidderId) {
    throwApiError(403, 'You cannot bid on your own listing');
  }

  const { data: openOrders, error: openOrdersError } = await supabase
    .from('orders')
    .select('id')
    .eq('listing_id', dto.listingId)
    .in('status', ['pending', 'confirmed'])
    .limit(1);

  if (!openOrdersError && (openOrders?.length ?? 0) > 0) {
    throwApiError(400, 'This listing is already in an active meetup workflow');
  }

  const minPrice = listing.negotiable_min_price == null ? null : toNumber(listing.negotiable_min_price);
  if (!dto.isBuyNow && minPrice !== null && dto.amount < minPrice) {
    throwApiError(400, `Bid amount must be at least ₹${minPrice}`);
  }

  const mrp = toNumber(listing.mrp);
  if (!dto.isBuyNow && dto.amount > mrp) {
    throwApiError(400, `Bid amount cannot exceed ₹${mrp}`);
  }

  const { data: hasPending, error: pendingError } = await supabase
    .from('bids')
    .select('id')
    .eq('listing_id', dto.listingId)
    .eq('bidder_id', bidderId)
    .eq('status', 'pending')
    .limit(1);

  if (!pendingError && (hasPending?.length ?? 0) > 0) {
    throwApiError(409, 'You already have a pending bid on this listing');
  }

  const amount = dto.isBuyNow ? toNumber(listing.price) : dto.amount;

  const { data: bidRow, error: bidInsertError } = await supabase
    .from('bids')
    .insert({
      listing_id: dto.listingId,
      bidder_id: bidderId,
      amount,
      is_buy_now: dto.isBuyNow,
      message: dto.message ?? null,
      status: 'pending',
    })
    .select(BID_SELECT)
    .single();

  if (bidInsertError || !bidRow) {
    if (bidInsertError?.code === '23505') {
      throwApiError(409, 'You already have a pending bid on this listing');
    }
    throwApiError(500, bidInsertError?.message || 'Failed to place bid');
  }

  const bid = toBid(bidRow);

  const conversationId = await getOrCreateConversation(bidderId, listing.seller_id, listing.id);
  const { data: bidderProfile } = await supabase.from('users').select('name').eq('id', bidderId).maybeSingle();
  const bidderName = bidderProfile?.name ?? 'Someone';
  const bidTypeLabel = dto.isBuyNow ? 'wants to Buy Now' : `placed a bid of ₹${bid.amount}`;

  if (conversationId) {
    await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: null,
        content: `🛒 ${bidderName} ${bidTypeLabel} on "${listing.title}"`,
        type: 'bid_notification',
        metadata: { bidId: bid.id, amount: bid.amount, isBuyNow: dto.isBuyNow, actorId: bidderId },
        is_read: false,
      },
      {
        conversation_id: conversationId,
        sender_id: null,
        content: '⏳ Wait until the seller sends meetup details.',
        type: 'system',
        metadata: { actorId: listing.seller_id },
        is_read: false,
      },
    ]);
  }

  await supabase.from('notifications').insert({
    user_id: listing.seller_id,
    type: 'bid',
    title: dto.isBuyNow ? 'New Buy Now request!' : 'New bid received!',
    content: `${bidderName} ${bidTypeLabel} on "${listing.title}"`,
    link: `/listings/${listing.id}/bids`,
    is_read: false,
    related_entity_id: bid.id,
    related_entity_type: 'bid',
  });

  eventBus.emit(EVENTS.BID_PLACED, {
    bidId: bid.id,
    listingId: listing.id,
    bidderId,
    amount: bid.amount,
  });
  eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
    notificationId: `bid-notif-${bid.id}`,
    userId: listing.seller_id,
    type: 'bid',
  });

  return wrapResponse(bid);
}

export async function getByListing(listingId: string) {
  await simulateLatency(80, 150);

  const { data: bidRows, error } = await supabase
    .from('bids')
    .select(BID_SELECT)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);

  const bids = (bidRows ?? []).map(toBid);
  const bidderIds = Array.from(new Set(bids.map((bid) => bid.bidderId)));
  const bidIds = bids.map((bid) => bid.id);

  const [{ data: bidders }, { data: linkedOrders }] = await Promise.all([
    bidderIds.length
      ? supabase.from('users').select(USER_BRIEF_SELECT).in('id', bidderIds)
      : Promise.resolve({ data: [] as any[] }),
    bidIds.length
      ? supabase.from('orders').select('id, bid_id, status').in('bid_id', bidIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const bidderMap = new Map((bidders ?? []).map((row: any) => [row.id, row]));
  const orderMap = new Map((linkedOrders ?? []).map((row: any) => [row.bid_id, row]));

  const enrichedBids = bids.map((bid) => {
    const bidder = bidderMap.get(bid.bidderId);
    const linkedOrder = orderMap.get(bid.id);

    return {
      ...bid,
      orderId: linkedOrder?.id,
      orderStatus: linkedOrder?.status,
      bidder: bidder
        ? {
            id: bidder.id,
            name: bidder.name,
            avatar: bidder.avatar,
            university: bidder.university,
            isVerified: !!bidder.isVerified,
            rating: toNumber(bidder.rating),
            major: bidder.major,
            year: bidder.year,
          }
        : null,
    };
  });

  return wrapResponse(enrichedBids);
}

export async function getMyBids() {
  await simulateLatency(80, 150);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data, error } = await supabase
    .from('bids')
    .select(BID_SELECT)
    .eq('bidder_id', bidderId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);

  return wrapResponse((data ?? []).map(toBid));
}

export async function accept(bidId: string) {
  await simulateLatency(200, 400);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data: bidRow, error: bidError } = await supabase
    .from('bids')
    .select(BID_SELECT)
    .eq('id', bidId)
    .single();

  if (bidError || !bidRow) {
    throwApiError(404, 'Bid not found');
  }

  const bid = toBid(bidRow);

  if (bid.status !== 'pending') {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('bid_id', bidId)
      .maybeSingle();

    if (existingOrder?.id) {
      return wrapResponse({ success: true, orderId: existingOrder.id });
    }
    throwApiError(400, 'Bid is no longer pending');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', bid.listingId)
    .single();

  if (listingError || !listing) {
    throwApiError(404, 'Listing not found');
  }

  if (listing.seller_id !== sellerId) {
    throwApiError(403, 'You can only accept bids on your own listings');
  }

  const { data: orderId, error: rpcError } = await supabase.rpc('accept_bid_and_create_order', {
    p_bid_id: bidId,
    p_actor_user_id: sellerId,
    p_delivery_method: 'campus_meetup',
  });

  if (rpcError || !orderId) {
    throwApiError(400, rpcError?.message || 'Failed to accept bid');
  }

  await supabase.from('notifications').insert({
    user_id: bid.bidderId,
    type: 'order',
    title: 'Bid accepted!',
    content: `Your bid of ₹${bid.amount} has been accepted!`,
    link: '/orders',
    is_read: false,
    related_entity_id: orderId,
    related_entity_type: 'order',
  });

  eventBus.emit(EVENTS.BID_ACCEPTED, {
    bidId: bid.id,
    listingId: bid.listingId,
    bidderId: bid.bidderId,
    amount: bid.amount,
  });
  eventBus.emit(EVENTS.ORDER_CREATED, {
    orderId,
    listingId: bid.listingId,
    buyerId: bid.bidderId,
    sellerId,
  });

  return wrapResponse({ success: true, orderId });
}

export async function reject(bidId: string) {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data: bidRow, error: bidError } = await supabase
    .from('bids')
    .select(BID_SELECT)
    .eq('id', bidId)
    .single();

  if (bidError || !bidRow) {
    throwApiError(404, 'Bid not found');
  }

  const bid = toBid(bidRow);
  if (bid.status !== 'pending') {
    throwApiError(400, 'Bid is no longer pending');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', bid.listingId)
    .single();

  if (listingError || !listing || listing.seller_id !== sellerId) {
    throwApiError(403, 'You can only reject bids on your own listings');
  }

  const { error: updateError } = await supabase
    .from('bids')
    .update({ status: 'rejected' })
    .eq('id', bidId)
    .eq('status', 'pending');

  if (updateError) throwApiError(500, updateError.message);

  await clearBidNotificationsForUser(sellerId, bid.id);

  await supabase.from('notifications').insert({
    user_id: bid.bidderId,
    type: 'bid',
    title: 'Bid rejected',
    content: 'Your bid was rejected by the seller.',
    link: '/orders',
    is_read: false,
    related_entity_id: bid.id,
    related_entity_type: 'bid',
  });

  eventBus.emit(EVENTS.BID_REJECTED, {
    bidId: bid.id,
    listingId: bid.listingId,
    bidderId: bid.bidderId,
    amount: bid.amount,
  });

  return wrapResponse({ success: true });
}

export async function cancel(bidId: string) {
  await simulateLatency(80, 160);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data: bidRow, error: bidError } = await supabase
    .from('bids')
    .select(BID_SELECT)
    .eq('id', bidId)
    .single();

  if (bidError || !bidRow) {
    throwApiError(404, 'Bid not found');
  }

  const bid = toBid(bidRow);

  if (bid.bidderId !== bidderId) {
    throwApiError(403, 'You can only cancel your own bids');
  }
  if (bid.status !== 'pending') {
    throwApiError(400, 'Only pending bids can be cancelled');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', bid.listingId)
    .single();

  if (listingError || !listing) {
    throwApiError(404, 'Listing not found');
  }

  const { error: updateError } = await supabase
    .from('bids')
    .update({ status: 'cancelled' })
    .eq('id', bidId)
    .eq('status', 'pending');

  if (updateError) throwApiError(500, updateError.message);

  await clearBidNotificationsForUser(listing.seller_id, bid.id);

  eventBus.emit(EVENTS.BID_REJECTED, {
    bidId: bid.id,
    listingId: bid.listingId,
    bidderId: bid.bidderId,
    amount: bid.amount,
  });

  return wrapResponse({ success: true });
}
