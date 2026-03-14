/**
 * Message repository — data access for the `messages` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Message } from '@/models/message.model';
import { BaseRepository } from './base.repository';

class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(db.messages);
  }

  /**
   * Find all messages in a conversation, ordered by creation time ascending.
   * Supports pagination via limit + offset.
   */
  async findByConversation(conversationId: string, limit?: number, offset = 0): Promise<Message[]> {
    let collection = this.table
      .where('conversationId')
      .equals(conversationId)
      .offset(offset);

    if (limit) {
      collection = collection.limit(limit);
    }

    return collection.sortBy('createdAt');
  }

  /** Get the most recent message in a conversation. */
  async getLastMessage(conversationId: string): Promise<Message | undefined> {
    const messages = await this.table
      .where('conversationId')
      .equals(conversationId)
      .reverse()
      .sortBy('createdAt');
    return messages[0];
  }

  /** Mark all messages in a conversation as read for a specific user. */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const unreadMessages = await this.table
      .where('conversationId')
      .equals(conversationId)
      .filter((m) => !m.isRead && m.senderId !== userId)
      .toArray();

    await Promise.all(
      unreadMessages.map((m) => this.table.update(m.id, { isRead: true }))
    );
  }

  /** Count unread messages across all conversations for a user. */
  async countUnread(userId: string): Promise<number> {
    // Get all conversations where this user is a participant
    const conversations = await db.conversations
      .where('buyerId')
      .equals(userId)
      .or('sellerId')
      .equals(userId)
      .toArray();

    const convIds = new Set(conversations.map((c) => c.id));

    return this.table
      .filter((m) => convIds.has(m.conversationId) && !m.isRead && m.senderId !== userId)
      .count();
  }

  /** Count unread messages in a specific conversation for a user. */
  async countUnreadInConversation(conversationId: string, userId: string): Promise<number> {
    return this.table
      .where('conversationId')
      .equals(conversationId)
      .filter((m) => !m.isRead && m.senderId !== userId)
      .count();
  }
}

export const messageRepository = new MessageRepository();
