/**
 * User repository — data access for the `users` IndexedDB table.
 */
import { db } from '@/db/database';
import type { User } from '@/models/user.model';
import { BaseRepository } from './base.repository';

class UserRepository extends BaseRepository<User> {
  constructor() {
    super(db.users);
  }

  /** Find a user by email (unique index). */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.table.where('email').equals(email).first();
  }

  /** Find all users from a specific university. */
  async findByUniversity(university: string): Promise<User[]> {
    return this.table.where('university').equals(university).toArray();
  }

  /** Update a user's online status and lastSeen timestamp. */
  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.table.update(id, {
      isOnline,
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Recalculate and update a user's average rating from their reviews.
   * Called by review.service after a new review is submitted.
   */
  async updateRating(id: string, newRating: number, newReviewCount: number): Promise<void> {
    await this.table.update(id, {
      rating: newRating,
      reviewCount: newReviewCount,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const userRepository = new UserRepository();
