/**
 * Chat service — conversations and messaging (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from './auth.service';
import type { MessageType } from '@/models/enums';
import type { Conversation } from '@/models/conversation.model';
import type { Message, MessageMetadata } from '@/models/message.model';
import type { Listing } from '@/models/listing.model';
import type { User } from '@/models/user.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const CONVERSATION_SELECT = `
  id,
  buyerId:buyer_id,
  sellerId:seller_id,
  listingId:listing_id,
  lastMessageAt:last_message_at,
  createdAt:created_at
`;

const MESSAGE_SELECT = `
  id,
  conversationId:conversation_id,
  senderId:sender_id,
  content,
  type,
  metadata,
  isRead:is_read,
  createdAt:created_at
`;

const USER_SELECT = `
  id,
  name,
  email,
  avatar,
  university,
  major,
  year,
  bio,
  phone,
  enrollmentNumber:enrollment_number,
  studentIdCardPhoto:student_id_card_photo,
  documentType:document_type,
  documentPhoto:document_photo,
  verificationSubmittedAt:verification_submitted_at,
  role,
  isVerified:is_verified,
  isOnline:is_online,
  lastSeen:last_seen,
  rating,
  reviewCount:review_count,
  joinedDate:joined_date,
  createdAt:created_at,
  updatedAt:updated_at
`;

const LISTING_SELECT = `
  id,
  sellerId:seller_id,
  title,
  description,
  price,
  mrp,
  negotiableMinPrice:negotiable_min_price,
  category,
  subcategory,
  condition,
  location,
  image,
  images,
  specifications,
  status,
  views,
  favorites,
  isNegotiable:is_negotiable,
  postedDate:posted_date,
  createdAt:created_at,
  updatedAt:updated_at
`;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toConversation(row: any): Conversation {
  return {
    id: row.id,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    listingId: row.listingId ?? undefined,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
  };
}

function toMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId ?? 'system',
    content: row.content,
    type: row.type,
    metadata: row.metadata ?? undefined,
    isRead: !!row.isRead,
    createdAt: row.createdAt,
  };
}

function toUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    university: row.university,
    major: row.major ?? undefined,
    year: row.year ?? undefined,
    bio: row.bio ?? undefined,
    phone: row.phone ?? undefined,
    enrollmentNumber: row.enrollmentNumber ?? undefined,
    studentIdCardPhoto: row.studentIdCardPhoto ?? undefined,
    documentType: row.documentType ?? undefined,
    documentPhoto: row.documentPhoto ?? undefined,
    verificationSubmittedAt: row.verificationSubmittedAt ?? undefined,
    role: row.role,
    isVerified: !!row.isVerified,
    isOnline: !!row.isOnline,
    lastSeen: row.lastSeen,
    rating: toNumber(row.rating),
    reviewCount: toNumber(row.reviewCount),
    joinedDate: row.joinedDate,
    passwordHash: '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toListing(row: any): Listing {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    price: toNumber(row.price),
    mrp: toNumber(row.mrp),
    negotiableMinPrice: row.negotiableMinPrice == null ? null : toNumber(row.negotiableMinPrice),
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    condition: row.condition,
    location: row.location,
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [],
    specifications: row.specifications ?? undefined,
    status: row.status,
    views: toNumber(row.views),
    favorites: toNumber(row.favorites),
    isNegotiable: !!row.isNegotiable,
    postedDate: row.postedDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function fetchUsersByIds(userIds: string[]): Promise<Map<string, User>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabase.from('users').select(USER_SELECT).in('id', userIds);
  if (error || !data) return new Map();
  return new Map(data.map((row) => {
    const user = toUser(row);
    return [user.id, user] as const;
  }));
}

async function fetchListingsByIds(listingIds: string[]): Promise<Map<string, Listing>> {
  if (listingIds.length === 0) return new Map();
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).in('id', listingIds);
  if (error || !data) return new Map();
  return new Map(data.map((row) => {
    const listing = toListing(row);
    return [listing.id, listing] as const;
  }));
}

async function getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
  const query = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .or(`sender_id.is.null,sender_id.neq.${userId}`);

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function getLastMessageForConversation(conversationId: string): Promise<Message | undefined> {
  const { data } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? toMessage(data) : undefined;
}

export interface EnrichedConversation extends Conversation {
  participant?: User | null;
  listing?: Listing | null;
  lastMessage?: Message;
  unreadCount: number;
}

export async function getConversations() {
  await simulateLatency(80, 150);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throwApiError(500, error.message);

  const conversations = (data ?? []).map(toConversation);
  const otherIds = Array.from(new Set(conversations.map((conv) => conv.buyerId === userId ? conv.sellerId : conv.buyerId)));
  const listingIds = Array.from(new Set(conversations.map((conv) => conv.listingId).filter(Boolean) as string[]));

  const [users, listings] = await Promise.all([
    fetchUsersByIds(otherIds),
    fetchListingsByIds(listingIds),
  ]);

  const enriched: EnrichedConversation[] = await Promise.all(
    conversations.map(async (conv) => {
      const otherId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      const [lastMessage, unreadCount] = await Promise.all([
        getLastMessageForConversation(conv.id),
        getUnreadCountForConversation(conv.id, userId),
      ]);

      return {
        ...conv,
        participant: users.get(otherId) ?? null,
        listing: conv.listingId ? listings.get(conv.listingId) ?? null : null,
        lastMessage,
        unreadCount,
      };
    }),
  );

  return wrapResponse(enriched);
}

export async function getOrCreateConversation(buyerId: string, sellerId: string, listingId?: string) {
  await simulateLatency(50, 100);

  let query = supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId);

  query = listingId ? query.eq('listing_id', listingId) : query.is('listing_id', null);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return wrapResponse(toConversation(existing));
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId ?? null,
      last_message_at: new Date().toISOString(),
    })
    .select(CONVERSATION_SELECT)
    .single();

  if (error) {
    let retryQuery = supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId);

    retryQuery = listingId ? retryQuery.eq('listing_id', listingId) : retryQuery.is('listing_id', null);
    const { data: retried } = await retryQuery.maybeSingle();
    if (retried) {
      return wrapResponse(toConversation(retried));
    }
    throwApiError(500, error.message);
  }

  eventBus.emit(EVENTS.CONVERSATION_CREATED, {
    conversationId: created.id,
    buyerId,
    sellerId,
  });

  return wrapResponse(toConversation(created));
}

export async function getMessages(conversationId: string, limit?: number, offset = 0) {
  await simulateLatency(50, 100);

  let query = supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toMessage));
}

export async function sendMessage(conversationId: string, content: string, metadata?: MessageMetadata) {
  await simulateLatency(50, 100);

  const senderId = getCurrentUserId();
  if (!senderId) throwApiError(401, 'Must be logged in');

  const payload = {
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    type: metadata?.isMeetup ? 'meetup_proposal' : 'text',
    metadata: metadata ?? null,
    is_read: false,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) throwApiError(500, error?.message || 'Failed to send message');

  const msg = toMessage(data);
  eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
    messageId: msg.id,
    conversationId,
    senderId,
  });

  return wrapResponse(msg);
}

export async function sendSystemMessage(
  conversationId: string,
  content: string,
  type: MessageType = 'system',
  metadata?: MessageMetadata,
) {
  const finalMetadata = type === 'meetup_proposal'
    ? { ...metadata, proposedBy: metadata?.proposedBy ?? metadata?.actorId }
    : metadata;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: null,
      content,
      type,
      metadata: finalMetadata ?? null,
      is_read: false,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throwApiError(500, error?.message || 'Failed to send system message');
  }

  const msg = toMessage(data);
  eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
    messageId: msg.id,
    conversationId,
    senderId: 'system',
  });

  return msg;
}

export async function markAsRead(conversationId: string) {
  await simulateLatency(30, 50);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: unreadRows, error: unreadError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .or(`sender_id.is.null,sender_id.neq.${userId}`);

  if (unreadError) throwApiError(500, unreadError.message);

  if (unreadRows && unreadRows.length > 0) {
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadRows.map((row) => row.id));

    if (updateError) throwApiError(500, updateError.message);
  }

  return wrapResponse(null);
}

export async function getUnreadCount() {
  const userId = getCurrentUserId();
  if (!userId) return wrapResponse(0);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (error || !conversations || conversations.length === 0) {
    return wrapResponse(0);
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('is_read', false)
    .or(`sender_id.is.null,sender_id.neq.${userId}`);

  if (countError) return wrapResponse(0);
  return wrapResponse(count ?? 0);
}
