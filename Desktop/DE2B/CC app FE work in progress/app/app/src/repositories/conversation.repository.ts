/**
 * Conversation repository — data access for the `conversations` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Conversation } from '@/models/conversation.model';
import { BaseRepository } from './base.repository';

class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super(db.conversations);
  }

  /**
   * Find all conversations where the user is either buyer or seller.
   * Sorted by most recent message first.
   */
  async findByParticipant(userId: string): Promise<Conversation[]> {
    const asBuyer = await this.table.where('buyerId').equals(userId).toArray();
    const asSeller = await this.table.where('sellerId').equals(userId).toArray();

    // Merge and deduplicate by id
    const map = new Map<string, Conversation>();
    for (const conv of [...asBuyer, ...asSeller]) {
      map.set(conv.id, conv);
    }

    // Sort by lastMessageAt descending
    return [...map.values()].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  /**
   * Find an existing conversation between buyer + seller for a specific listing.
   * Uses the compound index [buyerId+sellerId+listingId].
   */
  async findByParticipants(buyerId: string, sellerId: string, listingId?: string): Promise<Conversation | undefined> {
    if (listingId) {
      return this.table
        .where('[buyerId+sellerId+listingId]')
        .equals([buyerId, sellerId, listingId])
        .first();
    }
    // Without listingId, find any conversation between these two users
    const convs = await this.table
      .where('buyerId')
      .equals(buyerId)
      .filter((c) => c.sellerId === sellerId)
      .toArray();
    return convs[0];
  }

  /**
   * Find or create a conversation between buyer and seller for a listing.
   * Returns existing conversation if one exists; creates new one if not.
   */
  async findOrCreate(buyerId: string, sellerId: string, listingId?: string): Promise<Conversation> {
    const existing = await this.findByParticipants(buyerId, sellerId, listingId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      buyerId,
      sellerId,
      listingId,
      lastMessageAt: now,
      createdAt: now,
    };

    await this.table.add(conversation);
    return conversation;
  }

  /** Update the lastMessageAt timestamp when a new message is sent. */
  async updateLastMessage(id: string): Promise<void> {
    await this.table.update(id, {
      lastMessageAt: new Date().toISOString(),
    });
  }
}

export const conversationRepository = new ConversationRepository();
