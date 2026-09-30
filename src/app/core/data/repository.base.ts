import { signal, WritableSignal } from '@angular/core';
import { IDBPDatabase, StoreNames } from 'idb';
import { MindCareDbSchema, getDb } from './db';
import { AuditFields, Id } from '../models';

/**
 * Generic IndexedDB-backed repository. Every feature repository extends this
 * to get CRUD + a live Signal of the full collection, so any screen reading
 * `repo.items()` reflects admin CRUD changes instantly with no manual refresh
 * wiring — this is what satisfies "انعكاس التغييرات فوراً في جميع الشاشات".
 */
export abstract class RepositoryBase<
  StoreName extends StoreNames<MindCareDbSchema>,
  T extends AuditFields & { id: Id } = MindCareDbSchema[StoreName]['value'],
> {
  protected readonly storeName: StoreName;
  private readonly _items: WritableSignal<T[]> = signal<T[]>([]);
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  readonly items = this._items.asReadonly();

  protected constructor(storeName: StoreName) {
    this.storeName = storeName;
  }

  /** Ensures the in-memory Signal cache mirrors IndexedDB. Safe to call repeatedly. */
  async ready(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = this.reload();
    }
    return this.loadPromise;
  }

  async reload(): Promise<void> {
    const db = await this.db();
    const all = (await db.getAll(this.storeName)) as unknown as T[];
    this._items.set(all);
    this.loaded = true;
  }

  async getAll(): Promise<T[]> {
    await this.ready();
    return this._items();
  }

  async getById(id: Id): Promise<T | undefined> {
    await this.ready();
    return this._items().find((i) => (i as unknown as { id: Id }).id === id);
  }

  async create(entity: T): Promise<T> {
    const db = await this.db();
    const now = new Date().toISOString();
    const withAudit = { ...entity, createdAt: entity.createdAt || now, updatedAt: now };
    await db.put(this.storeName, withAudit as any);
    await this.reload();
    return withAudit;
  }

  async update(id: Id, patch: Partial<T>): Promise<T | undefined> {
    const db = await this.db();
    const existing = (await db.get(this.storeName, id as any)) as unknown as T | undefined;
    if (!existing) return undefined;
    const updated: T = { ...existing, ...patch, updatedAt: new Date().toISOString() } as T;
    await db.put(this.storeName, updated as any);
    await this.reload();
    return updated;
  }

  async remove(id: Id): Promise<void> {
    const db = await this.db();
    await db.delete(this.storeName, id as any);
    await this.reload();
  }

  async bulkSeed(entities: T[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(this.storeName, 'readwrite');
    for (const e of entities) {
      await tx.store.put(e as any);
    }
    await tx.done;
    await this.reload();
  }

  async count(): Promise<number> {
    const db = await this.db();
    return db.count(this.storeName);
  }

  protected db(): Promise<IDBPDatabase<MindCareDbSchema>> {
    return getDb();
  }
}
