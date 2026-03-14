/**
 * Review model — post-transaction rating and comment.
 *
 * Previously, the review popup on HomePage fired but saved nothing.
 * Now reviews are persisted and used to calculate user ratings.
 *
 * Rules:
 * - Only one review per order per reviewer is allowed.
 * - Both buyer and seller can review each other (reviewerId ≠ revieweeId).
 * - Submitting a review triggers recalculation of the reviewee's average rating.
 *
 * IndexedDB table: `reviews`
 * Indexes: `++id, orderId, reviewerId, revieweeId`
 */

export interface Review {
  /** Primary key — e.g. 'rev-1709...' */
  id: string;
  /** FK → orders.id */
  orderId: string;
  /** FK → users.id (the person writing the review) */
  reviewerId: string;
  /** FK → users.id (the person being reviewed) */
  revieweeId: string;
  /** Rating from 1 to 5 */
  rating: number;
  /** Optional text comment */
  comment?: string;
  createdAt: string;   // ISO 8601
}

/** Fields accepted when submitting a review */
export interface CreateReviewDTO {
  orderId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}
