/**
 * Order status state machine — enforces valid transitions.
 *
 * This is the single source of truth for which status changes are allowed.
 * All order status updates (in services, repositories, and UI) must go
 * through `transitionOrder()` to prevent invalid states.
 *
 * Valid transitions:
 *
 *   ┌─────────┐  ACCEPT_BID   ┌───────────┐  VERIFY_OTP  ┌───────────┐
 *   │ pending │──────────────→│ confirmed │────────────→│ completed │
 *   └─────────┘               └───────────┘              └───────────┘
 *       │                          │
 *       │ CANCEL                   │ CANCEL
 *       ▼                          ▼
 *   ┌───────────┐            ┌───────────┐
 *   │ cancelled │            │ cancelled │
 *   └───────────┘            └───────────┘
 *
 * Usage:
 *   const result = transitionOrder('pending', 'ACCEPT_BID');
 *   if (result.success) {
 *     // result.status === 'confirmed'
 *   } else {
 *     // result.error === 'Invalid transition: pending → ACCEPT_BID is not... '
 *   }
 */
import type { OrderStatus, OrderAction } from '@/models/enums';

// ─── Transition Table ───────────────────────────────────

/**
 * Defines all valid (currentStatus, action) → nextStatus mappings.
 * Any combination not listed here is an invalid transition.
 */
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderAction, OrderStatus>>> = {
  pending: {
    ACCEPT_BID: 'confirmed',
    CANCEL: 'cancelled',
  },
  confirmed: {
    VERIFY_OTP: 'completed',
    CANCEL: 'cancelled',
  },
  completed: {
    // Terminal state — no transitions allowed
  },
  cancelled: {
    // Terminal state — no transitions allowed
  },
};

// ─── Result Types ───────────────────────────────────────

export interface TransitionSuccess {
  success: true;
  status: OrderStatus;
}

export interface TransitionError {
  success: false;
  error: string;
  currentStatus: OrderStatus;
  attemptedAction: OrderAction;
}

export type TransitionResult = TransitionSuccess | TransitionError;

// ─── Public API ─────────────────────────────────────────

/**
 * Attempt to transition an order from its current status via the given action.
 *
 * @param currentStatus - The order's current status
 * @param action - The action being performed (ACCEPT_BID, CANCEL, VERIFY_OTP)
 * @returns TransitionSuccess with the new status, or TransitionError with reason
 *
 * @example
 * const result = transitionOrder('pending', 'ACCEPT_BID');
 * // → { success: true, status: 'confirmed' }
 *
 * const result2 = transitionOrder('completed', 'CANCEL');
 * // → { success: false, error: '...', currentStatus: 'completed', attemptedAction: 'CANCEL' }
 */
export function transitionOrder(currentStatus: OrderStatus, action: OrderAction): TransitionResult {
  const nextStatus = TRANSITIONS[currentStatus]?.[action];

  if (!nextStatus) {
    return {
      success: false,
      error: `Invalid transition: cannot perform "${action}" on order with status "${currentStatus}". ` +
        `Allowed actions for "${currentStatus}": ${
          Object.keys(TRANSITIONS[currentStatus] || {}).join(', ') || 'none (terminal state)'
        }`,
      currentStatus,
      attemptedAction: action,
    };
  }

  return {
    success: true,
    status: nextStatus,
  };
}

/**
 * Check whether a specific action is valid for the current order status.
 * Useful for conditionally showing/hiding UI buttons.
 *
 * @example
 * canTransition('pending', 'CANCEL') // → true
 * canTransition('completed', 'CANCEL') // → false
 */
export function canTransition(currentStatus: OrderStatus, action: OrderAction): boolean {
  return TRANSITIONS[currentStatus]?.[action] !== undefined;
}

/**
 * Get all valid actions for a given order status.
 * Useful for rendering available action buttons.
 *
 * @example
 * getAvailableActions('pending') // → ['ACCEPT_BID', 'CANCEL']
 * getAvailableActions('completed') // → []
 */
export function getAvailableActions(currentStatus: OrderStatus): OrderAction[] {
  return Object.keys(TRANSITIONS[currentStatus] || {}) as OrderAction[];
}
