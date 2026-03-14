/**
 * Category model — product category with display metadata.
 * Categories are reference data seeded once and rarely modified.
 *
 * IndexedDB table: `categories`
 * Indexes: `++id, name`
 */

export interface Category {
  /** Primary key — e.g. 'c1' */
  id: string;
  name: string;
  /** Lucide icon name (e.g., 'BookOpen', 'Monitor') */
  icon: string;
  /** Total count of listings in this category */
  count: number;
  /** Human-readable count label (e.g., '12k+') */
  listings: string;
}
