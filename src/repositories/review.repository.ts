/**
 * Review repository — data access for the `reviews` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Review } from '@/models/review.model';
import { BaseRepository } from './base.repository';

class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super(db.reviews);
  }

  /** Find all reviews received by a specific user. */
  async findByReviewee(revieweeId: string): Promise<Review[]> {
    return this.table.where('revieweeId').equals(revieweeId).toArray();
  }

  /** Find all reviews written by a specific user. */
  async findByReviewer(reviewerId: string): Promise<Review[]> {
    return this.table.where('reviewerId').equals(reviewerId).toArray();
  }

  /** Find the review for a specific order by a specific reviewer. */
  async findByOrder(orderId: string, reviewerId?: string): Promise<Review | undefined> {
    if (reviewerId) {
      return this.table
        .where('orderId')
        .equals(orderId)
        .filter((r) => r.reviewerId === reviewerId)
        .first();
    }
    return this.table.where('orderId').equals(orderId).first();
  }

  /** Calculate the average rating for a user from all their received reviews. */
  async getAverageRating(revieweeId: string): Promise<{ average: number; count: number }> {
    const reviews = await this.findByReviewee(revieweeId);
    if (reviews.length === 0) return { average: 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10, // 1 decimal place
      count: reviews.length,
    };
  }
}

export const reviewRepository = new ReviewRepository();
