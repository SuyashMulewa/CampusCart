/**
 * Bid repository — data access for the `bids` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Bid } from '@/models/bid.model';
import { BaseRepository } from './base.repository';

class BidRepository extends BaseRepository<Bid> {
  constructor() {
    super(db.bids);
  }

  /** Find all bids for a specific listing, ordered by creation date descending. */
  async findByListing(listingId: string): Promise<Bid[]> {
    return this.table
      .where('listingId')
      .equals(listingId)
      .reverse()
      .sortBy('createdAt');
  }

  /** Find all bids placed by a specific user. */
  async findByBidder(bidderId: string): Promise<Bid[]> {
    return this.table.where('bidderId').equals(bidderId).toArray();
  }

  /** Find the highest-amount pending bid for a listing. */
  async findHighestForListing(listingId: string): Promise<Bid | undefined> {
    const bids = await this.table
      .where('listingId')
      .equals(listingId)
      .filter((b) => b.status === 'pending')
      .toArray();

    if (bids.length === 0) return undefined;
    return bids.reduce((max, bid) => (bid.amount > max.amount ? bid : max), bids[0]);
  }

  /** Count the number of pending bids for a listing. */
  async countByListing(listingId: string): Promise<number> {
    return this.table
      .where('listingId')
      .equals(listingId)
      .filter((b) => b.status === 'pending')
      .count();
  }

  /** Reject all pending bids for a listing except the accepted one. */
  async rejectAllExcept(listingId: string, acceptedBidId: string): Promise<void> {
    const pendingBids = await this.table
      .where('listingId')
      .equals(listingId)
      .filter((b) => b.status === 'pending' && b.id !== acceptedBidId)
      .toArray();

    const now = new Date().toISOString();
    await Promise.all(
      pendingBids.map((bid) =>
        this.table.update(bid.id, { status: 'rejected', updatedAt: now })
      )
    );
  }

  /** Check if a user already has a pending bid on a listing. */
  async hasPendingBid(listingId: string, bidderId: string): Promise<boolean> {
    const count = await this.table
      .where('listingId')
      .equals(listingId)
      .filter((b) => b.bidderId === bidderId && b.status === 'pending')
      .count();
    return count > 0;
  }
}

export const bidRepository = new BidRepository();
