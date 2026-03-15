/**
 * Database seeder — populates IndexedDB with normalized mock data.
 *
 * This migrates all data from src/data/mockData.ts + src/pages/viewBidsData.ts
 * into properly normalized relational tables. Run once on first app load.
 *
 * Normalization changes from the old mockData:
 * - Product.seller (embedded User object) → Listing.sellerId (FK string)
 * - Order.product (embedded Product) → Order.listingId (FK string)
 * - Order.buyer/seller (embedded Users) → Order.buyerId/sellerId (FK strings)
 * - Conversation.participant (embedded User) → Conversation.buyerId + sellerId
 * - Added new entities: Bid, Meetup, OTP, Review (previously missing)
 * - Added fields: mrp, negotiableMinPrice, passwordHash, isOnline, etc.
 *
 * Usage: called from main.tsx on app startup via `seedDatabase()`
 */
import { db } from './database';
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

const SEED_FLAG = 'campuscart_db_seeded_v1';

/** Check if database has already been seeded */
function isSeeded(): boolean {
  return localStorage.getItem(SEED_FLAG) === 'true';
}

/** Mark database as seeded */
function markSeeded(): void {
  localStorage.setItem(SEED_FLAG, 'true');
}

// ─── Seed Data ────────────────────────────────────────────

// const _now = new Date().toISOString();

const seedUsers: User[] = [
  
];

const seedListings: Listing[] = [
  
];

const seedCategories: Category[] = [
  { id: 'c1', name: 'Textbook', icon: 'BookOpen', count: 12450, listings: '12k+' },
  { id: 'c6', name: 'Study Notes', icon: 'FileText', count: 4320, listings: '4.3k+' },
  { id: 'c5', name: 'Stationary', icon: 'PenTool', count: 5670, listings: '5.6k+' },
  { id: 'c4', name: 'Lab Kits', icon: 'FlaskConical', count: 890, listings: '890+' },
  { id: 'c2', name: 'Electronics', icon: 'Monitor', count: 3450, listings: '3.4k+' },
  { id: 'c3', name: 'Dorm Essentials', icon: 'HousePlus', count: 2180, listings: '2.1k+' },
];

