/**
 * Typed event definitions for the CampusCart event bus.
 *
 * Each event has a unique string key and a typed payload interface.
 * Services emit events after mutations; hooks subscribe for real-time
 * UI updates (e.g., auto-refetch, badge counters, toast notifications).
 *
 * When migrating to Supabase, these map to Supabase Realtime channel events:
 *   eventBus.emit(EVENTS.BID_PLACED, payload)
 *     → supabase.channel('bids').on('INSERT', callback)
 */

// ─── Event Keys ────────────────────────────────────────

export const EVENTS = {
  // Listing events
  LISTING_CREATED: 'listing:created',
  LISTING_UPDATED: 'listing:updated',
  LISTING_DELETED: 'listing:deleted',

  // Bid events
  BID_PLACED: 'bid:placed',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',

  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:status_changed',

  // Chat events
  MESSAGE_RECEIVED: 'message:received',
  CONVERSATION_CREATED: 'conversation:created',

  // Meetup events
  MEETUP_PROPOSED: 'meetup:proposed',
  MEETUP_CONFIRMED: 'meetup:confirmed',
  MEETUP_LOCKED: 'meetup:locked',

  // OTP events
  OTP_GENERATED: 'otp:generated',
  OTP_VERIFIED: 'otp:verified',

  // Review events
  REVIEW_SUBMITTED: 'review:submitted',

  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
} as const;

export type EventKey = (typeof EVENTS)[keyof typeof EVENTS];

// ─── Event Payloads ────────────────────────────────────

export interface ListingEventPayload {
  listingId: string;
}

export interface BidEventPayload {
  bidId: string;
  listingId: string;
  bidderId: string;
  amount: number;
}

export interface OrderEventPayload {
  orderId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status?: string;
  previousStatus?: string;
}

export interface MessageEventPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
}

export interface ConversationEventPayload {
  conversationId: string;
  buyerId: string;
  sellerId: string;
}

export interface MeetupEventPayload {
  meetupId: string;
  orderId: string;
  conversationId: string;
}

export interface OtpEventPayload {
  otpId: string;
  meetupId: string;
  orderId: string;
}

export interface ReviewEventPayload {
  reviewId: string;
  orderId: string;
  revieweeId: string;
}

export interface NotificationEventPayload {
  notificationId: string;
  userId: string;
  type: string;
}

// ─── Event Map (Key → Payload type) ──────────────────

/**
 * Maps each event key to its payload type for end-to-end type safety.
 * Used by EventBus.emit() and EventBus.on() to ensure payload shape correctness.
 */
export interface EventMap {
  [EVENTS.LISTING_CREATED]: ListingEventPayload;
  [EVENTS.LISTING_UPDATED]: ListingEventPayload;
  [EVENTS.LISTING_DELETED]: ListingEventPayload;

  [EVENTS.BID_PLACED]: BidEventPayload;
  [EVENTS.BID_ACCEPTED]: BidEventPayload;
  [EVENTS.BID_REJECTED]: BidEventPayload;

  [EVENTS.ORDER_CREATED]: OrderEventPayload;
  [EVENTS.ORDER_STATUS_CHANGED]: OrderEventPayload;

  [EVENTS.MESSAGE_RECEIVED]: MessageEventPayload;
  [EVENTS.CONVERSATION_CREATED]: ConversationEventPayload;

  [EVENTS.MEETUP_PROPOSED]: MeetupEventPayload;
  [EVENTS.MEETUP_CONFIRMED]: MeetupEventPayload;
  [EVENTS.MEETUP_LOCKED]: MeetupEventPayload;

  [EVENTS.OTP_GENERATED]: OtpEventPayload;
  [EVENTS.OTP_VERIFIED]: OtpEventPayload;

  [EVENTS.REVIEW_SUBMITTED]: ReviewEventPayload;

  [EVENTS.NOTIFICATION_CREATED]: NotificationEventPayload;
}
