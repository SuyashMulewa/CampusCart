/**
 * Notification service — CRUD for user notifications (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from './auth.service';
import type { Notification, CreateNotificationDTO } from '@/models/notification.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const NOTIFICATION_SELECT = `
  id,
  userId:user_id,
  type,
  title,
  content,
  link,
  relatedEntityId:related_entity_id,
  relatedEntityType:related_entity_type,
  isRead:is_read,
  createdAt:created_at
`;

function toNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    content: row.content,
    link: row.link ?? undefined,
    relatedEntityId: row.relatedEntityId ?? undefined,
    relatedEntityType: row.relatedEntityType ?? undefined,
    isRead: !!row.isRead,
    createdAt: row.createdAt,
  };
}

export async function getAll() {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toNotification));
}

export async function markAsRead(id: string) {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !notification) throwApiError(404, 'Notification not found');
  if (notification.user_id !== userId) throwApiError(403, 'You can only update your own notifications');

  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throwApiError(500, error.message);

  return wrapResponse({ success: true });
}

export async function remove(id: string) {
  await simulateLatency(40, 80);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !notification) throwApiError(404, 'Notification not found');
  if (notification.user_id !== userId) throwApiError(403, 'You can only delete your own notifications');

  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throwApiError(500, error.message);

  return wrapResponse({ success: true });
}

export async function markAllAsRead() {
  await simulateLatency(50, 150);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throwApiError(500, error.message);

  return wrapResponse({ success: true });
}

export async function getUnreadCount() {
  await simulateLatency(30, 50);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throwApiError(500, error.message);
  return wrapResponse(count ?? 0);
}

export async function create(dto: CreateNotificationDTO) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: dto.userId,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      link: dto.link ?? null,
      related_entity_id: dto.relatedEntityId ?? null,
      related_entity_type: dto.relatedEntityType ?? null,
      is_read: false,
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error || !data) {
    throwApiError(500, error?.message || 'Failed to create notification');
  }

  const notification = toNotification(data);

  eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
    notificationId: notification.id,
    userId: dto.userId,
    type: dto.type,
  });

  return notification;
}
