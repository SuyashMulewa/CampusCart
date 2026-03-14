/**
 * Listing repository — data access for the `listings` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Listing } from '@/models/listing.model';
import { BaseRepository } from './base.repository';

class ListingRepository extends BaseRepository<Listing> {
  constructor() {
    super(db.listings);
  }

  /** Find all listings by category. */
  async findByCategory(category: string): Promise<Listing[]> {
    return this.table.where('category').equals(category).toArray();
  }

  /** Find all listings by a specific seller. */
  async findBySeller(sellerId: string): Promise<Listing[]> {
    return this.table.where('sellerId').equals(sellerId).toArray();
  }

  /**
   * Find all active listings EXCLUDING a specific seller's listings.
   * This implements the WorkFlow.md rule: "Seller cannot see their own listing in the marketplace."
   */
  async findExcludingSeller(sellerId: string): Promise<Listing[]> {
    return this.table
      .where('status')
      .equals('active')
      .filter((listing) => listing.sellerId !== sellerId)
      .toArray();
  }

  /**
   * Full-text search across title and description.
   * Uses case-insensitive substring matching (sufficient for IndexedDB mock).
   * Supabase replacement: `.textSearch('title_description', query)`
   */
  async search(query: string, filters?: { category?: string; condition?: string; minPrice?: number; maxPrice?: number; excludeSellerId?: string }): Promise<Listing[]> {
    const lowerQuery = query.toLowerCase();

    let collection = this.table.where('status').equals('active');

    return collection.filter((listing) => {
      // Text search
      const matchesText =
        listing.title.toLowerCase().includes(lowerQuery) ||
        listing.description.toLowerCase().includes(lowerQuery);
      if (!matchesText) return false;

      // Category filter
      if (filters?.category && listing.category !== filters.category) return false;

      // Condition filter
      if (filters?.condition && listing.condition !== filters.condition) return false;

      // Price range filter
      if (filters?.minPrice !== undefined && listing.price < filters.minPrice) return false;
      if (filters?.maxPrice !== undefined && listing.price > filters.maxPrice) return false;

      // Exclude seller's own listings
      if (filters?.excludeSellerId && listing.sellerId === filters.excludeSellerId) return false;

      return true;
    }).toArray();
  }

  /** Increment the view count for a listing (called on product detail page visit). */
  async incrementViews(id: string): Promise<void> {
    const listing = await this.table.get(id);
    if (listing) {
      await this.table.update(id, { views: listing.views + 1 });
    }
  }

  /** Increment the favorites count for a listing. */
  async incrementFavorites(id: string): Promise<void> {
    const listing = await this.table.get(id);
    if (listing) {
      await this.table.update(id, { favorites: listing.favorites + 1 });
    }
  }

  /** Decrement the favorites count for a listing. */
  async decrementFavorites(id: string): Promise<void> {
    const listing = await this.table.get(id);
    if (listing && listing.favorites > 0) {
      await this.table.update(id, { favorites: listing.favorites - 1 });
    }
  }
}

export const listingRepository = new ListingRepository();
