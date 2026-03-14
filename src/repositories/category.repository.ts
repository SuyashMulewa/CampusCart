/**
 * Category repository — data access for the `categories` IndexedDB table.
 */
import { db } from '@/db/database';
import type { Category } from '@/models/category.model';
import { BaseRepository } from './base.repository';

class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(db.categories);
  }

  /** Find a category by name. */
  async findByName(name: string): Promise<Category | undefined> {
    return this.table.where('name').equals(name).first();
  }
}

export const categoryRepository = new CategoryRepository();
