/**
 * Listing service — product listing CRUD and search.
 *
 * Simulates REST endpoints:
 *   GET    /listings            → getAll(filters?)
 *   GET    /listings/:id        → getById(id)
 *   POST   /listings            → create(dto)
 *   PATCH  /listings/:id        → update(id, dto)
 *   DELETE /listings/:id        → remove(id)
 *   GET    /listings/search     → search(query, filters)
 *   GET    /listings/category   → getByCategory(category)
 *   GET    /listings/mine       → getMine()
 */
import { listingRepository } from '@/repositories/listing.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { userRepository } from '@/repositories/user.repository';
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { getCurrentUserId } from './auth.service';
import type { Listing, CreateListingDTO, UpdateListingDTO } from '@/models/listing.model';
import type { Category } from '@/models/category.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'textbooks', name: 'Textbook', icon: 'BookOpen', count: 0, listings: '0+' },
  { id: 'study-notes', name: 'Study Notes', icon: 'FileText', count: 0, listings: '0+' },
  { id: 'stationary', name: 'Stationary', icon: 'PenTool', count: 0, listings: '0+' },
  { id: 'lab-kits', name: 'Lab Kits', icon: 'FlaskConical', count: 0, listings: '0+' },
  { id: 'electronics', name: 'Electronics', icon: 'Monitor', count: 0, listings: '0+' },
  { id: 'dorm-essentials', name: 'Dorm Essentials', icon: 'HousePlus', count: 0, listings: '0+' },
];

const CATEGORY_ORDER = [
  'textbook',
  'study notes',
  'stationary',
  'lab kits',
  'electronics',
  'dorm essentials',
];

function normalizeCategoryName(value: string): string {
  const lower = value.toLowerCase().trim();
  const normalizedMap: Record<string, string> = {
    textbook: 'Textbook',
    textbooks: 'Textbook',
    'study note': 'Study Notes',
    'study notes': 'Study Notes',
    stationary: 'Stationary',
    stationery: 'Stationary',
    'lab kit': 'Lab Kits',
    'lab kits': 'Lab Kits',
    electronics: 'Electronics',
    dorm: 'Dorm Essentials',
    'dorm furniture': 'Dorm Essentials',
    'dorm essentials': 'Dorm Essentials',
  };

  return normalizedMap[lower] || value;
}

function normalizeAndSortCategories(categories: Category[]): Category[] {
  const normalized = categories.map((category) => {
    const normalizedName = normalizeCategoryName(category.name);
    const normalizedIcon = normalizedName === 'Dorm Essentials' ? 'HousePlus' : category.icon;
    return {
      ...category,
      name: normalizedName,
      icon: normalizedIcon,
    };
  });

  return normalized.sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.name.toLowerCase());
    const indexB = CATEGORY_ORDER.indexOf(b.name.toLowerCase());
    const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB;
    return a.name.localeCompare(b.name);
  });
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-');
}

function formatListingsCount(count: number): string {
  if (count >= 1000) {
    const rounded = Math.round((count / 1000) * 10) / 10;
    return `${rounded}k+`;
  }
  return `${count}+`;
}

function getFallbackMetaFromValue(value: string): Category {
  const normalizedName = normalizeCategoryName(value);
  const lower = normalizedName.toLowerCase();
  const byName = DEFAULT_CATEGORIES.find((cat) => cat.name.toLowerCase() === lower);
  if (byName) return byName;

  const byId = DEFAULT_CATEGORIES.find((cat) => cat.id === lower);
  if (byId) return byId;

  const bySlug = DEFAULT_CATEGORIES.find((cat) => slugify(cat.name) === lower);
  if (bySlug) return bySlug;

  return {
    id: slugify(value),
    name: value,
    icon: 'BookOpen',
    count: 0,
    listings: '0+',
  };
}

/**
 * Get all active listings, optionally excluding the current user's own listings.
 * The `excludeSeller` flag implements the WorkFlow.md requirement:
 * "Seller cannot see their own listing in the marketplace browsing feed."
 */
