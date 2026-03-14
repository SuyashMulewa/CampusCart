/**
 * Listing hooks — browsing, searching, CRUD.
 *
 * Queries auto-invalidate when ListingEvents fire via useEventSubscription.
 * Supabase migration: Replace service calls with supabase.from('listings').* calls.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as listingService from '@/services/listing.service';
import type { CreateListingDTO, UpdateListingDTO } from '@/models';
import type { Product } from '@/data/mockData';
import { listingToProduct } from '@/utils/compat';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get all active listings (optionally filtered). */
export function useListings(filters?: Parameters<typeof listingService.getAll>[0]) {
  const qc = useQueryClient();

  // Auto-refetch when any listing changes
  useEventSubscription(EVENTS.LISTING_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });
  useEventSubscription(EVENTS.LISTING_UPDATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });
  useEventSubscription(EVENTS.LISTING_DELETED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });

  return useQuery({
    queryKey: [...queryKeys.listings.all, filters],
    queryFn: async () => {
      const res = await listingService.getAll(filters);
      return res.data;
    },
  });
}

/** Get a single listing by ID (auto-increments views). */
export function useListing(id: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.LISTING_UPDATED, (payload) => {
    if (payload.listingId === id) {
      qc.invalidateQueries({ queryKey: queryKeys.listings.detail(id!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.listings.detail(id ?? ''),
    queryFn: async () => {
      const res = await listingService.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

/** Search listings by query string and optional filters. */
export function useListingSearch(
  query: string,
  filters?: Parameters<typeof listingService.search>[1],
) {
  return useQuery({
    queryKey: queryKeys.listings.search(query, filters as Record<string, unknown>),
    queryFn: async () => {
      const res = await listingService.search(query, filters);
      return res.data;
    },
    enabled: query.length > 0,
  });
}

/** Get listings by category slug. */
export function useListingsByCategory(category: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listings.byCategory(category ?? ''),
    queryFn: async () => {
      const res = await listingService.getByCategory(category!);
      return res.data;
    },
    enabled: !!category,
  });
}

/** Get the current user's listings. */
export function useMyListings() {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.LISTING_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
  });
  useEventSubscription(EVENTS.LISTING_UPDATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
  });
  useEventSubscription(EVENTS.LISTING_DELETED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
  });

  return useQuery({
    queryKey: queryKeys.listings.mine,
    queryFn: async () => {
      const res = await listingService.getMine();
      return res.data;
    },
  });
}

/** Get all product categories. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.listings.categories,
    queryFn: async () => {
      const res = await listingService.getCategories();
      return res.data;
    },
    staleTime: 0,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Create a new listing. */
export function useCreateListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateListingDTO) => {
      const res = await listingService.create(dto);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
    },
  });
}

/** Update an existing listing. */
export function useUpdateListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateListingDTO }) => {
      const res = await listingService.update(id, dto);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
    },
  });
}

/** Soft-delete (archive) a listing. */
export function useDeleteListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await listingService.remove(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
    },
  });
}

// ─── Enriched Queries (compat layer for legacy ProductCard) ──

/**
 * Get all listings as legacy Product objects (with embedded seller).
 * Use this during migration while ProductCard still expects the old Product type.
 * Remove once ProductCard is refactored to accept the new Listing model.
 */
export function useListingsAsProducts(filters?: Parameters<typeof listingService.getAllEnriched>[0]) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.LISTING_CREATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });
  useEventSubscription(EVENTS.LISTING_UPDATED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });
  useEventSubscription(EVENTS.LISTING_DELETED, () => {
    qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  });

  return useQuery({
    queryKey: [...queryKeys.listings.all, 'enriched', filters],
    queryFn: async () => {
      const res = await listingService.getAllEnriched(filters);
      return res.data.map((l) => listingToProduct(l, l.seller));
    },
  });
}

/**
 * Get a single listing as a legacy Product object.
 */
export function useListingAsProduct(id: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.LISTING_UPDATED, (payload) => {
    if (payload.listingId === id) {
      qc.invalidateQueries({ queryKey: queryKeys.listings.detail(id!) });
    }
  });

  return useQuery({
    queryKey: [...queryKeys.listings.detail(id ?? ''), 'enriched'],
    queryFn: async () => {
      const res = await listingService.getByIdEnriched(id!);
      return listingToProduct(res.data, res.data.seller);
    },
    enabled: !!id,
  });
}