// Bids — migrated from viewBidsData.ts + additional seed bids for orders
const seedBids: Bid[] = [
  
  // Bid for ord1 (p10, buyer u1 → seller u1... this is the old mock data's structure)
  // Actually ord1: buyer=currentUser(u1), seller=u1 for p10 — this seems like a mock inconsistency
  // Let's fix: p10 seller is u1, ord1's buyer should be someone else, or
  // we keep backward compat: ord1 buyer u1, product p10 (seller is u1) — this is a self-buy
  // The old mockData had this issue. Let's reassign: ord1 buyer=u1, p10 seller was users[0] = u2 in old data
  // Wait, in old mockData users[0] = Jessica (u2). But our seed has p10.sellerId = u1.
  // The old orders were: ord1 product=products[9]=p10, seller=users[0]=Jessica
  // So p10 was sold by Jessica in the old data. But the old products[9].seller = users[0] = Jessica = u2
  // Let me fix this: in mockData, the seller mapping was products index → users index:
  // products[0].seller = users[1] (jessica u2), products[9].seller = users[0] (jessica u2)
  // Wait, users[0] in the mockData is Jessica (index 0 of users array, which is u2)
  // So p10.seller = users[0] = u2 (Jessica) — but I mapped p10 to u1 above. Let me fix:
  // Actually, checking mockData: users array starts with u2 (Jessica), u3 (Sarah), u4 (Alex), u5 (Priya), u6 (Aman)
  // currentUser = u1 (Rahul) is separate
  // products[9] (p10).seller = users[0] = u2 (Jessica)
  // But I assigned p10.sellerId = 'u1' which would be Rahul. Need to fix.
  // I'll fix p5 and p10 sellers to match original:
  // p5.seller = users[0] = u2 (Jessica) in original? No — checking:
  // Let me re-verify from mockData line by line:
  // products[4] = p5, seller = users[0] = Jessica (u2)... hmm but that's seller for the calculator
  // Actually no. myListings = [products[4], products[9]] = [p5, p10]
  // And these are currentUser's (u1's) listings.
  // So p5 and p10 are sold by u1 (Rahul). That's correct in my seed.
  // Then ord1: buyer = currentUser (u1), seller = users[0] (u2 Jessica), product = products[9] (p10)
  // But p10 seller is u1...  that's the inconsistency in the original mockData.
  // The original had products[9].seller = users[0] = u2 (Jessica) but also myListings included products[9].
  // This is a bug in the original. Let's fix it: ord1 should reference a different product.
  // I'll make ord1 reference p10 with seller as the CORRECT seller from listings.
  // Since p10.sellerId = 'u1', and ord1.buyer should NOT be u1 (can't buy own product).
  // Let's make ord1: buyer = u1 buys p10 from u1 — this is wrong.
  // Resolution: Reassign p10 seller to u2 (Jessica), and remove p10 from u1's listings.
  // OR keep p5,p10 as u1's listings and make the orders reference other products.
  // I'll keep it simple: the seed orders reference listings correctly.

  // Bid for ord1: u1 bid on p10 — but p10 is u1's listing. Original data inconsistency.
  // Fix: Make ord1 reference a product NOT owned by u1. Let's use p1 (seller u2).
  // Actually, let's just keep the original order data but fix the relationships:
  // ord1: buyer u1 placed bid on p10(TI-84), seller for p10 was Jessica(u2) in original
  // So I should set p10.sellerId = 'u2' (Jessica) to match, and remove p10 from u1's "myListings"
  // Actually myListings = p5 and p10. p5 has seller u1 AND p10 has seller u1... but orig orders have them as different sellers.
  // The original data is simply inconsistent. Let's adopt a clean approach:
  // - p5 seller = u1 (Rahul's listing, has bids from viewBidsData)
  // - p10 seller = u2 (Jessica's listing, this fixes the ord1 inconsistency)
  // This means myListings for u1 = just p5. Which is fine.

  // Accepted bid for ord1: buyer u1 bid on p10 (seller u2), status pending
  {
    id: 'bid-ord1',
    listingId: 'p10',
    bidderId: 'u1',
    amount: 100, // matches ord1.agreedPrice from mockData (yes, ₹100 — original had this)
    isBuyNow: false,
    status: 'accepted',
    createdAt: '2024-01-16T08:00:00.000Z',
    updatedAt: '2024-01-16T09:00:00.000Z',
  },
  // Accepted bid for ord2: buyer u1 bid on p7 (seller u5), status confirmed
  {
    id: 'bid-ord2',
    listingId: 'p7',
    bidderId: 'u1',
    amount: 65, // matches ord2.agreedPrice from mockData
    isBuyNow: false,
    status: 'accepted',
    createdAt: '2024-01-14T08:00:00.000Z',
    updatedAt: '2024-01-14T09:00:00.000Z',
  },
  // Accepted bid for ord3: buyer u1 bid on p13 (notebooks, seller u6), completed
  {
    id: 'bid-ord3',
    listingId: 'p13',
    bidderId: 'u1',
    amount: 25, // matches ord3.agreedPrice
    isBuyNow: true,
    status: 'accepted',
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-10T09:00:00.000Z',
  },
];

const seedOrders: Order[] = [
  {
    id: 'ord-1',
    listingId: 'p10',
    bidId: 'bid-ord1',
    buyerId: 'u1',
    sellerId: 'u2', // p10.sellerId
    agreedPrice: 100,
    originalPrice: 1450,
    status: 'pending',
    statusHistory: [
      { status: 'pending', timestamp: '2024-01-16T09:00:00.000Z', note: 'Bid accepted by seller' },
    ],
    deliveryMethod: 'campus_meetup',
    createdAt: '2024-01-16T09:00:00.000Z',
    updatedAt: '2024-01-16T09:00:00.000Z',
  },
  {
    id: 'ord-2',
    listingId: 'p7',
    bidId: 'bid-ord2',
    buyerId: 'u1',
    sellerId: 'u5', // p7.sellerId
    agreedPrice: 65,
    originalPrice: 650,
    status: 'confirmed',
    statusHistory: [
      { status: 'pending', timestamp: '2024-01-14T09:00:00.000Z', note: 'Bid accepted by seller' },
      { status: 'confirmed', timestamp: '2024-01-14T12:00:00.000Z', note: 'Meetup confirmed by both parties' },
    ],
    deliveryMethod: 'campus_meetup',
    createdAt: '2024-01-14T09:00:00.000Z',
    updatedAt: '2024-01-14T12:00:00.000Z',
  },
  {
    id: 'ord-3',
    listingId: 'p13',
    bidId: 'bid-ord3',
    buyerId: 'u1',
    sellerId: 'u6', // p13.sellerId
    agreedPrice: 25,
    originalPrice: 580,
    status: 'completed',
    statusHistory: [
      { status: 'pending', timestamp: '2024-01-10T09:00:00.000Z', note: 'Buy Now — bid accepted' },
      { status: 'confirmed', timestamp: '2024-01-10T10:00:00.000Z', note: 'Meetup confirmed' },
      { status: 'completed', timestamp: '2024-01-10T14:00:00.000Z', note: 'OTP verified at meetup' },
    ],
    deliveryMethod: 'campus_meetup',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-10T14:00:00.000Z',
  },
];

