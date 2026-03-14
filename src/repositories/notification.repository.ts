/**
 * Notification repository — data access for the `notifications` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Notification } from '@/models/notification.model';
import { BaseRepository } from './base.repository';

class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(db.notifications);
  }

  /** Find all notifications for a user, ordered by newest first. */
  async findByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let collection = this.table.where('userId').equals(userId);

    if (unreadOnly) {
      collection = collection.filter((n) => !n.isRead);
    }

    return collection.reverse().sortBy('createdAt');
  }

  /** Count unread notifications for a user. */
  async countUnread(userId: string): Promise<number> {
    return this.table
      .where('userId')
      .equals(userId)
      .filter((n) => !n.isRead)
      .count();
  }

  /** Mark a single notification as read. */
  async markAsRead(id: string): Promise<void> {
    await this.table.update(id, { isRead: true });
  }

  /** Mark all notifications for a user as read. */
  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.table
      .where('userId')
      .equals(userId)
      .filter((n) => !n.isRead)
      .toArray();

    await Promise.all(unread.map((n) => this.table.update(n.id, { isRead: true })));
  }
}

export const notificationRepository = new NotificationRepository();
