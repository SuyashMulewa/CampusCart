/**
 * Bid hooks — placing, viewing, accepting, rejecting bids.
 *
 * Queries auto-invalidate when BidEvents fire.
 * Accepting a bid triggers cascading invalidation (orders, listings).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bidService from '@/services/bid.service';
import type { CreateBidDTO } from '@/models';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all bids for a specific listing (enriched with bidder info). */
export function useBidsForListing(listingId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.BID_PLACED, (payload) => {
    if (payload.listingId === listingId) {
      qc.invalidateQueries({ queryKey: queryKeys.bids.byListing(listingId!) });
    }
  });
  useEventSubscription(EVENTS.BID_ACCEPTED, (payload) => {
    if (payload.listingId === listingId) {
      qc.invalidateQueries({ queryKey: queryKeys.bids.byListing(listingId!) });
    }
  });
  useEventSubscription(EVENTS.BID_REJECTED, (payload) => {
    if (payload.listingId === listingId) {
      qc.invalidateQueries({ queryKey: queryKeys.bids.byListing(listingId!) });
    }
  });
  useEventSubscription(EVENTS.ORDER_STATUS_CHANGED, (payload) => {
    if (payload.listingId === listingId) {
      qc.invalidateQueries({ queryKey: queryKeys.bids.byListing(listingId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.bids.byListing(listingId ?? ''),
    queryFn: async () => {
      const res = await bidService.getByListing(listingId!);
      return res.data;
    },
    enabled: !!listingId,
  });
}

/** Get all bids placed by the current user. */
export function useMyBids() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.BID_PLACED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.bids.mine });
  });
  useEventSubscription(EVENTS.BID_ACCEPTED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.bids.mine });
  });
  useEventSubscription(EVENTS.BID_REJECTED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.bids.mine });
  });

  return useQuery({
    queryKey: queryKeys.bids.mine,
    queryFn: async () => {
      const res = await bidService.getMyBids();
      return res.data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────

/** Place a new bid on a listing. */
export function usePlaceBid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateBidDTO) => {
      const res = await bidService.place(dto);
      return res.data;
    },
    onSuccess: (_, dto) => {
      qc.invalidateQueries({ queryKey: queryKeys.bids.byListing(dto.listingId) });
      qc.invalidateQueries({ queryKey: queryKeys.bids.mine });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}

/**
 * Accept a bid — transactional: accepts bid, rejects competitors,
 * creates order, sends system messages, creates notifications.
 */
export function useAcceptBid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (bidId: string) => {
      const res = await bidService.accept(bidId);
      return res.data;
    },
    onSuccess: () => {
      // Cascading invalidation — accept creates an order and changes listing status
      qc.invalidateQueries({ queryKey: queryKeys.bids.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Reject a bid. */
export function useRejectBid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (bidId: string) => {
      const res = await bidService.reject(bidId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bids.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Cancel own pending bid. */
export function useCancelBid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (bidId: string) => {
      const res = await bidService.cancel(bidId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bids.all });
      qc.invalidateQueries({ queryKey: queryKeys.bids.mine });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
