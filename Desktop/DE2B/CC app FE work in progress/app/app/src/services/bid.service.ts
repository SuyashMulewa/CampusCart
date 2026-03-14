/**
 * Bid service — placing, accepting, and rejecting bids.
 *
 * Simulates REST endpoints:
 *   POST   /bids               → place(dto)
 *   GET    /bids/listing/:id   → getByListing(listingId)
 *   GET    /bids/mine          → getMyBids()
 *   POST   /bids/:id/accept    → accept(bidId)
 *   POST   /bids/:id/reject    → reject(bidId)
 *
 * Transactional operations:
 *   accept() → in one Dexie transaction: update bid, reject competitors,
 *              create order, send system messages, create notifications.
 */
import { db } from '@/db/database';
import { bidRepository } from '@/repositories/bid.repository';
import { listingRepository } from '@/repositories/listing.repository';
import { orderRepository } from '@/repositories/order.repository';
import { conversationRepository } from '@/repositories/conversation.repository';
import { messageRepository } from '@/repositories/message.repository';
import { notificationRepository } from '@/repositories/notification.repository';
import { userRepository } from '@/repositories/user.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import type { CreateBidDTO } from '@/models/bid.model';
import type { Bid } from '@/models/bid.model';
import type { Order } from '@/models/order.model';
import type { Message } from '@/models/message.model';
import type { Notification } from '@/models/notification.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

async function clearBidNotificationsForUser(userId: string, bidId: string) {
  const notifications = await notificationRepository.findByUser(userId);
  const related = notifications.filter(
    (n) => n.relatedEntityType === 'bid' && n.relatedEntityId === bidId
  );
  await Promise.all(related.map((n) => notificationRepository.delete(n.id)));
}

/**
 * Place a bid on a listing.
 *
 * Validates:
 * - User is authenticated
 * - Listing exists and is active
 * - User is not the seller (can't bid on own listing)
 * - Bid amount >= listing's negotiableMinPrice (if set)
 * - User doesn't already have a pending bid on this listing
 *
 * Side effects:
 * - Creates or finds existing conversation between buyer and seller
 * - Sends a system message in the conversation
 * - Creates a notification for the seller
 * - Emits BID_PLACED event
 *
 * @throws ApiError(400) if bid amount is below minimum
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(403) if bidding on own listing
 * @throws ApiError(404) if listing not found
 * @throws ApiError(409) if already has pending bid
 */
