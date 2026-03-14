/**
 * Review hooks — submitting and querying reviews.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reviewService from '@/services/review.service';
import type { CreateReviewDTO } from '@/models';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all reviews for a user (as reviewee). */
export function useReviewsForUser(userId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.REVIEW_SUBMITTED, (payload) => {
    if (payload.revieweeId === userId) {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.forUser(userId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.reviews.forUser(userId ?? ''),
    queryFn: async () => {
      const res = await reviewService.getForUser(userId!);
      return res.data;
    },
    enabled: !!userId,
  });
}

/** Get reviews for a specific order. */
export function useReviewsForOrder(orderId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.REVIEW_SUBMITTED, (payload) => {
    if (payload.orderId === orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.forOrder(orderId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.reviews.forOrder(orderId ?? ''),
    queryFn: async () => {
      const res = await reviewService.getForOrder(orderId!);
      return res.data;
    },
    enabled: !!orderId,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Submit a review for a completed order. */
export function useSubmitReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateReviewDTO) => {
      const res = await reviewService.submit(dto);
      return res.data;
    },
    onSuccess: (_, dto) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.forOrder(dto.orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.reviews.forUser(dto.revieweeId) });
      qc.invalidateQueries({ queryKey: queryKeys.auth.profile(dto.revieweeId) });
    },
  });
}
