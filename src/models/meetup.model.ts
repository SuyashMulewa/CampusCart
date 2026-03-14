/**
 * Meetup model — scheduled physical meeting for a transaction.
 *
 * Previously, meetup state was ephemeral local state inside QuickChatDialog
 * (location, date strings reset on every open). Now it's a persisted entity.
 *
 * Key rules:
 * - Created when a seller (or buyer) proposes meetup details via chat.
 * - Both `buyerConfirmed` and `sellerConfirmed` must be true for locking.
 * - Once locked, a countdown timer activates 1 hour before the meetup.
 * - The restricted authentication UI appears during that 1-hour window.
 *
 * IndexedDB table: `meetups`
 * Indexes: `++id, orderId, conversationId, status`
 */
import type { MeetupStatus } from './enums';

export interface Meetup {
  /** Primary key — e.g. 'meet-1709...' */
  id: string;
  /** FK → orders.id */
  orderId: string;
  /** FK → conversations.id */
  conversationId: string;
  /** Meetup location (e.g., "Main Library, Level 2") */
  location: string;
  /** Meetup date — ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** Meetup time — HH:MM format (24h) */
  time: string;
  /** FK → users.id — who proposed the current meetup details */
  proposedBy: string;
  /** Whether the buyer has confirmed the current proposal */
  buyerConfirmed: boolean;
  /** Whether the seller has confirmed the current proposal */
  sellerConfirmed: boolean;
  /** True once both parties confirm — triggers countdown + OTP generation */
  isLocked: boolean;
  status: MeetupStatus;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

/** Fields accepted when proposing a meetup */
export interface ProposeMeetupDTO {
  orderId: string;
  conversationId: string;
  location: string;
  date: string;
  time: string;
}