export async function getAll(filters?: {
  excludeSeller?: boolean;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  await simulateLatency(100, 200);

  let listings: Listing[];
  const currentUserId = getCurrentUserId();

  if (filters?.excludeSeller && currentUserId) {
    listings = await listingRepository.findExcludingSeller(currentUserId);
  } else {
    listings = (await listingRepository.getAll()).filter((l) => l.status === 'active');
  }

  // Apply additional filters
  if (filters?.category) {
    listings = listings.filter((l) => l.category === filters.category);
  }
  if (filters?.condition) {
    listings = listings.filter((l) => l.condition === filters.condition);
  }
  if (filters?.minPrice !== undefined) {
    listings = listings.filter((l) => l.price >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    listings = listings.filter((l) => l.price <= filters.maxPrice!);
  }

  return wrapResponse(listings);
}

/**
 * Get a single listing by ID. Increments view count.
 * @throws ApiError(404) if listing not found
 */
export async function getById(id: string) {
  await simulateLatency(50, 150);

  const listing = await listingRepository.getById(id);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }

  // Increment views (fire-and-forget)
  listingRepository.incrementViews(id);

  return wrapResponse(listing);
}

/**
 * Create a new listing.
 * @throws ApiError(401) if not authenticated
 */
export async function create(dto: CreateListingDTO) {
  await simulateLatency(200, 400);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in to create a listing');
  }

  const now = timestamp();
  const listing: Listing = {
    id: generateId('listing'),
    sellerId,
    title: dto.title,
    description: dto.description,
    price: dto.price,
    mrp: dto.mrp,
    negotiableMinPrice: dto.isNegotiable ? (dto.negotiableMinPrice ?? null) : null,
    category: dto.category,
    subcategory: dto.subcategory,
    condition: dto.condition,
    location: dto.location,
    image: dto.image,
    images: dto.images || [dto.image],
    specifications: dto.specifications,
    status: 'active',
    views: 0,
    favorites: 0,
    isNegotiable: dto.isNegotiable,
    postedDate: now.split('T')[0],
    createdAt: now,
    updatedAt: now,
  };

  await listingRepository.create(listing);

  eventBus.emit(EVENTS.LISTING_CREATED, { listingId: listing.id });

  return wrapResponse(listing);
}

/**
 * Update an existing listing.
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(403) if not the listing owner
 * @throws ApiError(404) if listing not found
 */
export async function update(id: string, dto: UpdateListingDTO) {
  await simulateLatency(150, 300);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const listing = await listingRepository.getById(id);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }
  if (listing.sellerId !== sellerId) {
    throwApiError(403, 'You can only edit your own listings');
  }

  const updated = await listingRepository.update(id, {
    ...dto,
    updatedAt: timestamp(),
  });

  eventBus.emit(EVENTS.LISTING_UPDATED, { listingId: id });

  return wrapResponse(updated);
}

/**
 * Delete (soft-delete) a listing.
 * @throws ApiError(401) if not authenticated
 * @throws ApiError(403) if not the listing owner
 */
export async function remove(id: string) {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const listing = await listingRepository.getById(id);
  if (!listing) {
    throwApiError(404, 'Listing not found');
  }
  if (listing.sellerId !== sellerId) {
    throwApiError(403, 'You can only delete your own listings');
  }

  // Soft delete — mark as deleted
  await listingRepository.update(id, { status: 'deleted', updatedAt: timestamp() });

  // Hard delete — remove from IndexedDB
  await listingRepository.delete(id);

  eventBus.emit(EVENTS.LISTING_DELETED, { listingId: id });

  return wrapResponse({ id });
}

/**
 * Search listings by text query with optional filters.
 */
export async function search(
  query: string,
  filters?: { category?: string; condition?: string; minPrice?: number; maxPrice?: number }
) {
  await simulateLatency(100, 250);

  const currentUserId = getCurrentUserId();
  const results = await listingRepository.search(query, {
    ...filters,
    excludeSellerId: currentUserId ?? undefined,
  });

  return wrapResponse(results);
}

