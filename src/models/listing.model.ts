/**
 * Listing model — a product listed for sale on the marketplace.
 *
 * Key design decisions:
 * - `sellerId` is a foreign key to `users.id` (normalized, not embedded).
 * - `mrp` is the manufacturer's retail price (used for savings display).
 * - `negotiableMinPrice` is the minimum the seller will accept via bidding.
 * - `images` is stored as a JSON array of URL strings.
 *
 * IndexedDB table: `listings`
 * Indexes: `++id, sellerId, category, status, postedDate`
 */
import type { ListingCondition, ListingStatus } from './enums';

export interface Listing {
  /** Primary key — e.g. 'p1', 'p2' */
  id: string;
  /** FK → users.id */
  sellerId: string;
  title: string;
  description: string;
  /** Seller's asking / listing price */
  price: number;
  /** Manufacturer's retail price (for savings calculation) */
  mrp: number;
  /** Minimum bid the seller will accept. null if not negotiable. */
  negotiableMinPrice: number | null;
  category: string;
  subcategory?: string;
  condition: ListingCondition;
  location: string;
  /** Primary display image URL */
  image: string;
  /** All image URLs including the primary */
  images: string[];
  /** Free-form key/value specs (Author, Edition, Brand, etc.) */
  specifications?: Record<string, string>;
  status: ListingStatus;
  views: number;
  favorites: number;
  isNegotiable: boolean;
  postedDate: string;    // ISO 8601
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}

/** Fields accepted when creating a new listing */
export interface CreateListingDTO {
  title: string;
  description: string;
  price: number;
  mrp: number;
  negotiableMinPrice?: number | null;
  category: string;
  subcategory?: string;
  condition: ListingCondition;
  location: string;
  image: string;
  images?: string[];
  specifications?: Record<string, string>;
  isNegotiable: boolean;
}

/** Fields accepted when updating an existing listing */
export interface UpdateListingDTO {
  title?: string;
  description?: string;
  price?: number;
  mrp?: number;
  negotiableMinPrice?: number | null;
  category?: string;
  subcategory?: string;
  condition?: ListingCondition;
  location?: string;
  image?: string;
  images?: string[];
  specifications?: Record<string, string>;
  isNegotiable?: boolean;
  status?: ListingStatus;
}
