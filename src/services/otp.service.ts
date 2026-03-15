/**
 * OTP service — generating and verifying hand-off codes.
 *
 * Simulates REST endpoints:
 *   POST   /otp/generate    → generate(meetupId, orderId)
 *   POST   /otp/verify      → verify(meetupId, code)
 *   GET    /otp/:meetupId    → getByMeetup(meetupId)
 *
 * When OTP is verified, the order is completed and the listing marked as sold.
 */
import { otpRepository } from '@/repositories/otp.repository';
import { orderRepository } from '@/repositories/order.repository';
import { listingRepository } from '@/repositories/listing.repository';
import { meetupRepository } from '@/repositories/meetup.repository';
import { bidRepository } from '@/repositories/bid.repository';
import { notificationRepository } from '@/repositories/notification.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import { sendSystemMessage } from './chat.service';
import type { OTP } from '@/models/otp.model';
import type { Notification } from '@/models/notification.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

/**
 * Generate a 6-digit OTP for a locked meetup.
 * The code expires in 30 minutes.
 *
 * @throws ApiError(400) if OTP already generated for this meetup
 */
export async function generate(meetupId: string, orderId: string) {
  await simulateLatency(50, 150);

  // Check if OTP already exists and is not verified
  const existing = await otpRepository.findByMeetup(meetupId);
  if (existing && !existing.isVerified) {
    return wrapResponse(existing);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const now = timestamp();

  const otp: OTP = {
    id: generateId('otp'),
    meetupId,
    orderId,
    code,
    isVerified: false,
    generatedAt: now,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };

  await otpRepository.create(otp);

  // Notify via system message — code is visible to seller in their UI
  const meetup = await meetupRepository.getById(meetupId);
  if (meetup) {
    const order = await orderRepository.getById(orderId);
    await sendSystemMessage(
      meetup.conversationId,
      '🔑 OTP generated! The buyer will share the code at the meetup for verification.',
      'otp_generated',
      { actorId: order?.sellerId }
    );
  }

  eventBus.emit(EVENTS.OTP_GENERATED, {
    otpId: otp.id,
    meetupId,
    orderId,
  });

  return wrapResponse(otp);
}

/**
 * Verify the OTP code entered by the buyer.
 * On success: marks OTP verified, completes order, marks listing as sold.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(404) if no OTP found for the meetup
 * @throws ApiError(400) if code is incorrect or expired
 */
export async function verify(meetupId: string, code: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const otp = await otpRepository.findByMeetup(meetupId);
  if (!otp) throwApiError(404, 'No OTP found for this meetup');

  if (otp.isVerified) throwApiError(400, 'OTP already verified');

  // Check expiration
  if (new Date(otp.expiresAt) < new Date()) {
    throwApiError(400, 'OTP has expired');
  }

  // Check code
  if (otp.code !== code) {
    throwApiError(400, 'Incorrect OTP code');
  }

  // Mark OTP as verified
  await otpRepository.verify(meetupId, code);

  // Complete the order (confirmed → completed via state machine)
  const order = await orderRepository.getById(otp.orderId);
  if (order) {
    const previousStatus = order.status;

    await orderRepository.updateStatus(otp.orderId, 'completed', 'VERIFY_OTP');
    if (order.bidId) {
      await bidRepository.update(order.bidId, {
        status: 'completed',
        updatedAt: timestamp(),
      });
    }
    // Mark listing as sold
    await listingRepository.update(order.listingId, {
      status: 'sold',
      updatedAt: timestamp(),
    });

    // Notify all other interested bidders that the item has been sold.
    const listing = await listingRepository.getById(order.listingId);
    const allListingBids = await bidRepository.findByListing(order.listingId);
    const notifiedBidderIds = new Set<string>();
    const losingBidderIds = allListingBids
      .map((bid) => bid.bidderId)
      .filter((bidderId) => bidderId !== order.buyerId)
      .filter((bidderId) => {
        if (notifiedBidderIds.has(bidderId)) return false;
        notifiedBidderIds.add(bidderId);
        return true;
      });

    if (losingBidderIds.length > 0) {
      const now = timestamp();
      const soldNotifications: Notification[] = losingBidderIds.map((bidderId) => ({
        id: generateId('notif'),
        userId: bidderId,
        type: 'listing',
        title: 'Listing sold to another bidder',
        content: listing?.title
          ? `"${listing.title}" has been sold to another bidder.`
          : 'This listing has been sold to another bidder.',
        link: '/orders',
        isRead: false,
        relatedEntityId: order.listingId,
        relatedEntityType: 'listing',
        createdAt: now,
      }));

      await Promise.all(soldNotifications.map((notification) => notificationRepository.create(notification)));

      soldNotifications.forEach((notification) => {
        eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
          notificationId: notification.id,
          userId: notification.userId,
          type: 'listing',
        });
      });
    }

    // Update meetup status
    await meetupRepository.update(meetupId, {
      status: 'completed',
      updatedAt: timestamp(),
    });

    // System message
    const meetup = await meetupRepository.getById(meetupId);
    if (meetup) {
      await sendSystemMessage(
        meetup.conversationId,
        '🎉 OTP verified! Order is now complete. Don\'t forget to leave a review!',
        'otp_verified'
      );
    }

    eventBus.emit(EVENTS.OTP_VERIFIED, {
      otpId: otp.id,
      meetupId,
      orderId: otp.orderId,
    });

    eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
      orderId: otp.orderId,
      listingId: order.listingId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: 'completed',
      previousStatus,
    });
  }

  return wrapResponse({ verified: true, orderId: otp.orderId });
}

/**
 * Get the OTP record for a meetup.
 * The code is masked unless caller explicitly requests reveal.
 */
export async function getByMeetup(meetupId: string, revealCode: boolean = false) {
  await simulateLatency(50, 100);

  const otp = await otpRepository.findByMeetup(meetupId);
  if (!otp) return wrapResponse(null);

  if (!revealCode) {
    return wrapResponse({ ...otp, code: '******' });
  }

  return wrapResponse(otp);
}
