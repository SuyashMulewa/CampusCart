/**
 * Meetup service — scheduling and confirming physical meetups.
 *
 * Simulates REST endpoints:
 *   POST   /meetups              → propose(dto)
 *   POST   /meetups/:id/confirm  → confirm(meetupId)
 *   GET    /meetups/order/:id    → getByOrder(orderId)
 *
 * When both parties confirm, the meetup locks and an OTP is generated.
 */
import { meetupRepository } from '@/repositories/meetup.repository';
import { orderRepository } from '@/repositories/order.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import { confirm as confirmOrder } from './order.service';
import { generate as generateOtp } from './otp.service';
import { sendSystemMessage } from './chat.service';
import type { Meetup, ProposeMeetupDTO } from '@/models/meetup.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

/**
 * Propose meetup details for an order.
 * Creates a new meetup record and sends a meetup proposal message.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(404) if order not found
 * @throws ApiError(400) if a meetup already exists for this order
 */
export async function propose(dto: ProposeMeetupDTO) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const order = await orderRepository.getById(dto.orderId);
  if (!order) throwApiError(404, 'Order not found');

  // Check if meetup already exists
  const existing = await meetupRepository.findByOrder(dto.orderId);
  if (existing && existing.status !== 'cancelled') {
    // Update existing meetup instead of creating new
    await meetupRepository.update(existing.id, {
      location: dto.location,
      date: dto.date,
      time: dto.time,
      proposedBy: userId,
      // Sending details should not auto-confirm either party.
      // Both buyer and seller must explicitly confirm in chat.
      buyerConfirmed: false,
      sellerConfirmed: false,
      isLocked: false,
      status: 'proposed',
      updatedAt: timestamp(),
    });

    const updated = await meetupRepository.getById(existing.id);

    // Send meetup proposal message
    await sendSystemMessage(
      dto.conversationId,
      `📍 Meetup Details Updated\n📌 ${dto.location}\n📅 ${dto.date}\n⏰ ${dto.time}`,
      'meetup_proposal',
      { location: dto.location, date: dto.date, time: dto.time, isMeetup: true }
    );

    eventBus.emit(EVENTS.MEETUP_PROPOSED, {
      meetupId: existing.id,
      orderId: dto.orderId,
      conversationId: dto.conversationId,
    });

    return wrapResponse(updated!);
  }

  const now = timestamp();
  const meetup: Meetup = {
    id: generateId('meet'),
    orderId: dto.orderId,
    conversationId: dto.conversationId,
    location: dto.location,
    date: dto.date,
    time: dto.time,
    proposedBy: userId,
    // Sending meetup details does not count as confirmation.
    buyerConfirmed: false,
    sellerConfirmed: false,
    isLocked: false,
    status: 'proposed',
    createdAt: now,
    updatedAt: now,
  };

  await meetupRepository.create(meetup);

  // Send meetup proposal message
  await sendSystemMessage(
    dto.conversationId,
    `📍 Meetup Details\n📌 ${dto.location}\n📅 ${dto.date}\n⏰ ${dto.time}`,
    'meetup_proposal',
    { location: dto.location, date: dto.date, time: dto.time, isMeetup: true }
  );

  eventBus.emit(EVENTS.MEETUP_PROPOSED, {
    meetupId: meetup.id,
    orderId: dto.orderId,
    conversationId: dto.conversationId,
  });

  return wrapResponse(meetup);
}

/**
 * Confirm the meetup from the current user's perspective.
 * If both parties have confirmed, the meetup locks and OTP is generated.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(404) if meetup not found
 */
export async function confirm(meetupId: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const meetup = await meetupRepository.getById(meetupId);
  if (!meetup) throwApiError(404, 'Meetup not found');

  const order = await orderRepository.getById(meetup.orderId);
  if (!order) throwApiError(404, 'Associated order not found');

  // Determine role
  const role = order.buyerId === userId ? 'buyer' : 'seller';

  // Confirm
  const updated = await meetupRepository.confirmByUser(meetupId, userId, role);

  // Send confirmation message
  await sendSystemMessage(
    meetup.conversationId,
    `✅ ${role === 'buyer' ? 'Buyer' : 'Seller'} confirmed the meetup!`,
    'system',
    { actorId: userId }
  );

  eventBus.emit(EVENTS.MEETUP_CONFIRMED, {
    meetupId,
    orderId: meetup.orderId,
    conversationId: meetup.conversationId,
  });

  // If both confirmed → lock meetup, confirm order, generate OTP
  if (updated.isLocked) {
    // Confirm the order (pending → confirmed)
    await confirmOrder(meetup.orderId);

    // Generate OTP for verification
    await generateOtp(meetupId, meetup.orderId);

    eventBus.emit(EVENTS.MEETUP_LOCKED, {
      meetupId,
      orderId: meetup.orderId,
      conversationId: meetup.conversationId,
    });
  }

  return wrapResponse(updated);
}

/**
 * Get the meetup details for a specific order.
 */
export async function getByOrder(orderId: string) {
  await simulateLatency(50, 100);

  const meetup = await meetupRepository.findByOrder(orderId);
  return wrapResponse(meetup ?? null);
}
