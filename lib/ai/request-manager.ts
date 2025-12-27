import { aiRouter } from './router';
import { localCache } from './cache-db';
import { TaskType, GenRequest } from './types';
import { simpleHash } from './utils';

export class RequestManager {
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private activeRequests = 0;
  private maxConcurrency = 3;
  private queue: Array<() => void> = [];

  private generateKey(task: TaskType, content: string, promptVer: string): string {
    const contentHash = simpleHash(content.trim());
    return `v1:${task}:${contentHash}:${promptVer}`;
  }

  async schedule<T>(
    task: TaskType, 
    content: string, 
    req: GenRequest, 
    promptVersion: string
  ): Promise<T> {
    const cacheKey = this.generateKey(task, content, promptVersion);

    // 1. Check Local Cache
    const cached = await localCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`[Cache] HIT local for ${task}: ${content.substring(0, 10)}...`);
      return cached.data as T;
    }

    // 2. Check In-Flight
    if (this.inFlightRequests.has(cacheKey)) {
      console.log(`[Cache] HIT in-flight for ${task}`);
      return this.inFlightRequests.get(cacheKey) as Promise<T>;
    }

    // 3. Execute
    const promise = this.executeWithQueue<T>(async () => {
      const res = await aiRouter.dispatch<T>(task, req, !!req.jsonMode);
      
      const entry = {
        id: cacheKey,
        data: res.data || res.text,
        promptVersion,
        providerUsed: res.provider,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days TTL
      };
      
      await localCache.set(entry);
      return entry.data as T;
    });

    this.inFlightRequests.set(cacheKey, promise);
    
    // Cleanup after completion (success or fail)
    promise.finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    return promise;
  }

  private async executeWithQueue<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrency) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.activeRequests++;
    try {
      return await fn();
    } finally {
      this.activeRequests--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }
}

export const aiManager = new RequestManager();
