/**
 * Order service — order lifecycle management (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/models/listing.model';
import type { Order, OrderStatusEntry } from '@/models/order.model';
import type { User } from '@/models/user.model';
import { transitionOrder } from '@/utils/orderStateMachine';
import { getCurrentUserId } from './auth.service';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const ORDER_SELECT = `
  id,
  listingId:listing_id,
  bidId:bid_id,
  buyerId:buyer_id,
  sellerId:seller_id,
  agreedPrice:agreed_price,
  originalPrice:original_price,
  status,
  statusHistory:status_history,
  deliveryMethod:delivery_method,
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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toOrder(row: any): Order {
  return {
    id: row.id,
    listingId: row.listingId,
    bidId: row.bidId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    agreedPrice: toNumber(row.agreedPrice),
    originalPrice: toNumber(row.originalPrice),
    status: row.status,
    statusHistory: Array.isArray(row.statusHistory) ? (row.statusHistory as OrderStatusEntry[]) : [],
    deliveryMethod: row.deliveryMethod,
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

async function fetchOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return toOrder(data);
}

async function fetchOrdersForUser(column: 'buyer_id' | 'seller_id', userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return (data ?? []).map(toOrder);
}

async function transitionOrderState(params: {
  orderId: string;
  nextStatus: Order['status'];
  note: string;
  bidStatus?: 'cancelled' | 'confirmed' | 'completed';
  listingStatus?: Listing['status'];
}): Promise<Order> {
  const { data, error } = await supabase.rpc('transition_order_state', {
    p_order_id: params.orderId,
    p_next_status: params.nextStatus,
    p_note: params.note,
    p_bid_status: params.bidStatus ?? null,
    p_listing_status: params.listingStatus ?? null,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    throwApiError(500, error?.message || 'Failed to transition order state');
  }

  return toOrder(data[0]);
}

/** Enriched order with joined user and listing data for UI display */
export interface EnrichedOrder extends Order {
  listing?: Listing | null;
  buyer?: User | null;
  seller?: User | null;
}

async function enrichOrder(order: Order): Promise<EnrichedOrder> {
  const [listings, users] = await Promise.all([
    fetchListingsByIds([order.listingId]),
    fetchUsersByIds([order.buyerId, order.sellerId]),
  ]);

  return {
    ...order,
    listing: listings.get(order.listingId) ?? null,
    buyer: users.get(order.buyerId) ?? null,
    seller: users.get(order.sellerId) ?? null,
  };
}

export async function getByBuyer() {
  await simulateLatency(100, 200);

  const buyerId = getCurrentUserId();
  if (!buyerId) throwApiError(401, 'Must be logged in');

  const orders = await fetchOrdersForUser('buyer_id', buyerId);
  const enriched = await Promise.all(orders.map(enrichOrder));
  return wrapResponse(enriched);
}

export async function getBySeller() {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) throwApiError(401, 'Must be logged in');

  const orders = await fetchOrdersForUser('seller_id', sellerId);
  const enriched = await Promise.all(orders.map(enrichOrder));
  return wrapResponse(enriched);
}

export async function getById(id: string) {
  await simulateLatency(50, 100);

  const order = await fetchOrderById(id);
  if (!order) throwApiError(404, 'Order not found');

  const userId = getCurrentUserId();
  if (userId && order.buyerId !== userId && order.sellerId !== userId) {
    throwApiError(403, 'You do not have access to this order');
  }

  return wrapResponse(await enrichOrder(order));
}

export async function cancel(id: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const order = await fetchOrderById(id);
  if (!order) throwApiError(404, 'Order not found');
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throwApiError(403, 'You can only cancel your own orders');
  }

  const result = transitionOrder(order.status, 'CANCEL');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const role = order.buyerId === userId ? 'buyer' : 'seller';
  const updated = await transitionOrderState({
    orderId: id,
    nextStatus: 'cancelled',
    note: `Cancelled by ${role}`,
    bidStatus: 'cancelled',
    listingStatus: 'active',
  });

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'cancelled',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}

export async function confirm(id: string) {
  const order = await fetchOrderById(id);
  if (!order) throwApiError(404, 'Order not found');

  const result = transitionOrder(order.status, 'ACCEPT_BID');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const updated = await transitionOrderState({
    orderId: id,
    nextStatus: 'confirmed',
    note: 'Meetup confirmed by both parties',
    bidStatus: 'confirmed',
  });

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'confirmed',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}

export async function complete(id: string) {
  const order = await fetchOrderById(id);
  if (!order) throwApiError(404, 'Order not found');

  const result = transitionOrder(order.status, 'VERIFY_OTP');
  if (!result.success) {
    throwApiError(400, result.error);
  }

  const updated = await transitionOrderState({
    orderId: id,
    nextStatus: 'completed',
    note: 'OTP verified at meetup',
    bidStatus: 'completed',
    listingStatus: 'sold',
  });

  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId: id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: 'completed',
    previousStatus: order.status,
  });

  return wrapResponse(await enrichOrder(updated));
}
