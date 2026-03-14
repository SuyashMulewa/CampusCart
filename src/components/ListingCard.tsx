/**
 * Reusable app component: L is ti ng Ca rd.
 */
// src/components/ListingCard.tsx
import type { Listing } from '@/types/models';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div className="rounded-xl border p-4">
      <img src={listing.images[0]} alt={listing.title} className="rounded mb-2" />
      <h3 className="font-bold">{listing.title}</h3>
      <p>₹{listing.price}</p>
      <span className="text-xs">{listing.category}</span>
      {/* TODO: Add actions (edit, delete, view) */}
    </div>
  );
}

