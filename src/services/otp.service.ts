/**
 * OTP service — generating and verifying hand-off codes (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from './auth.service';
import { sendSystemMessage } from './chat.service';
import type { OTP } from '@/models/otp.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const OTP_SELECT = `
  id,
  meetupId:meetup_id,
  orderId:order_id,
  code,
  isVerified:is_verified,
  generatedAt:generated_at,
  expiresAt:expires_at,
  verifiedAt:verified_at
`;

function toOtp(row: any): OTP {
  return {
    id: row.id,
    meetupId: row.meetupId,
    orderId: row.orderId,
    code: row.code,
    isVerified: !!row.isVerified,
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
    verifiedAt: row.verifiedAt ?? undefined,
  };
}

export async function generate(meetupId: string, orderId: string) {
  await simulateLatency(50, 150);

  const { data: existing } = await supabase
    .from('otps')
    .select(OTP_SELECT)
    .eq('meetup_id', meetupId)
    .maybeSingle();

  if (existing && !existing.isVerified) {
    return wrapResponse(toOtp(existing));
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from('otps')
    .insert({
      meetup_id: meetupId,
      order_id: orderId,
      code,
      is_verified: false,
      expires_at: expiresAt,
    })
    .select(OTP_SELECT)
    .single();

  if (insertError || !inserted) {
    throwApiError(500, insertError?.message || 'Failed to generate OTP');
  }

  const otp = toOtp(inserted);

  const [{ data: meetup }, { data: order }] = await Promise.all([
    supabase.from('meetups').select('conversation_id').eq('id', meetupId).maybeSingle(),
    supabase.from('orders').select('seller_id').eq('id', orderId).maybeSingle(),
  ]);

  if (meetup?.conversation_id) {
    await sendSystemMessage(
      meetup.conversation_id,
      '🔑 OTP generated! The buyer will share the code at the meetup for verification.',
      'otp_generated',
      { actorId: order?.seller_id },
    );
  }

  eventBus.emit(EVENTS.OTP_GENERATED, {
    otpId: otp.id,
    meetupId,
    orderId,
  });

  return wrapResponse(otp);
}

export async function verify(meetupId: string, code: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const [{ data: otpRow, error: otpError }, { data: meetup, error: meetupError }] = await Promise.all([
    supabase.from('otps').select(OTP_SELECT).eq('meetup_id', meetupId).single(),
    supabase.from('meetups').select('id, conversation_id, order_id').eq('id', meetupId).single(),
  ]);

  if (otpError || !otpRow) throwApiError(404, 'No OTP found for this meetup');
  if (meetupError || !meetup) throwApiError(404, 'Meetup not found');

  const otp = toOtp(otpRow);
  if (otp.isVerified) throwApiError(400, 'OTP already verified');

  const { data: orderBefore, error: orderError } = await supabase
    .from('orders')
    .select('id, listing_id, buyer_id, seller_id, status')
    .eq('id', otp.orderId)
    .single();

  if (orderError || !orderBefore) throwApiError(404, 'Order not found');
  const previousStatus = orderBefore.status;

  const { data: completedRows, error: verifyError } = await supabase.rpc('verify_otp_and_complete_order', {
    p_meetup_id: meetupId,
    p_code: code,
  });

  if (verifyError || !completedRows || !Array.isArray(completedRows) || completedRows.length === 0) {
    throwApiError(400, verifyError?.message || 'Could not verify OTP right now.');
  }

  const completed = completedRows[0];

  const [{ data: listing }, { data: listingBids }] = await Promise.all([
    supabase.from('listings').select('id, title').eq('id', completed.listing_id).maybeSingle(),
    supabase.from('bids').select('bidder_id').eq('listing_id', completed.listing_id),
  ]);

  const notifiedBidderIds = new Set<string>();
  const losingBidderIds = (listingBids ?? [])
    .map((bid: { bidder_id: string }) => bid.bidder_id)
    .filter((bidderId: string) => bidderId !== completed.buyer_id)
    .filter((bidderId: string) => {
      if (notifiedBidderIds.has(bidderId)) return false;
      notifiedBidderIds.add(bidderId);
      return true;
    });

  if (losingBidderIds.length > 0) {
    const notifications = losingBidderIds.map((bidderId) => ({
      user_id: bidderId,
      type: 'listing',
      title: 'Listing sold to another bidder',
      content: listing?.title
        ? `"${listing.title}" has been sold to another bidder.`
        : 'This listing has been sold to another bidder.',
      link: '/orders',
      is_read: false,
      related_entity_id: completed.listing_id,
      related_entity_type: 'listing',
    }));

    await supabase.from('notifications').insert(notifications);

    losingBidderIds.forEach((bidderId, index) => {
      eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
        notificationId: `listing-sold-${completed.listing_id}-${index}`,
        userId: bidderId,
        type: 'listing',
      });
    });
  }

  await sendSystemMessage(
    meetup.conversation_id,
    '🎉 OTP verified! Order is now complete. Don\'t forget to leave a review!',
    'otp_verified',
  );

  eventBus.emit(EVENTS.OTP_VERIFIED, {
    otpId: otp.id,
    meetupId,
    orderId: otp.orderId,
  });

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: otp.orderId,
    listingId: completed.listing_id,
    buyerId: completed.buyer_id,
    sellerId: completed.seller_id,
    status: 'completed',
    previousStatus,
  });

  return wrapResponse({ verified: true, orderId: otp.orderId });
}

export async function getByMeetup(meetupId: string, revealCode = false) {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('otps')
    .select(OTP_SELECT)
    .eq('meetup_id', meetupId)
    .maybeSingle();

  if (error) throwApiError(500, error.message);
  if (!data) return wrapResponse(null);

  const otp = toOtp(data);
  if (!revealCode) {
    return wrapResponse({ ...otp, code: '******' });
  }

  return wrapResponse(otp);
}
