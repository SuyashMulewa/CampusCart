/**
 * Review service — submitting and querying post-transaction reviews (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from './auth.service';
import type { Review, CreateReviewDTO } from '@/models/review.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const REVIEW_SELECT = `
  id,
  orderId:order_id,
  reviewerId:reviewer_id,
  revieweeId:reviewee_id,
  rating,
  comment,
  createdAt:created_at
`;

function toReview(row: any): Review {
  return {
    id: row.id,
    orderId: row.orderId,
    reviewerId: row.reviewerId,
    revieweeId: row.revieweeId,
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating),
    comment: row.comment ?? undefined,
    createdAt: row.createdAt,
  };
}

export async function submit(dto: CreateReviewDTO) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, buyer_id, seller_id')
    .eq('id', dto.orderId)
    .single();

  if (orderError || !order) throwApiError(404, 'Order not found');
  if (order.status !== 'completed') {
    throwApiError(400, 'Can only review completed orders');
  }
  if (userId !== order.buyer_id && userId !== order.seller_id) {
    throwApiError(403, 'You can only review orders you participated in');
  }
  if (dto.revieweeId !== order.buyer_id && dto.revieweeId !== order.seller_id) {
    throwApiError(400, 'Reviewee must be part of the order');
  }
  if (dto.revieweeId === userId) {
    throwApiError(400, 'You cannot review yourself');
  }

  const { data: alreadyReviewed } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', dto.orderId)
    .eq('reviewer_id', userId)
    .maybeSingle();

  if (alreadyReviewed) {
    throwApiError(400, 'You have already reviewed this order');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      order_id: dto.orderId,
      reviewer_id: userId,
      reviewee_id: dto.revieweeId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    })
    .select(REVIEW_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throwApiError(400, 'You have already reviewed this order');
    }
    throwApiError(500, error?.message || 'Failed to submit review');
  }

  const review = toReview(data);

  eventBus.emit(EVENTS.REVIEW_SUBMITTED, {
    reviewId: review.id,
    orderId: dto.orderId,
    revieweeId: dto.revieweeId,
  });

  return wrapResponse(review);
}

export async function getForUser(userId: string) {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toReview));
}

export async function getForOrder(orderId: string) {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toReview));
}