const seedConversations: Conversation[] = [
  {
    id: 'conv-1',
    buyerId: 'u1',
    sellerId: 'u3',
    listingId: 'p6',
    lastMessageAt: '2024-01-16T14:30:00.000Z',
    createdAt: '2024-01-16T13:00:00.000Z',
  },
  {
    id: 'conv-2',
    buyerId: 'u1',
    sellerId: 'u4',
    lastMessageAt: '2024-01-16T13:15:00.000Z',
    createdAt: '2024-01-16T12:00:00.000Z',
  },
  {
    id: 'conv-3',
    buyerId: 'u1',
    sellerId: 'u5',
    lastMessageAt: '2024-01-16T11:00:00.000Z',
    createdAt: '2024-01-16T10:00:00.000Z',
  },
  {
    id: 'conv-4',
    buyerId: 'u1',
    sellerId: 'u2',
    lastMessageAt: '2024-01-15T16:45:00.000Z',
    createdAt: '2024-01-15T15:00:00.000Z',
  },
];

const seedMessages: Message[] = [
  // conv-1: u1 (buyer) ↔ u3 (Sarah, seller of p6 headphones)
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'u3',
    content: 'That price sounds fair to me!',
    type: 'text',
    isRead: false,
    createdAt: '2024-01-16T14:30:00.000Z',
  },
  // conv-2: u1 ↔ u4 (Alex)
  {
    id: 'msg-2',
    conversationId: 'conv-2',
    senderId: 'u4',
    content: 'Is it still available for pickup?',
    type: 'text',
    isRead: true,
    createdAt: '2024-01-16T13:15:00.000Z',
  },
  // conv-3: u1 ↔ u5 (Priya)
  {
    id: 'msg-3',
    conversationId: 'conv-3',
    senderId: 'u5',
    content: 'I can meet you at the Student Union.',
    type: 'text',
    isRead: true,
    createdAt: '2024-01-16T11:00:00.000Z',
  },
  // conv-4: u1 ↔ u2 (Jessica)
  {
    id: 'msg-4',
    conversationId: 'conv-4',
    senderId: 'u1',
    content: 'Perfect, thanks again!',
    type: 'text',
    isRead: true,
    createdAt: '2024-01-15T16:45:00.000Z',
  },
];

// Meetup for the confirmed order (ord-2)
const seedMeetups: Meetup[] = [
  {
    id: 'meet-1',
    orderId: 'ord-2',
    conversationId: 'conv-3',
    location: 'Student Union Cafe, Ground Floor',
    date: '2024-01-18',
    time: '14:00',
    proposedBy: 'u5',
    buyerConfirmed: true,
    sellerConfirmed: true,
    isLocked: true,
    status: 'locked',
    createdAt: '2024-01-14T12:00:00.000Z',
    updatedAt: '2024-01-14T13:00:00.000Z',
  },
  // Completed meetup for ord-3
  {
    id: 'meet-2',
    orderId: 'ord-3',
    conversationId: 'conv-4',
    location: 'Engineering Block A Fountain',
    date: '2024-01-10',
    time: '13:00',
    proposedBy: 'u6',
    buyerConfirmed: true,
    sellerConfirmed: true,
    isLocked: true,
    status: 'completed',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T14:00:00.000Z',
  },
];

// OTP for the completed meetup
const seedOtps: OTP[] = [
  {
    id: 'otp-1',
    meetupId: 'meet-2',
    orderId: 'ord-3',
    code: '482915',
    isVerified: true,
    generatedAt: '2024-01-10T13:00:00.000Z',
    expiresAt: '2024-01-10T15:00:00.000Z',
    verifiedAt: '2024-01-10T13:30:00.000Z',
  },
];

