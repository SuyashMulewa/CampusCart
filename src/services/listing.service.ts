/**
 * Listing service — product listing CRUD and search (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/models/category.model';
import type { Listing, CreateListingDTO, UpdateListingDTO } from '@/models/listing.model';
import type { User } from '@/models/user.model';
import { getCurrentUserId } from './auth.service';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'textbooks', name: 'Textbook', icon: 'BookOpen', count: 0, listings: '0+' },
  { id: 'study-notes', name: 'Study Notes', icon: 'FileText', count: 0, listings: '0+' },
  { id: 'stationary', name: 'Stationary', icon: 'PenTool', count: 0, listings: '0+' },
  { id: 'lab-kits', name: 'Lab Kits', icon: 'FlaskConical', count: 0, listings: '0+' },
  { id: 'electronics', name: 'Electronics', icon: 'Monitor', count: 0, listings: '0+' },
  { id: 'dorm-essentials', name: 'Dorm Essentials', icon: 'HousePlus', count: 0, listings: '0+' },
];

const CATEGORY_ORDER = ['textbook', 'study notes', 'stationary', 'lab kits', 'electronics', 'dorm essentials'];

const LISTING_SELECT = `
  id,
  sellerId:seller_id,
  title,
  description,
  price,
  mrp,
  negotiableMinPrice:negotiable_min_price,
  category,
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

const SELLER_SELECT = `
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

function toSeller(row: any): User {
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

function mergeWithDefaultCategories(categories: Category[]): Category[] {
  const mergedById = new Map<string, Category>();

  DEFAULT_CATEGORIES.forEach((category) => {
    mergedById.set(category.id, {
      ...category,
      count: category.count ?? 0,
      listings: category.listings ?? '0+',
    });
  });

  categories.forEach((category) => {
    const normalizedName = normalizeCategoryName(category.name);
    const idCandidates = [
      category.id,
      slugify(category.id),
      slugify(normalizedName),
    ];

    const matchedDefaultId = DEFAULT_CATEGORIES.find((defaultCategory) => {
      const defaultCandidates = [
        defaultCategory.id,
        slugify(defaultCategory.id),
        slugify(defaultCategory.name),
      ];
      return idCandidates.some((candidate) => defaultCandidates.includes(candidate));
    })?.id;

    const mergedId = matchedDefaultId ?? slugify(category.id || normalizedName);
    const defaultMeta = DEFAULT_CATEGORIES.find((defaultCategory) => defaultCategory.id === mergedId);

    mergedById.set(mergedId, {
      id: mergedId,
      name: defaultMeta?.name ?? normalizedName,
      icon: defaultMeta?.icon ?? category.icon,
      count: category.count ?? 0,
      listings: category.listings ?? formatListingsCount(category.count ?? 0),
    });
  });

  return normalizeAndSortCategories(Array.from(mergedById.values()));
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

export async function getAll(filters?: {
  excludeSeller?: boolean;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  await simulateLatency(100, 200);

  const currentUserId = getCurrentUserId();

  let query = supabase.from('listings').select(LISTING_SELECT).eq('status', 'active');

  if (filters?.excludeSeller && currentUserId) {
    query = query.neq('seller_id', currentUserId);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throwApiError(500, error.message);

  return wrapResponse((data ?? []).map(toListing));
}

export async function getById(id: string) {
  await simulateLatency(50, 150);

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) {
    throwApiError(404, 'Listing not found');
  }

  await supabase.rpc('increment_listing_views', { p_listing_id: id });

  return wrapResponse(toListing(data));
}

export async function create(dto: CreateListingDTO) {
  await simulateLatency(200, 400);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in to create a listing');
  }

  const payload = {
    seller_id: sellerId,
    title: dto.title,
    description: dto.description,
    price: dto.price,
    mrp: dto.mrp,
    negotiable_min_price: dto.isNegotiable ? (dto.negotiableMinPrice ?? null) : null,
    category: dto.category,
    condition: dto.condition,
    location: dto.location,
    image: dto.image,
    images: dto.images && dto.images.length ? dto.images : [dto.image],
    specifications: dto.specifications ?? null,
    status: 'active',
    views: 0,
    favorites: 0,
    is_negotiable: dto.isNegotiable,
    posted_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select(LISTING_SELECT)
    .single();

  if (error || !data) {
    throwApiError(500, error?.message || 'Failed to create listing');
  }

  eventBus.emit(EVENTS.LISTING_CREATED, { listingId: data.id });

  return wrapResponse(toListing(data));
}

export async function update(id: string, dto: UpdateListingDTO) {
  await simulateLatency(150, 300);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data: existing, error: existingError } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    throwApiError(404, 'Listing not found');
  }

  if (existing.seller_id !== sellerId) {
    throwApiError(403, 'You can only edit your own listings');
  }

  const patch: Record<string, unknown> = {};
  if (dto.title !== undefined) patch.title = dto.title;
  if (dto.description !== undefined) patch.description = dto.description;
  if (dto.price !== undefined) patch.price = dto.price;
  if (dto.mrp !== undefined) patch.mrp = dto.mrp;
  if (dto.negotiableMinPrice !== undefined) patch.negotiable_min_price = dto.negotiableMinPrice;
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.condition !== undefined) patch.condition = dto.condition;
  if (dto.location !== undefined) patch.location = dto.location;
  if (dto.image !== undefined) patch.image = dto.image;
  if (dto.images !== undefined) patch.images = dto.images;
  if (dto.specifications !== undefined) patch.specifications = dto.specifications;
  if (dto.isNegotiable !== undefined) patch.is_negotiable = dto.isNegotiable;
  if (dto.status !== undefined) patch.status = dto.status;

  const { data, error } = await supabase
    .from('listings')
    .update(patch)
    .eq('id', id)
    .select(LISTING_SELECT)
    .single();

  if (error || !data) {
    throwApiError(500, error?.message || 'Failed to update listing');
  }

  eventBus.emit(EVENTS.LISTING_UPDATED, { listingId: id });

  return wrapResponse(toListing(data));
}

export async function remove(id: string) {
  await simulateLatency(100, 200);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data: existing, error: existingError } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    throwApiError(404, 'Listing not found');
  }

  if (existing.seller_id !== sellerId) {
    throwApiError(403, 'You can only delete your own listings');
  }

  const { error } = await supabase.from('listings').update({ status: 'deleted' }).eq('id', id);
  if (error) {
    throwApiError(500, error.message);
  }

  eventBus.emit(EVENTS.LISTING_DELETED, { listingId: id });

  return wrapResponse({ id });
}

export async function search(
  query: string,
  filters?: { category?: string; condition?: string; minPrice?: number; maxPrice?: number }
) {
  await simulateLatency(100, 250);

  const currentUserId = getCurrentUserId();

  let dbQuery = supabase.from('listings').select(LISTING_SELECT).eq('status', 'active');

  if (currentUserId) {
    dbQuery = dbQuery.neq('seller_id', currentUserId);
  }

  if (filters?.category) dbQuery = dbQuery.eq('category', filters.category);
  if (filters?.condition) dbQuery = dbQuery.eq('condition', filters.condition);
  if (filters?.minPrice !== undefined) dbQuery = dbQuery.gte('price', filters.minPrice);
  if (filters?.maxPrice !== undefined) dbQuery = dbQuery.lte('price', filters.maxPrice);

  if (query.trim()) {
    dbQuery = dbQuery.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
  }

  const { data, error } = await dbQuery.order('created_at', { ascending: false });
  if (error) throwApiError(500, error.message);

  return wrapResponse((data ?? []).map(toListing));
}

export async function getByCategory(category: string) {
  await simulateLatency(80, 150);

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('category', category)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toListing));
}

export async function getMine() {
  await simulateLatency(80, 150);

  const sellerId = getCurrentUserId();
  if (!sellerId) {
    throwApiError(401, 'Must be logged in');
  }

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('seller_id', sellerId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) throwApiError(500, error.message);
  return wrapResponse((data ?? []).map(toListing));
}

export async function getCategories() {
  await simulateLatency(50, 100);

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, icon, count, listings')
    .order('name', { ascending: true });

  if (!error && categories && categories.length > 0) {
    return wrapResponse(mergeWithDefaultCategories(categories as Category[]));
  }

  const { data: activeRows, error: activeError } = await supabase
    .from('listings')
    .select('category')
    .eq('status', 'active');

  if (activeError) {
    return wrapResponse(normalizeAndSortCategories(DEFAULT_CATEGORIES));
  }

  const categoryCountMap = new Map<string, number>();
  (activeRows ?? []).forEach((row: { category?: string }) => {
    const key = row.category?.trim();
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

  return wrapResponse(mergeWithDefaultCategories(fallbackCategories));
}

export interface EnrichedListing extends Listing {
  seller?: User | null;
}

async function fetchSellersByIds(sellerIds: string[]): Promise<Map<string, User>> {
  if (sellerIds.length === 0) return new Map();

  const { data, error } = await supabase.from('users').select(SELLER_SELECT).in('id', sellerIds);
  if (error || !data) return new Map();

  const sellers = new Map<string, User>();
  data.forEach((row) => {
    const seller = toSeller(row);
    sellers.set(seller.id, seller);
  });
  return sellers;
}

export async function getAllEnriched(filters?: { excludeSeller?: string; category?: string; limit?: number }) {
  await simulateLatency(80, 200);

  let query = supabase.from('listings').select(LISTING_SELECT).eq('status', 'active');

  if (filters?.excludeSeller) {
    query = query.neq('seller_id', filters.excludeSeller);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throwApiError(500, error.message);

  const listings = (data ?? []).map(toListing);
  const sellerIds = Array.from(new Set(listings.map((listing) => listing.sellerId)));
  const sellers = await fetchSellersByIds(sellerIds);

  const enriched: EnrichedListing[] = listings.map((listing) => ({
    ...listing,
    seller: sellers.get(listing.sellerId) ?? null,
  }));

  return wrapResponse(enriched);
}

export async function getByIdEnriched(id: string) {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) throwApiError(404, 'Listing not found');

  await supabase.rpc('increment_listing_views', { p_listing_id: id });

  const listing = toListing(data);
  const sellers = await fetchSellersByIds([listing.sellerId]);
  return wrapResponse({ ...listing, seller: sellers.get(listing.sellerId) ?? null });
}