export async function place(dto: CreateBidDTO) {
  await simulateLatency(150, 300);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in to place a bid');
  }

  const listing = await listingRepository.getById(dto.listingId);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }
  if (listing.status !== 'active') {
    throwApiError(400, 'This listing is no longer active');
  }
  if (listing.sellerId === bidderId) {
    throwApiError(403, 'You cannot bid on your own listing');
  }

  const listingOrders = await orderRepository.findByListing(dto.listingId);
  const hasOpenOrder = listingOrders.some((order) => order.status === 'pending' || order.status === 'confirmed');
  if (hasOpenOrder) {
    throwApiError(400, 'This listing is already in an active meetup workflow');
  }

  // Validate bid amount against minimum
  if (!dto.isBuyNow && listing.negotiableMinPrice !== null && dto.amount < listing.negotiableMinPrice) {
    throwApiError(400, `Bid amount must be at least ₹${listing.negotiableMinPrice}`);
  }

  // Validate bid amount against MRP
  if (!dto.isBuyNow && dto.amount > listing.mrp) {
    throwApiError(400, `Bid amount cannot exceed ₹${listing.mrp}`);
  }

  // Check for existing pending bid
  const hasPending = await bidRepository.hasPendingBid(dto.listingId, bidderId);
  if (hasPending) {
    throwApiError(409, 'You already have a pending bid on this listing');
  }

  const now = timestamp();
  const bid: Bid = {
    id: generateId('bid'),
    listingId: dto.listingId,
    bidderId,
    amount: dto.isBuyNow ? listing.price : dto.amount,
    isBuyNow: dto.isBuyNow,
    message: dto.message,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await bidRepository.create(bid);

  // Create/find conversation and send system message
  const conversation = await conversationRepository.findOrCreate(
    bidderId,
    listing.sellerId,
    listing.id
  );

  const bidder = await userRepository.getById(bidderId);
  const bidderName = bidder?.name ?? 'Someone';
  const bidTypeLabel = dto.isBuyNow ? 'wants to Buy Now' : `placed a bid of ₹${bid.amount}`;

  const systemMsg: Message = {
    id: generateId('msg'),
    conversationId: conversation.id,
    senderId: 'system',
    content: `🛒 ${bidderName} ${bidTypeLabel} on "${listing.title}"`,
    type: 'bid_notification',
    metadata: { bidId: bid.id, amount: bid.amount, isBuyNow: dto.isBuyNow, actorId: bidderId },
    isRead: false,
    createdAt: now,
  };
  await messageRepository.create(systemMsg);

  // Send "wait for meetup details" message
  const waitMsg: Message = {
    id: generateId('msg'),
    conversationId: conversation.id,
    senderId: 'system',
    content: '⏳ Wait until the seller sends meetup details.',
    type: 'system',
    metadata: { actorId: listing.sellerId },
    isRead: false,
    createdAt: new Date(Date.now() + 1000).toISOString(), // 1s after
  };
  await messageRepository.create(waitMsg);

  await conversationRepository.updateLastMessage(conversation.id);

  // Notification for seller
  const notification: Notification = {
    id: generateId('notif'),
    userId: listing.sellerId,
    type: 'bid',
    title: dto.isBuyNow ? 'New Buy Now request!' : 'New bid received!',
    content: `${bidderName} ${bidTypeLabel} on "${listing.title}"`,
    link: `/listings/${listing.id}/bids`,
    isRead: false,
    relatedEntityId: bid.id,
    relatedEntityType: 'bid',
    createdAt: now,
  };
  await notificationRepository.create(notification);

  // Emit events
  eventBus.emit(EVENTS.BID_PLACED, {
    bidId: bid.id,
    listingId: listing.id,
    bidderId,
    amount: bid.amount,
  });
  eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
    messageId: systemMsg.id,
    conversationId: conversation.id,
    senderId: 'system',
  });
  eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
    notificationId: notification.id,
    userId: listing.sellerId,
    type: 'bid',
  });

  return wrapResponse(bid);
}

/**
 * Get all bids for a specific listing (seller view).
 * Returns bids with bidder information joined.
 */
export async function getByListing(listingId: string) {
  await simulateLatency(80, 150);

  const bids = await bidRepository.findByListing(listingId);

  // Join bidder information + linked order status
  const enrichedBids = await Promise.all(
    bids.map(async (bid) => {
      const [bidder, linkedOrder] = await Promise.all([
        userRepository.getById(bid.bidderId),
        orderRepository.findByBid(bid.id),
      ]);
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
              isVerified: bidder.isVerified,
              rating: bidder.rating,
              major: bidder.major,
              year: bidder.year,
            }
          : null,
      };
    })
  );

  return wrapResponse(enrichedBids);
}

/**
 * Get all bids placed by the current user.
 */
export async function getMyBids() {
  await simulateLatency(80, 150);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in');
  }

  const bids = await bidRepository.findByBidder(bidderId);
  return wrapResponse(bids);
}

/**
 * Accept a bid — creates an order and rejects all other pending bids.
 *
 * Transactional: all or nothing.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(403) if not the listing owner
 * @throws ApiError(404) if bid not found
 * @throws ApiError(400) if bid is not in pending status
 */
