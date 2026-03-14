/**
 * Query key factory for TanStack Query.
 *
 * Centralizes all cache keys in a single, strongly-typed object.
 * Every `useQuery` / `useMutation` / `invalidateQueries` call references
 * keys from here, ensuring consistent cache management.
 *
 * Naming convention:  queryKeys.<domain>.<scope>(params?)
 *   - `all` = the broadest key for a domain (used for bulk invalidation)
 *   - Named scopes return tuple keys for fine-grained invalidation
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.listings.all, queryFn: ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
 */

export const queryKeys = {
  // ─── Auth ──────────────────────────────────────────
  auth: {
    me: ['auth', 'me'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },

  // ─── Listings ──────────────────────────────────────
  listings: {
    all: ['listings'] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    search: (query: string, filters?: Record<string, unknown>) =>
      ['listings', 'search', query, filters] as const,
    byCategory: (category: string) => ['listings', 'category', category] as const,
    mine: ['listings', 'mine'] as const,
    categories: ['listings', 'categories'] as const,
  },

  // ─── Bids ──────────────────────────────────────────
  bids: {
    all: ['bids'] as const,
    byListing: (listingId: string) => ['bids', 'listing', listingId] as const,
    mine: ['bids', 'mine'] as const,
  },

  // ─── Orders ────────────────────────────────────────
  orders: {
    all: ['orders'] as const,
    buyer: ['orders', 'buyer'] as const,
    seller: ['orders', 'seller'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  // ─── Chat ──────────────────────────────────────────
  chat: {
    conversations: ['chat', 'conversations'] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
    unreadCount: ['chat', 'unread'] as const,
  },

  // ─── Meetups ───────────────────────────────────────
  meetups: {
    byOrder: (orderId: string) => ['meetups', 'order', orderId] as const,
  },

  // ─── OTP ───────────────────────────────────────────
  otp: {
    byMeetup: (meetupId: string) => ['otp', 'meetup', meetupId] as const,
  },

  // ─── Reviews ───────────────────────────────────────
  reviews: {
    forUser: (userId: string) => ['reviews', 'user', userId] as const,
    forOrder: (orderId: string) => ['reviews', 'order', orderId] as const,
  },

  // ─── Notifications ────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread'] as const,
  },
} as const;
