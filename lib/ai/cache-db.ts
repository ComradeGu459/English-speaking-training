import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CacheEntry } from './types';

interface AppDB extends DBSchema {
  ai_cache: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-created': number };
  };
}

const DB_NAME = 'echo_speak_ai_cache';
const VERSION = 1;

class CacheDB {
  private dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.dbPromise = openDB<AppDB>(DB_NAME, VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('ai_cache')) {
            const store = db.createObjectStore('ai_cache', { keyPath: 'id' });
            store.createIndex('by-created', 'createdAt');
          }
        },
      });
    }
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    if (!this.dbPromise) return undefined;
    try {
      return (await this.dbPromise).get('ai_cache', key);
    } catch (e) {
      console.warn("Cache read failed", e);
      return undefined;
    }
  }

  async set(entry: CacheEntry): Promise<void> {
    if (!this.dbPromise) return;
    try {
      await (await this.dbPromise).put('ai_cache', entry);
    } catch (e) {
      console.warn("Cache write failed", e);
    }
  }
}

export const localCache = new CacheDB();
