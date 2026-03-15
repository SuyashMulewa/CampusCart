/**
 * Order service — order lifecycle management.
 *
 * Simulates REST endpoints:
 *   GET    /orders/buyer     → getByBuyer()
 *   GET    /orders/seller    → getBySeller()
 *   GET    /orders/:id       → getById(id)
 *   POST   /orders/:id/cancel → cancel(id)
 *   POST   /orders/:id/confirm → confirm(id)  (internal — called by meetup flow)
 *   POST   /orders/:id/complete → complete(id) (internal — called by OTP verify)
 *
 * All status transitions are validated by the order state machine.
 */
import { orderRepository } from '@/repositories/order.repository';
import { listingRepository } from '@/repositories/listing.repository';
import { bidRepository } from '@/repositories/bid.repository';
import { userRepository } from '@/repositories/user.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { transitionOrder } from '@/utils/orderStateMachine';
import { getCurrentUserId } from './auth.service';
import type { Order } from '@/models/order.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

/** Enriched order with joined user and listing data for UI display */
export interface EnrichedOrder extends Order {
  listing?: Awaited<ReturnType<typeof listingRepository.getById>>;
  buyer?: Awaited<ReturnType<typeof userRepository.getById>>;
  seller?: Awaited<ReturnType<typeof userRepository.getById>>;
}

/** Join listing, buyer, and seller data onto an order */
async function enrichOrder(order: Order): Promise<EnrichedOrder> {
  const [listing, buyer, seller] = await Promise.all([
    listingRepository.getById(order.listingId),
    userRepository.getById(order.buyerId),
    userRepository.getById(order.sellerId),
  ]);
  return { ...order, listing, buyer, seller };
}

/**
 * Get all orders where the current user is the buyer.
 */
export async function getByBuyer() {
  await simulateLatency(100, 200);

  const buyerId = getCurrentUserId();
  if (!buyerId) throwApiError(401, 'Must be logged in');

  const orders = await orderRepository.findByBuyer(buyerId);
  const enriched = await Promise.all(orders.map(enrichOrder));
  return wrapResponse(enriched);
}

/**
 * Get all orders where the current user is the seller.
 */
export async function getBySeller() {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) throwApiError(401, 'Must be logged in');

  const orders = await orderRepository.findBySeller(sellerId);
  const enriched = await Promise.all(orders.map(enrichOrder));
  return wrapResponse(enriched);
}

/**
 * Get a single order by ID with enriched data.
 * @throws ApiError(404) if not found
 * @throws ApiError(403) if user is not buyer or seller
 */
export async function getById(id: string) {
  await simulateLatency(50, 100);

  const order = await orderRepository.getById(id);
  if (!order) throwApiError(404, 'Order not found');

  const userId = getCurrentUserId();
  if (userId && order.buyerId !== userId && order.sellerId !== userId) {
    throwApiError(403, 'You do not have access to this order');
  }

  return wrapResponse(await enrichOrder(order));
}

/**
 * Cancel an order. Allowed by either buyer or seller.
 * State machine validates: pending → cancelled, confirmed → cancelled.
 *
 * @throws ApiError(400) if transition is invalid
 */
export async function cancel(id: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const order = await orderRepository.getById(id);
  if (!order) throwApiError(404, 'Order not found');
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throwApiError(403, 'You can only cancel your own orders');
  }

  // Validate state transition
  const result = transitionOrder(order.status, 'CANCEL');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const role = order.buyerId === userId ? 'buyer' : 'seller';
  const updated = await orderRepository.updateStatus(id, 'cancelled', `Cancelled by ${role}`);

  if (order.bidId) {
    await bidRepository.update(order.bidId, { status: 'cancelled', updatedAt: new Date().toISOString() });
  }

  // Restore listing to active if it was pending
  const listing = await listingRepository.getById(order.listingId);
  if (listing && listing.status === 'pending') {
    await listingRepository.update(order.listingId, { status: 'active' });
  }

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'cancelled',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}

/**
 * Confirm an order (internal — called when meetup is confirmed by both parties).
 * State machine validates: pending → confirmed.
 */
export async function confirm(id: string) {
  const order = await orderRepository.getById(id);
  if (!order) throwApiError(404, 'Order not found');

  const result = transitionOrder(order.status, 'ACCEPT_BID');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const updated = await orderRepository.updateStatus(id, 'confirmed', 'Meetup confirmed by both parties');

  if (order.bidId) {
    await bidRepository.update(order.bidId, { status: 'confirmed', updatedAt: new Date().toISOString() });
  }

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'confirmed',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}

/**
 * Complete an order (internal — called when OTP is verified).
 * State machine validates: confirmed → completed.
 * Also marks the listing as sold.
 */
export async function complete(id: string) {
  const order = await orderRepository.getById(id);
  if (!order) throwApiError(404, 'Order not found');

  const result = transitionOrder(order.status, 'VERIFY_OTP');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const updated = await orderRepository.updateStatus(id, 'completed', 'OTP verified at meetup');

  if (order.bidId) {
    await bidRepository.update(order.bidId, { status: 'completed', updatedAt: new Date().toISOString() });
  }

  // Mark listing as sold
  await listingRepository.update(order.listingId, { status: 'sold' });

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'completed',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}
