/**
 * Order hooks — buyer/seller orders, order details, cancellation.
 *
 * Orders auto-invalidate on status changes and OTP verification.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orderService from '@/services/order.service';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all orders where the current user is the buyer. */
export function useBuyerOrders() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.ORDER_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.orders.buyer });
  });
  useEventSubscription(EVENTS.ORDER_STATUS_CHANGED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.orders.buyer });
  });

  return useQuery({
    queryKey: queryKeys.orders.buyer,
    queryFn: async () => {
      const res = await orderService.getByBuyer();
      return res.data;
    },
  });
}

/** Get all orders where the current user is the seller. */
export function useSellerOrders() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.ORDER_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.orders.seller });
  });
  useEventSubscription(EVENTS.ORDER_STATUS_CHANGED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.orders.seller });
  });

  return useQuery({
    queryKey: queryKeys.orders.seller,
    queryFn: async () => {
      const res = await orderService.getBySeller();
      return res.data;
    },
  });
}

/** Get a single order by ID (enriched with listing + buyer + seller). */
export function useOrder(orderId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.ORDER_STATUS_CHANGED, (payload) => {
    if (payload.orderId === orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? ''),
    queryFn: async () => {
      const res = await orderService.getById(orderId!);
      return res.data;
    },
    enabled: !!orderId,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Cancel an order (buyer or seller can cancel pending/confirmed orders). */
export function useCancelOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await orderService.cancel(orderId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
    },
  });
}
