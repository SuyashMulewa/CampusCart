/**
 * Conversation model — a chat thread between a buyer and seller.
 *
 * Conversations are scoped to a specific listing. A new conversation
 * is auto-created when a bid is placed (if one doesn't already exist
 * for that buyer+seller+listing combination).
 *
 * IndexedDB table: `conversations`
 * Indexes: `++id, [buyerId+sellerId+listingId], buyerId, sellerId`
 */

export interface Conversation {
  /** Primary key — e.g. 'conv-1709...' */
  id: string;
  /** FK → users.id (the buyer in this conversation) */
  buyerId: string;
  /** FK → users.id (the seller in this conversation) */
  sellerId: string;
  /** FK → listings.id — optional, some conversations may be general */
  listingId?: string;
  /** ISO 8601 timestamp of the most recent message */
  lastMessageAt: string;
  createdAt: string;   // ISO 8601
}
