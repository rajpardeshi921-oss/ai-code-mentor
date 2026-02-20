import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ParsedReview } from '../types';

interface CachedReview {
  hash: string;
  review: ParsedReview;
  timestamp: number;
}

export class FileCache {
  private static instance: FileCache;
  private cache = new Map<string, CachedReview>();

  private constructor() {}

  static getInstance(): FileCache {
    if (!FileCache.instance) {
      FileCache.instance = new FileCache();
    }
    return FileCache.instance;
  }

  computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  get(uri: vscode.Uri, content: string): ParsedReview | undefined {
    const key = uri.toString();
    const cached = this.cache.get(key);
    
    if (!cached) {
      return undefined;
    }

    const hash = this.computeHash(content);
    if (cached.hash !== hash) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.review;
  }

  set(uri: vscode.Uri, content: string, review: ParsedReview): void {
    const hash = this.computeHash(content);
    this.cache.set(uri.toString(), {
      hash,
      review,
      timestamp: Date.now()
    });
  }

  delete(uri: vscode.Uri): void {
    this.cache.delete(uri.toString());
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { totalCached: number; oldestTimestamp: number | null } {
    const timestamps = Array.from(this.cache.values()).map((c) => c.timestamp);
    return {
      totalCached: this.cache.size,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null
    };
  }
}