// Review for the completed order
const seedReviews: Review[] = [
  {
    id: 'rev-1',
    orderId: 'ord-3',
    reviewerId: 'u1',
    revieweeId: 'u6',
    rating: 5,
    comment: 'Great seller! Notebooks were in perfect condition. Meetup was smooth.',
    createdAt: '2024-01-10T15:00:00.000Z',
  },
];

const seedNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'u1',
    type: 'message',
    title: 'New message from Sarah Miller',
    content: 'That price sounds fair to me!',
    link: '/messages/conv-1',
    isRead: false,
    relatedEntityId: 'conv-1',
    relatedEntityType: 'conversation',
    createdAt: '2024-01-16T14:30:00.000Z',
  },
  {
    id: 'notif-2',
    userId: 'u1',
    type: 'bid',
    title: 'New offer on your listing',
    content: 'Someone offered ₹2,800 for your Bluetooth Headphones',
    link: '/listings',
    isRead: false,
    relatedEntityId: 'p6',
    relatedEntityType: 'listing',
    createdAt: '2024-01-16T12:00:00.000Z',
  },
  {
    id: 'notif-3',
    userId: 'u1',
    type: 'order',
    title: 'Order confirmed',
    content: 'Your order for TI-84 Plus CE has been confirmed',
    link: '/orders',
    isRead: true,
    relatedEntityId: 'ord-1',
    relatedEntityType: 'order',
    createdAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 'notif-4',
    userId: 'u1',
    type: 'listing',
    title: 'Item sold!',
    content: 'Your Dotted Notebooks have been sold',
    link: '/listings',
    isRead: true,
    relatedEntityId: 'p13',
    relatedEntityType: 'listing',
    createdAt: '2024-01-14T16:00:00.000Z',
  },
  {
    id: 'notif-5',
    userId: 'u1',
    type: 'system',
    title: 'Welcome to CampusCart!',
    content: 'Complete your profile to start buying and selling',
    link: '/profile',
    isRead: true,
    createdAt: '2024-01-10T09:00:00.000Z',
  },
];

// ─── Seed Function ──────────────────────────────────────

/**
 * Seeds the IndexedDB database with initial mock data.
 * Called once on first app load. Safe to call multiple times (idempotent).
 *
 * Uses Dexie transaction for atomicity — either all tables get populated
 * or none do (rollback on error).
 */
export async function seedDatabase(): Promise<void> {
  if (isSeeded()) {
    console.log('[Seed] Database already seeded, skipping.');
    return;
  }

  console.log('[Seed] Seeding IndexedDB with mock data...');

  try {
    await db.transaction(
      'rw',
      [
        db.users,
        db.listings,
        db.categories,
        db.bids,
        db.orders,
        db.conversations,
        db.messages,
        db.meetups,
        db.otps,
        db.reviews,
        db.notifications,
      ],
      async () => {
        // Fix p10 seller to u2 (Jessica) to match original order data
        const fixedListings = seedListings.map((l) =>
          l.id === 'p10' ? { ...l, sellerId: 'u2' } : l
        );

        await db.users.bulkPut(seedUsers);
        await db.listings.bulkPut(fixedListings);
        await db.categories.bulkPut(seedCategories);
        await db.bids.bulkPut(seedBids);
        await db.orders.bulkPut(seedOrders);
        await db.conversations.bulkPut(seedConversations);
        await db.messages.bulkPut(seedMessages);
        await db.meetups.bulkPut(seedMeetups);
        await db.otps.bulkPut(seedOtps);
        await db.reviews.bulkPut(seedReviews);
        await db.notifications.bulkPut(seedNotifications);
      },
    );

    markSeeded();
    console.log('[Seed] ✅ Database seeded successfully.');
  } catch (error) {
    console.error('[Seed] ❌ Failed to seed database:', error);
    throw error;
  }
}

/**
 * Resets the database — clears all tables and removes the seed flag.
 * Useful for development/testing.
 */
export async function resetDatabase(): Promise<void> {
  console.log('[Seed] Resetting database...');
  await db.delete();
  localStorage.removeItem(SEED_FLAG);
  // Also clear old OrderContext localStorage to avoid conflicts
  localStorage.removeItem('campusCartOrders');
  // Re-open the database (Dexie requires this after delete)
  await db.open();
  console.log('[Seed] ✅ Database reset. Refresh to re-seed.');
}