/**
 * Get all listings in a specific category.
 */
export async function getByCategory(category: string) {
  await simulateLatency(80, 150);

  const listings = await listingRepository.findByCategory(category);
  const active = listings.filter((l) => l.status === 'active');

  return wrapResponse(active);
}

/**
 * Get the current user's own listings (for the "My Listings" page).
 * @throws ApiError(401) if not authenticated
 */
export async function getMine() {
  await simulateLatency(80, 150);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const listings = await listingRepository.findBySeller(sellerId);
  // Include active and sold listings but not deleted
  return wrapResponse(listings.filter((l) => l.status !== 'deleted'));
}

/**
 * Get all categories with their metadata.
 */
export async function getCategories() {
  await simulateLatency(50, 100);

  const categories = await categoryRepository.getAll();
  if (categories.length > 0) {
    return wrapResponse(normalizeAndSortCategories(categories));
  }

  // Self-heal when category table is empty: derive from active listings first.
  const listings = await listingRepository.getAll();
  const activeListings = listings.filter((listing) => listing.status === 'active');

  const categoryCountMap = new Map<string, number>();
  activeListings.forEach((listing) => {
    const key = listing.category?.trim();
    if (!key) return;
    categoryCountMap.set(key, (categoryCountMap.get(key) ?? 0) + 1);
  });

  const derivedCategories: Category[] = Array.from(categoryCountMap.entries()).map(([value, count]) => {
    const meta = getFallbackMetaFromValue(value);
    return {
      id: meta.id,
      name: meta.name,
      icon: meta.icon,
      count,
      listings: formatListingsCount(count),
    };
  });

  const fallbackCategories = normalizeAndSortCategories(
    derivedCategories.length > 0 ? derivedCategories : DEFAULT_CATEGORIES,
  );

  await Promise.all(
    fallbackCategories.map(async (category) => {
      await categoryRepository.create(category);
    }),
  );

  const repairedCategories = await categoryRepository.getAll();
  if (repairedCategories.length > 0) {
    return wrapResponse(normalizeAndSortCategories(repairedCategories));
  }

  return wrapResponse(fallbackCategories);
}

// ─── Enriched queries (with seller data joined) ──────

/** Listing with seller data joined for UI display */
export interface EnrichedListing extends Listing {
  seller?: Awaited<ReturnType<typeof userRepository.getById>>;
}

/** Enrich a single listing with its seller data */
async function enrichListing(listing: Listing): Promise<EnrichedListing> {
  const seller = await userRepository.getById(listing.sellerId);
  return { ...listing, seller };
}

/**
 * Get all active listings enriched with seller info.
 * Used by pages that need to render ProductCard (which expects embedded seller).
 */
export async function getAllEnriched(filters?: {
  excludeSeller?: string;
  category?: string;
  limit?: number;
}) {
  await simulateLatency(80, 200);

  let listings = await listingRepository.getAll();
  listings = listings.filter((l) => l.status === 'active');

  if (filters?.excludeSeller) {
    listings = listings.filter((l) => l.sellerId !== filters.excludeSeller);
  }
  if (filters?.category) {
    listings = listings.filter(
      (l) => l.category.toLowerCase() === filters.category!.toLowerCase(),
    );
  }
  if (filters?.limit) {
    listings = listings.slice(0, filters.limit);
  }

  const enriched = await Promise.all(listings.map(enrichListing));
  return wrapResponse(enriched);
}

/**
 * Get a single listing enriched with seller info.
 */
export async function getByIdEnriched(id: string) {
  await simulateLatency(50, 100);

  const listing = await listingRepository.getById(id);
  if (!listing) throwApiError(404, 'Listing not found');

  // Increment views
  await listingRepository.incrementViews(id);

  const enriched = await enrichListing(listing);
  return wrapResponse(enriched);
}
