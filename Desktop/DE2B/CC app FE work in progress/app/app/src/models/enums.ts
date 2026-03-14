/**
 * Centralized enum definitions for all domain entities.
 * These enums enforce valid states across the entire application —
 * from IndexedDB storage to UI rendering to state-machine transitions.
 *
 * When swapping to Supabase, these map directly to PostgreSQL enum types.
 */

// ─── Listing ──────────────────────────────────────────────

/** Physical condition of a listed item */
export type ListingCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Used';

/** Lifecycle status of a listing */
export type ListingStatus = 'active' | 'sold' | 'pending' | 'deleted';

// ─── Bid ──────────────────────────────────────────────────

/** Status of a bid placed by a buyer */
export type BidStatus = 'pending' | 'accepted' | 'confirmed' | 'completed' | 'rejected' | 'cancelled' | 'expired';

// ─── Order ────────────────────────────────────────────────

/**
 * Order status lifecycle (state machine enforced):
 *   pending → confirmed → completed
 *              ↓
 *           cancelled
 *   pending → cancelled
 */
export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Actions that trigger order status transitions.
 * Used exclusively by the order state machine.
 */
export type OrderAction = 'ACCEPT_BID' | 'CANCEL' | 'VERIFY_OTP';

/** How the transaction is physically completed */
export type DeliveryMethod = 'campus_meetup' | 'pickup';

// ─── Meetup ───────────────────────────────────────────────

/**
 * Meetup scheduling status:
 *   proposed → confirmed → locked → completed
 *              ↓            ↓
 *           cancelled    cancelled
 */
export type MeetupStatus = 'proposed' | 'confirmed' | 'locked' | 'completed' | 'cancelled';

// ─── Chat / Messages ─────────────────────────────────────

/**
 * Message type determines how the message is rendered in the chat UI.
 * - text: Regular user-sent message
 * - system: Auto-generated status update
 * - meetup_proposal: Structured meetup details card with accept/change buttons
 * - meetup_confirmed: Lock notification
 * - bid_notification: Auto-generated when a bid is placed
 * - price_proposal: Negotiation price offer
 */
export type MessageType =
  | 'text'
  | 'system'
  | 'meetup_proposal'
  | 'meetup_confirmed'
  | 'otp_generated'
  | 'otp_verified'
  | 'bid_notification'
  | 'price_proposal';

// ─── Notification ─────────────────────────────────────────

/** Notification category — drives icon + color in the UI */
export type NotificationType = 'message' | 'order' | 'bid' | 'listing' | 'system';

// ─── User ─────────────────────────────────────────────────

/** Platform role. Currently all users are students; admin reserved for future moderation panel */
export type UserRole = 'student' | 'admin';
