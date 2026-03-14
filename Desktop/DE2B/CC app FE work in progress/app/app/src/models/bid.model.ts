/**
 * Bid model — a buyer's offer on a listing.
 *
 * This entity was previously missing from the codebase.
 * ProductDetailPage used to discard bid amounts and always create
 * orders at listing price. Now bids are first-class entities.
 *
 * Key rules:
 * - `amount` must be >= listing's `negotiableMinPrice` (validated by bid service).
 * - `isBuyNow` is true when buyer clicks "Buy Now" (amount = listing price).
 * - Only one bid per listing can have status 'accepted' at a time.
 * - Accepting a bid auto-rejects all competing pending bids.
 *
 * IndexedDB table: `bids`
 * Indexes: `++id, listingId, bidderId, status, createdAt`
 */
import type { BidStatus } from './enums';

export interface Bid {
  /** Primary key — e.g. 'bid-1709...', auto-generated */
  id: string;
  /** FK → listings.id */
  listingId: string;
  /** FK → users.id (the buyer) */
  bidderId: string;
  /** The offered price in ₹ */
  amount: number;
  /** Whether this was a "Buy Now" (full-price) bid */
  isBuyNow: boolean;
  /** Optional message from the buyer */
  message?: string;
  status: BidStatus;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

/** Fields accepted when placing a new bid */
export interface CreateBidDTO {
  listingId: string;
  amount: number;
  isBuyNow: boolean;
  message?: string;
}
