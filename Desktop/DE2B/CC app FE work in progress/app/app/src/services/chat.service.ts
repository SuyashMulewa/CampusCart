/**
 * Chat service — conversations and messaging.
 *
 * Simulates REST endpoints:
 *   GET    /conversations         → getConversations()
 *   GET    /conversations/:id     → getOrCreateConversation(buyerId, sellerId, listingId)
 *   GET    /messages/:convId      → getMessages(convId, pagination)
 *   POST   /messages              → sendMessage(dto)
 *   POST   /messages/system       → sendSystemMessage(convId, type, metadata)
 *   PATCH  /messages/read/:convId → markAsRead(convId)
 */
import { conversationRepository } from '@/repositories/conversation.repository';
import { messageRepository } from '@/repositories/message.repository';
import { userRepository } from '@/repositories/user.repository';
import { listingRepository } from '@/repositories/listing.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import type { Conversation } from '@/models/conversation.model';
import type { Message, MessageMetadata } from '@/models/message.model';
import type { MessageType } from '@/models/enums';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

/** Enriched conversation with participant + listing data for UI */
export interface EnrichedConversation extends Conversation {
  /** The other participant (not the current user) */
  participant?: Awaited<ReturnType<typeof userRepository.getById>>;
  listing?: Awaited<ReturnType<typeof listingRepository.getById>>;
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Get all conversations for the current user, enriched with participant info.
 */
export async function getConversations() {
  await simulateLatency(80, 150);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const conversations = await conversationRepository.findByParticipant(userId);

  const enriched: EnrichedConversation[] = await Promise.all(
    conversations.map(async (conv) => {
      const otherId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      const [participant, listing, lastMessage, unreadCount] = await Promise.all([
        userRepository.getById(otherId),
        conv.listingId ? listingRepository.getById(conv.listingId) : undefined,
        messageRepository.getLastMessage(conv.id),
        messageRepository.countUnreadInConversation(conv.id, userId),
      ]);
      return { ...conv, participant, listing, lastMessage, unreadCount };
    })
  );

  return wrapResponse(enriched);
}

/**
 * Get or create a conversation between two users for a listing.
 */
export async function getOrCreateConversation(
  buyerId: string,
  sellerId: string,
  listingId?: string
) {
  await simulateLatency(50, 100);

  const conversation = await conversationRepository.findOrCreate(buyerId, sellerId, listingId);

  // Check if this is a new conversation
  const messages = await messageRepository.findByConversation(conversation.id, 1);
  if (messages.length === 0) {
    eventBus.emit(EVENTS.CONVERSATION_CREATED, {
      conversationId: conversation.id,
      buyerId,
      sellerId,
    });
  }

  return wrapResponse(conversation);
}

/**
 * Get messages for a conversation with pagination.
 */
export async function getMessages(conversationId: string, limit?: number, offset = 0) {
  await simulateLatency(50, 100);

  const messages = await messageRepository.findByConversation(conversationId, limit, offset);
  return wrapResponse(messages);
}

/**
 * Send a text message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  metadata?: MessageMetadata
) {
  await simulateLatency(50, 100);

  const senderId = getCurrentUserId();
  if (!senderId) throwApiError(401, 'Must be logged in');

  const msg: Message = {
    id: generateId('msg'),
    conversationId,
    senderId,
    content,
    type: metadata?.isMeetup ? 'meetup_proposal' : 'text',
    metadata,
    isRead: false,
    createdAt: timestamp(),
  };

  await messageRepository.create(msg);
  await conversationRepository.updateLastMessage(conversationId);

  eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
    messageId: msg.id,
    conversationId,
    senderId,
  });

  return wrapResponse(msg);
}

/**
 * Send a system-generated message (used by other services).
 * Does NOT require authentication — called internally.
 */
export async function sendSystemMessage(
  conversationId: string,
  content: string,
  type: MessageType = 'system',
  metadata?: MessageMetadata
) {
  const msg: Message = {
    id: generateId('msg'),
    conversationId,
    senderId: 'system',
    content,
    type,
    metadata,
    isRead: false,
    createdAt: timestamp(),
  };

  await messageRepository.create(msg);
  await conversationRepository.updateLastMessage(conversationId);

  eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
    messageId: msg.id,
    conversationId,
    senderId: 'system',
  });

  return msg;
}

/**
 * Mark all messages in a conversation as read for the current user.
 */
export async function markAsRead(conversationId: string) {
  await simulateLatency(30, 50);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  await messageRepository.markAsRead(conversationId, userId);
  return wrapResponse(null);
}

/**
 * Get the total unread message count across all conversations.
 */
export async function getUnreadCount() {
  const userId = getCurrentUserId();
  if (!userId) return wrapResponse(0);

  const count = await messageRepository.countUnread(userId);
  return wrapResponse(count);
}