export async function accept(bidId: string) {
  await simulateLatency(200, 400);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const bid = await bidRepository.getById(bidId);
  if (!bid) {
    throwApiError(404, 'Bid not found');
  }
  if (bid.status !== 'pending') {
    const existingOrder = await orderRepository.findByBid(bidId);
    if (existingOrder) {
      return wrapResponse({ success: true, orderId: existingOrder.id });
    }
    throwApiError(400, 'Bid is no longer pending');
  }

  const listing = await listingRepository.getById(bid.listingId);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }
  if (listing.sellerId !== sellerId) {
    throwApiError(403, 'You can only accept bids on your own listings');
  }

  const now = timestamp();
  let createdOrderId: string | null = null;

  // Execute in a Dexie transaction for atomicity
  await db.transaction('rw', [db.bids, db.orders, db.messages, db.conversations, db.notifications], async () => {
    // 1. Accept this bid
    await bidRepository.update(bidId, { status: 'pending', updatedAt: now });

    // 2. Reject all other pending bids for this listing
    await bidRepository.rejectAllExcept(bid.listingId, bidId);

    // 3. Create the order
    const order: Order = {
      id: generateId('ord'),
      listingId: bid.listingId,
      bidId: bid.id,
      buyerId: bid.bidderId,
      sellerId,
      agreedPrice: bid.amount,
      originalPrice: listing.price,
      status: 'pending',
      statusHistory: [
        { status: 'pending', timestamp: now, note: 'Bid accepted by seller' },
      ],
      deliveryMethod: 'campus_meetup',
      createdAt: now,
      updatedAt: now,
    };
    await orderRepository.create(order);
    createdOrderId = order.id;

    // 4. Send system message in conversation
    const conversation = await conversationRepository.findOrCreate(
      bid.bidderId,
      sellerId,
      bid.listingId
    );

    await conversationRepository.updateLastMessage(conversation.id);

    // 5. Notification for buyer
    const notification: Notification = {
      id: generateId('notif'),
      userId: bid.bidderId,
      type: 'order',
      title: 'Bid accepted!',
      content: `Your bid of ₹${bid.amount} on "${listing.title}" has been accepted!`,
      link: '/orders',
      isRead: false,
      relatedEntityId: order.id,
      relatedEntityType: 'order',
      createdAt: now,
    };
    await notificationRepository.create(notification);

    // Emit events
    eventBus.emit(EVENTS.BID_ACCEPTED, {
      bidId: bid.id,
      listingId: bid.listingId,
      bidderId: bid.bidderId,
      amount: bid.amount,
    });
    eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId: order.id,
      listingId: bid.listingId,
      buyerId: bid.bidderId,
      sellerId,
    });
    eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
      notificationId: notification.id,
      userId: bid.bidderId,
      type: 'order',
    });
  });

  return wrapResponse({ success: true, orderId: createdOrderId });
}

/**
 * Reject a bid.
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(403) if not the listing owner
 * @throws ApiError(404) if bid not found
 */
export async function reject(bidId: string) {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const bid = await bidRepository.getById(bidId);
  if (!bid) {
    throwApiError(404, 'Bid not found');
  }
  if (bid.status !== 'pending') {
    throwApiError(400, 'Bid is no longer pending');
  }

  const listing = await listingRepository.getById(bid.listingId);
  if (!listing || listing.sellerId !== sellerId) {
    throwApiError(403, 'You can only reject bids on your own listings');
  }

  const now = timestamp();
  await bidRepository.update(bidId, { status: 'rejected', updatedAt: now });
  await clearBidNotificationsForUser(sellerId, bid.id);

  const notification: Notification = {
    id: generateId('notif'),
    userId: bid.bidderId,
    type: 'bid',
    title: 'Bid rejected',
    content: 'Your bid was rejected by the seller.',
    link: '/orders',
    isRead: false,
    relatedEntityId: bid.id,
    relatedEntityType: 'bid',
    createdAt: now,
  };
  await notificationRepository.create(notification);

  eventBus.emit(EVENTS.BID_REJECTED, {
    bidId: bid.id,
    listingId: bid.listingId,
    bidderId: bid.bidderId,
    amount: bid.amount,
  });
  eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
    notificationId: notification.id,
    userId: bid.bidderId,
    type: 'bid',
  });

  return wrapResponse({ success: true });
}

/**
 * Cancel own pending bid (buyer action).
 */
export async function cancel(bidId: string) {
  await simulateLatency(80, 160);

  const bidderId = getCurrentUserId();
  if (!bidderId) {
    throwApiError(401, 'Must be logged in');
  }

  const bid = await bidRepository.getById(bidId);
  if (!bid) {
    throwApiError(404, 'Bid not found');
  }
  if (bid.bidderId !== bidderId) {
    throwApiError(403, 'You can only cancel your own bids');
  }
  if (bid.status !== 'pending') {
    throwApiError(400, 'Only pending bids can be cancelled');
  }

  const listing = await listingRepository.getById(bid.listingId);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }

  const now = timestamp();
  await bidRepository.update(bidId, { status: 'cancelled', updatedAt: now });
  await clearBidNotificationsForUser(listing.sellerId, bid.id);

  eventBus.emit(EVENTS.BID_REJECTED, {
    bidId: bid.id,
    listingId: bid.listingId,
    bidderId: bid.bidderId,
    amount: bid.amount,
  });

  return wrapResponse({ success: true });
}
