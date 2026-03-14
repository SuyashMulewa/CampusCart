/**
 * Order repository — data access for the `orders` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Order } from '@/models/order.model';
import type { OrderStatus } from '@/models/enums';
import { BaseRepository } from './base.repository';

class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(db.orders);
  }

  /** Find all orders where the user is the buyer. */
  async findByBuyer(buyerId: string): Promise<Order[]> {
    return this.table.where('buyerId').equals(buyerId).reverse().sortBy('createdAt');
  }

  /** Find all orders where the user is the seller. */
  async findBySeller(sellerId: string): Promise<Order[]> {
    return this.table.where('sellerId').equals(sellerId).reverse().sortBy('createdAt');
  }

  /** Find all orders for a specific listing. */
  async findByListing(listingId: string): Promise<Order[]> {
    return this.table.where('listingId').equals(listingId).toArray();
  }

  /** Find an order by its bidId. */
  async findByBid(bidId: string): Promise<Order | undefined> {
    return this.table.where('bidId').equals(bidId).first();
  }

  /**
   * Update order status with audit trail.
   * The status history entry is appended to the existing array.
   * State machine validation should be done BEFORE calling this method.
   */
  async updateStatus(id: string, newStatus: OrderStatus, note?: string): Promise<Order> {
    const order = await this.table.get(id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    const updatedHistory = [
      ...order.statusHistory,
      { status: newStatus, timestamp: now, note },
    ];

    await this.table.update(id, {
      status: newStatus,
      statusHistory: updatedHistory,
      updatedAt: now,
    });

    return (await this.table.get(id))!;
  }

  /** Check if a pending order already exists for a listing+buyer combo. */
  async hasPendingOrder(listingId: string, buyerId: string): Promise<boolean> {
    const count = await this.table
      .where('listingId')
      .equals(listingId)
      .filter((o) => o.buyerId === buyerId && o.status === 'pending')
      .count();
    return count > 0;
  }
}

export const orderRepository = new OrderRepository();
