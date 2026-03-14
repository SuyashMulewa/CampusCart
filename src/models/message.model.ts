/**
 * Message model — a single message within a conversation.
 *
 * The `type` field determines rendering (see MessageType enum):
 * - `text`: Standard chat bubble
 * - `system`: Gray centered status text
 * - `meetup_proposal`: Structured card with location/date + Confirm/Change buttons
 * - `meetup_confirmed`: Lock icon + confirmation text
 * - `bid_notification`: Bid amount card with link to listing
 * - `price_proposal`: Negotiation offer card with Accept/Decline
 *
 * The `metadata` field carries structured data for non-text messages:
 * - meetup_proposal: { location, date, time }
 * - bid_notification: { bidId, amount, isBuyNow }
 * - price_proposal: { proposedPrice }
 *
 * IndexedDB table: `messages`
 * Indexes: `++id, conversationId, senderId, createdAt`
 */
import type { MessageType } from './enums';

export interface MessageMetadata {
  /** User who initiated the action represented by this system message */
  actorId?: string;
  /** Meetup proposal fields */
  location?: string;
  date?: string;
  time?: string;
  /** Bid notification fields */
  bidId?: string;
  amount?: number;
  isBuyNow?: boolean;
  /** Price proposal fields */
  proposedPrice?: number;
  /** Generic flag for meetup-type messages */
  isMeetup?: boolean;
  /** User who proposed the meetup details */
  proposedBy?: string;
}

export interface Message {
  /** Primary key — e.g. 'msg-1709...' */
  id: string;
  /** FK → conversations.id */
  conversationId: string;
  /** FK → users.id (who sent this message). 'system' for auto-generated. */
  senderId: string;
  content: string;
  type: MessageType;
  /** Structured data for non-text messages */
  metadata?: MessageMetadata;
  isRead: boolean;
  createdAt: string;   // ISO 8601
}
