/**
 * Compatibility adapter for bridging new Listing model ↔ legacy Product interface.
 *
 * During incremental migration, pages switch from `@/data/mockData` to the
 * service/hook layer one-by-one. However, shared components like `ProductCard`
 * still expect the old `Product` type (with an embedded `seller: User` object).
 *
 * This utility converts an enriched listing (Listing + User) into the legacy
 * `Product` shape so existing components continue to work without changes.
 *
 * Remove this file once all shared components are migrated to the new types.
 */
import type { Listing } from '@/models/listing.model';
import type { User } from '@/models/user.model';
import type { Product } from '@/data/mockData';

/**
 * Convert a new Listing + its seller User to the legacy Product interface.
 * This allows pages to migrate incrementally without touching ProductCard.
 */
export function listingToProduct(listing: Listing, seller: User | null | undefined): Product {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    mrp: listing.mrp,
    originalPrice: listing.mrp > listing.price ? listing.mrp : undefined,
    negotiableMinPrice: listing.negotiableMinPrice,
    condition: mapCondition(listing.condition),
    category: listing.category,
    subcategory: listing.subcategory,
    location: listing.location,
    image: listing.image,
    images: listing.images,
    description: listing.description,
    specifications: listing.specifications,
    postedDate: listing.postedDate,
    views: listing.views,
    favorites: listing.favorites,
    isNegotiable: listing.isNegotiable,
    status: listing.status as Product['status'],
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          avatar: seller.avatar,
          university: seller.university,
          major: seller.major,
          year: seller.year,
          isVerified: seller.isVerified,
          joinedDate: seller.joinedDate,
          rating: seller.rating,
          reviewCount: seller.reviewCount,
          bio: seller.bio,
          phone: seller.phone,
        }
      : {
          id: '',
          name: 'Unknown Seller',
          email: '',
          avatar: '',
          university: '',
          isVerified: false,
          joinedDate: '',
          rating: 0,
          reviewCount: 0,
        },
  };
}

/**
 * Map new ListingCondition enum to legacy Product condition.
 * Legacy type: 'New' | 'Like New' | 'Good' | 'Fair' | 'Used'
 */
function mapCondition(condition: string): Product['condition'] {
  const map: Record<string, Product['condition']> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    used: 'Used',
  };
  return map[condition] ?? (condition as Product['condition']);
}
