/**
 * Lightweight typed event bus for real-time UI updates.
 *
 * Architecture role:
 *   Service layer emits events after mutations (e.g., bid placed, order status changed).
 *   TanStack Query hooks subscribe to relevant events and auto-refetch/invalidate.
 *   This decouples services from UI rendering logic.
 *
 * Supabase migration path:
 *   Replace `eventBus.emit(event, payload)` calls in services with no-ops.
 *   Replace `eventBus.on(event, callback)` in hooks with:
 *     `supabase.channel('table').on('postgres_changes', { event: 'INSERT' }, callback)`
 *   The hook signatures stay identical.
 *
 * Usage:
 *   // In a service:
 *   eventBus.emit(EVENTS.BID_PLACED, { bidId, listingId, bidderId, amount });
 *
 *   // In a hook:
 *   useEventSubscription(EVENTS.BID_PLACED, (payload) => {
 *     queryClient.invalidateQueries({ queryKey: queryKeys.bids.byListing(payload.listingId) });
 *   });
 */
import type { EventMap } from './events';

type Callback<T = unknown> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Callback>>();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   * @param event - Event key from EVENTS constant
   * @param callback - Handler receiving the typed payload
   * @returns Unsubscribe function (call on cleanup/unmount)
   */
  on<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as Callback);

    // Return unsubscribe function
    return () => {
      set.delete(callback as Callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   * @param event - Event key from EVENTS constant
   * @param payload - Typed payload matching the event's interface
   */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;

    // Clone the set to avoid mutation during iteration
    for (const callback of [...set]) {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event (or all events if none specified).
   * Primarily used for testing/cleanup.
   */
  off<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /** Get the number of listeners for a given event (useful for debugging) */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/**
 * Singleton event bus instance.
 * Import everywhere: `import { eventBus } from '@/events/eventBus';`
 */
export const eventBus = new EventBus();
