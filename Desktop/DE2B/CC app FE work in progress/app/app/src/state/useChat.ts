/**
 * Chat hooks — conversations, messages, sending, marking read.
 *
 * Message list auto-refetches on MESSAGE_RECEIVED events.
 * Conversation list auto-refetches on new conversations and messages.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatService from '@/services/chat.service';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all conversations for the current user (enriched). */
export function useConversations() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.CONVERSATION_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
  });
  useEventSubscription(EVENTS.MESSAGE_RECEIVED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
  });

  return useQuery({
    queryKey: queryKeys.chat.conversations,
    queryFn: async () => {
      const res = await chatService.getConversations();
      return res.data;
    },
  });
}

/** Get messages for a specific conversation. */
export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.MESSAGE_RECEIVED, (payload) => {
    if (payload.conversationId === conversationId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.chat.messages(conversationId ?? ''),
    queryFn: async () => {
      const res = await chatService.getMessages(conversationId!);
      return res.data;
    },
    enabled: !!conversationId,
    // Messages should refetch frequently in chat view
    staleTime: 5_000,
  });
}

/** Get total unread message count across all conversations. */
export function useUnreadMessageCount() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.MESSAGE_RECEIVED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
  });

  return useQuery({
    queryKey: queryKeys.chat.unreadCount,
    queryFn: async () => {
      const res = await chatService.getUnreadCount();
      return res.data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────

/** Send a message in a conversation. */
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      const res = await chatService.sendMessage(conversationId, content);
      return res.data;
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}

/** Mark all messages in a conversation as read. */
export function useMarkAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await chatService.markAsRead(conversationId);
      return res.data;
    },
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      qc.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
    },
  });
}

/** Get or create a conversation between two users for a listing. */
export function useGetOrCreateConversation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buyerId,
      sellerId,
      listingId,
    }: {
      buyerId: string;
      sellerId: string;
      listingId: string;
    }) => {
      const res = await chatService.getOrCreateConversation(buyerId, sellerId, listingId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}
