/**
 * Order model — created when a seller accepts a bid.
 *
 * Key design decisions:
 * - Uses FKs (`listingId`, `bidId`, `buyerId`, `sellerId`) instead of embedded objects.
 *   UI components join data via hooks (e.g., `useOrder(id)` returns enriched data).
 * - `statusHistory` provides an audit trail for every status change.
 *   Not displayed in the current UI, but essential for backend dispute resolution.
 * - Status transitions are enforced by the order state machine (see utils/orderStateMachine.ts).
 *
 * IndexedDB table: `orders`
 * Indexes: `++id, listingId, bidId, buyerId, sellerId, status, createdAt`
 */
import type { OrderStatus, DeliveryMethod } from './enums';

/** A single entry in the order's status history audit trail */
export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;  // ISO 8601
  note?: string;      // e.g. "Cancelled by buyer", "OTP verified"
}

export interface Order {
  /** Primary key — e.g. 'ord-1709...' */
  id: string;
  /** FK → listings.id */
  listingId: string;
  /** FK → bids.id (the accepted bid that created this order) */
  bidId: string;
  /** FK → users.id */
  buyerId: string;
  /** FK → users.id */
  sellerId: string;
  /** The price from the accepted bid */
  agreedPrice: number;
  /** Original listing price (for savings display) */
  originalPrice: number;
  status: OrderStatus;
  /** Audit trail — every status change is recorded */
  statusHistory: OrderStatusEntry[];
  deliveryMethod: DeliveryMethod;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
