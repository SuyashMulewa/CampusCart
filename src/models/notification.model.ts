/**
 * Notification model — user-facing alerts for key platform events.
 *
 * Previously disconnected: NotificationsPage used its own local copy
 * of mock notifications instead of NotificationContext. Now all
 * notifications flow through the service layer → IndexedDB → hooks.
 *
 * IndexedDB table: `notifications`
 * Indexes: `++id, userId, isRead, createdAt`
 */
import type { NotificationType } from './enums';

export interface Notification {
  /** Primary key — e.g. 'notif-1709...' */
  id: string;
  /** FK → users.id (recipient) */
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  /** Deep link path (e.g., '/orders', '/messages/conv-123') */
  link?: string;
  isRead: boolean;
  /** FK to the related entity for deep navigation */
  relatedEntityId?: string;
  /** Type of the related entity (order, listing, conversation, etc.) */
  relatedEntityType?: string;
  createdAt: string;   // ISO 8601
}

/** Fields accepted when creating a notification */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}
