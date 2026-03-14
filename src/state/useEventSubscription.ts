/**
 * useEventSubscription — subscribe to EventBus events inside React components.
 *
 * Automatically subscribes on mount and unsubscribes on unmount.
 * Commonly used inside other hooks to auto-invalidate queries when
 * the service layer emits mutation events.
 *
 * Usage:
 *   useEventSubscription(EVENTS.BID_PLACED, (payload) => {
 *     queryClient.invalidateQueries({ queryKey: queryKeys.bids.byListing(payload.listingId) });
 *   });
 *
 * Supabase migration:
 *   Replace with supabase.channel().on('postgres_changes', ...) inside useEffect.
 */
import { useEffect } from 'react';
import { eventBus } from '@/events/eventBus';
import type { EventMap } from '@/events/events';

/**
 * Subscribe to a typed EventBus event. Cleanup is automatic.
 *
 * @param event - Event key from EVENTS constant
 * @param handler - Callback receiving the typed payload
 * @param enabled - Gate to conditionally disable subscription (default: true)
 */
export function useEventSubscription<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const unsub = eventBus.on(event, handler);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, enabled]);
}
