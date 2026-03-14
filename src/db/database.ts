/**
 * Dexie.js IndexedDB database definition for CampusCart.
 *
 * This acts as a fully normalized relational database with 11 tables,
 * compound indexes, and foreign-key relationships enforced at the
 * service layer. When migrating to Supabase, this file is replaced
 * by Supabase client initialization — no other layer changes.
 *
 * Table overview:
 * ┌──────────────┬──────────────────────────────────────────────┐
 * │ Table        │ Primary Purpose                              │
 * ├──────────────┼──────────────────────────────────────────────┤
 * │ users        │ Registered platform members                  │
 * │ listings     │ Products listed for sale                     │
 * │ categories   │ Product category reference data              │
 * │ bids         │ Buyer offers on listings                     │
 * │ orders       │ Accepted bids → transactions                 │
 * │ conversations│ Chat threads between buyer/seller            │
 * │ messages     │ Individual chat messages                     │
 * │ meetups      │ Scheduled physical meetings                  │
 * │ otps         │ One-time passwords for meetup verification   │
 * │ reviews      │ Post-transaction ratings                     │
 * │ notifications│ User alerts for platform events              │
 * └──────────────┴──────────────────────────────────────────────┘
 *
 * Usage: import { db } from '@/db/database';
 */
import Dexie, { type Table } from 'dexie';

import type { User } from '@/models/user.model';
import type { Listing } from '@/models/listing.model';
import type { Category } from '@/models/category.model';
import type { Bid } from '@/models/bid.model';
import type { Order } from '@/models/order.model';
import type { Conversation } from '@/models/conversation.model';
import type { Message } from '@/models/message.model';
import type { Meetup } from '@/models/meetup.model';
import type { OTP } from '@/models/otp.model';
import type { Review } from '@/models/review.model';
import type { Notification } from '@/models/notification.model';

export class CampusCartDB extends Dexie {
  // ── Typed table references ──────────────────────────────
  users!: Table<User, string>;
  listings!: Table<Listing, string>;
  categories!: Table<Category, string>;
  bids!: Table<Bid, string>;
  orders!: Table<Order, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  meetups!: Table<Meetup, string>;
  otps!: Table<OTP, string>;
  reviews!: Table<Review, string>;
  notifications!: Table<Notification, string>;

  constructor() {
    super('CampusCartDB');

    /**
     * Schema version 1 — initial release.
     *
     * Index syntax (Dexie):
     * - `id`           → indexed field (non-auto-increment since we use string IDs)
     * - `&email`       → unique index
     * - `[a+b+c]`      → compound index (for conversation deduplication)
     * - `*field`        → multi-entry index (for arrays — not used here)
     *
     * Note: Only indexed fields are listed. All model fields are still stored;
     * Dexie stores the full object regardless of which fields are indexed.
     */
    this.version(1).stores({
      users:         'id, &email, university',
      listings:      'id, sellerId, category, status, postedDate',
      categories:    'id, name',
      bids:          'id, listingId, bidderId, status, createdAt',
      orders:        'id, listingId, bidId, buyerId, sellerId, status, createdAt',
      conversations: 'id, [buyerId+sellerId+listingId], buyerId, sellerId',
      messages:      'id, conversationId, senderId, createdAt',
      meetups:       'id, orderId, conversationId, status',
      otps:          'id, meetupId, orderId',
      reviews:       'id, orderId, reviewerId, revieweeId',
      notifications: 'id, userId, isRead, createdAt',
    });
  }
}

/**
 * Singleton database instance.
 * Import this everywhere: `import { db } from '@/db/database';`
 */
export const db = new CampusCartDB();