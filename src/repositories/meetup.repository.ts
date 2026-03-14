/**
 * Meetup repository — data access for the `meetups` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Meetup } from '@/models/meetup.model';
import { BaseRepository } from './base.repository';

class MeetupRepository extends BaseRepository<Meetup> {
  constructor() {
    super(db.meetups);
  }

  /** Find the meetup for a specific order. */
  async findByOrder(orderId: string): Promise<Meetup | undefined> {
    return this.table.where('orderId').equals(orderId).first();
  }

  /** Find a meetup by its associated conversation. */
  async findByConversation(conversationId: string): Promise<Meetup | undefined> {
    return this.table.where('conversationId').equals(conversationId).first();
  }

  /**
   * Confirm the meetup from a specific user's perspective.
   * Sets buyerConfirmed or sellerConfirmed based on the role.
   * If both are now confirmed, sets isLocked = true and status = 'locked'.
   */
  async confirmByUser(
    meetupId: string,
    userId: string,
    role: 'buyer' | 'seller'
  ): Promise<Meetup> {
    const meetup = await this.table.get(meetupId);
    if (!meetup) throw new Error(`Meetup ${meetupId} not found`);

    const now = new Date().toISOString();
    const updates: Partial<Meetup> = {
      updatedAt: now,
    };

    if (role === 'buyer') {
      updates.buyerConfirmed = true;
    } else {
      updates.sellerConfirmed = true;
    }

    // Check if both parties have now confirmed
    const buyerOk = role === 'buyer' ? true : meetup.buyerConfirmed;
    const sellerOk = role === 'seller' ? true : meetup.sellerConfirmed;

    if (buyerOk && sellerOk) {
      updates.isLocked = true;
      updates.status = 'locked';
    } else {
      updates.status = 'confirmed';
    }

    await this.table.update(meetupId, updates);
    return (await this.table.get(meetupId))!;
  }
}

export const meetupRepository = new MeetupRepository();
