/**
 * Notification hooks — list, read, count.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '@/services/notification.service';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all notifications for the current user. */
export function useNotifications() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.NOTIFICATION_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  });

  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const res = await notificationService.getAll();
      return res.data;
    },
  });
}

/** Get the count of unread notifications. */
export function useUnreadNotificationCount() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.NOTIFICATION_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  });

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────

/** Mark a single notification as read. */
export function useMarkNotificationAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationService.markAsRead(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await notificationService.markAllAsRead();
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

/** Delete a single notification. */
export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationService.remove(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}
