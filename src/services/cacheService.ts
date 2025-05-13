import { Relato } from './relatosService';

interface CacheConfig {
  duration: number;
  maxSize: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { data: any; timestamp: number }>;
  private config: CacheConfig = {
    duration: 5 * 60 * 1000, // 5 minutos em milissegundos
    maxSize: 100 // Número máximo de itens no cache
  };

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public set(key: string, data: any): void {
    if (this.cache.size >= this.config.maxSize) {
      // Remove o item mais antigo se o cache estiver cheio
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.config.duration) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  public clear(): void {
    this.cache.clear();
  }

  public remove(key: string): void {
    this.cache.delete(key);
  }

  public setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getSize(): number {
    return this.cache.size;
  }

  public isValid(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    return Date.now() - item.timestamp <= this.config.duration;
  }
}

export const cacheService = CacheService.getInstance();