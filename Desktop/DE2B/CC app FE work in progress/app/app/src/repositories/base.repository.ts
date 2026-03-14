/**
 * Base repository — generic CRUD operations over a Dexie table.
 *
 * All entity-specific repositories extend this class and add custom
 * query methods. The base provides:
 * - getById / getAll / create / update / delete
 * - Consistent error handling + typing
 *
 * When migrating to Supabase:
 *   Replace Dexie `table.get()` / `table.put()` calls with
 *   `supabase.from('table').select()` / `.insert()` / `.update()`.
 *   Method signatures and return types stay identical.
 */
import type { Table } from 'dexie';

export class BaseRepository<T extends { id: string }> {
  constructor(protected table: Table<T, string>) {}

  /** Get a single record by primary key. Returns undefined if not found. */
  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  /** Get all records in the table. Use sparingly on large tables. */
  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  /** Insert a new record. Throws if the ID already exists. */
  async create(entity: T): Promise<T> {
    await this.table.add(entity);
    return entity;
  }

  /** Update an existing record (full or partial). Merges with existing data. */
  async update(id: string, changes: Partial<T>): Promise<T> {
    await this.table.update(id, changes);
    const updated = await this.table.get(id);
    if (!updated) throw new Error(`Entity with id "${id}" not found after update`);
    return updated;
  }

  /** Delete a record by primary key. */
  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  /** Count all records in the table. */
  async count(): Promise<number> {
    return this.table.count();
  }

  /** Bulk insert records. Skips existing IDs. */
  async bulkCreate(entities: T[]): Promise<void> {
    await this.table.bulkPut(entities);
  }
}
