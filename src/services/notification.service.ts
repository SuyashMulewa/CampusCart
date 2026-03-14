/**
 * Notification service — CRUD for user notifications.
 *
 * Simulates REST endpoints:
 *   GET    /notifications             → getAll()
 *   PUT    /notifications/:id/read    → markAsRead(id)
 *   PUT    /notifications/read-all    → markAllAsRead()
 *   POST   /notifications             → create(dto) — internal
 */
import { notificationRepository } from '@/repositories/notification.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import type { Notification, CreateNotificationDTO } from '@/models/notification.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

/**
 * Get all notifications for the current user, ordered by creation date (newest first).
 *
 * @throws ApiError(401) if not authenticated
 */
export async function getAll() {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const notifications = await notificationRepository.findByUser(userId);
  // Sort newest first
  notifications.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return wrapResponse(notifications);
}

/**
 * Mark a single notification as read.
 *
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(404) if notification not found
 */
export async function markAsRead(id: string) {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const notification = await notificationRepository.getById(id);
  if (!notification) throwApiError(404, 'Notification not found');

  await notificationRepository.markAsRead(id);

  return wrapResponse({ success: true });
}

/**
 * Delete a notification for the current user.
 */
export async function remove(id: string) {
  await simulateLatency(40, 80);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const notification = await notificationRepository.getById(id);
  if (!notification) throwApiError(404, 'Notification not found');
  if (notification.userId !== userId) throwApiError(403, 'You can only delete your own notifications');

  await notificationRepository.delete(id);
  return wrapResponse({ success: true });
}

/**
 * Mark all notifications for the current user as read.
 *
 * @throws ApiError(401) if not authenticated
 */
export async function markAllAsRead() {
  await simulateLatency(50, 150);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  await notificationRepository.markAllAsRead(userId);

  return wrapResponse({ success: true });
}

/**
 * Get the count of unread notifications for the current user.
 *
 * @throws ApiError(401) if not authenticated
 */
export async function getUnreadCount() {
  await simulateLatency(30, 50);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const count = await notificationRepository.countUnread(userId);
  return wrapResponse(count);
}

/**
 * Create a notification (internal — used by other services, not by UI directly).
 */
export async function create(dto: CreateNotificationDTO) {
  const now = timestamp();
  const notification: Notification = {
    id: generateId('notif'),
    userId: dto.userId,
    type: dto.type,
    title: dto.title,
    content: dto.content,
    relatedEntityId: dto.relatedEntityId,
    relatedEntityType: dto.relatedEntityType,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };

  await notificationRepository.create(notification);

  eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
    notificationId: notification.id,
    userId: dto.userId,
    type: dto.type,
  });

  return notification;
}
