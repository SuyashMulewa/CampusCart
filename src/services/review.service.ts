/**
 * Review service — submitting and querying post-transaction reviews.
 *
 * Simulates REST endpoints:
 *   POST   /reviews                → submit(dto)
 *   GET    /reviews/user/:id       → getForUser(userId)
 *   GET    /reviews/order/:id      → getForOrder(orderId)
 */
import { reviewRepository } from '@/repositories/review.repository';
import { userRepository } from '@/repositories/user.repository';
import { orderRepository } from '@/repositories/order.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import type { Review, CreateReviewDTO } from '@/models/review.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

/**
 * Submit a review for a completed order.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(404) if order not found
 * @throws ApiError(400) if order is not completed
 * @throws ApiError(400) if user already reviewed this order
 */
export async function submit(dto: CreateReviewDTO) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const order = await orderRepository.getById(dto.orderId);
  if (!order) throwApiError(404, 'Order not found');

  if (order.status !== 'completed') {
    throwApiError(400, 'Can only review completed orders');
  }

  // Check if already reviewed
  const alreadyReviewed = await reviewRepository.findByOrder(dto.orderId, userId);
  if (alreadyReviewed) {
    throwApiError(400, 'You have already reviewed this order');
  }

  const now = timestamp();
  const review: Review = {
    id: generateId('rev'),
    orderId: dto.orderId,
    reviewerId: userId,
    revieweeId: dto.revieweeId,
    rating: dto.rating,
    comment: dto.comment ?? '',
    createdAt: now,
  };

  await reviewRepository.create(review);

  // Update reviewee's average rating
  const ratingStats = await reviewRepository.getAverageRating(dto.revieweeId);
  await userRepository.updateRating(dto.revieweeId, ratingStats.average, ratingStats.count);

  eventBus.emit(EVENTS.REVIEW_SUBMITTED, {
    reviewId: review.id,
    orderId: dto.orderId,
    revieweeId: dto.revieweeId,
  });

  return wrapResponse(review);
}

/**
 * Get all reviews for a specific user (as reviewee).
 */
export async function getForUser(userId: string) {
  await simulateLatency(50, 100);

  const reviews = await reviewRepository.findByReviewee(userId);
  return wrapResponse(reviews);
}

/**
 * Get reviews for a specific order.
 */
export async function getForOrder(orderId: string) {
  await simulateLatency(50, 100);

  const reviews = await reviewRepository.findByOrder(orderId);
  return wrapResponse(reviews);
}
