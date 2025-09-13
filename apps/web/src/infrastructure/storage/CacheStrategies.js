/**
 * Cache Strategies - Strategy Pattern Implementation
 * Diferentes estrategias de cache: Memory, LocalStorage, SessionStorage
 * Permite intercambiar algoritmos de cache sin cambiar el código cliente
 */

/**
 * Interface base para estrategias de cache
 */
export class CacheStrategy {
  async get(key) {
    throw new Error('Method get must be implemented');
  }

  async set(key, value, ttl) {
    throw new Error('Method set must be implemented');
  }

  async delete(key) {
    throw new Error('Method delete must be implemented');
  }

  async deletePattern(pattern) {
    throw new Error('Method deletePattern must be implemented');
  }

  async clear() {
    throw new Error('Method clear must be implemented');
  }

  async size() {
    throw new Error('Method size must be implemented');
  }

  async keys() {
    throw new Error('Method keys must be implemented');
  }
}

/**
 * Memory Cache Strategy - LRU Implementation
 * Cache en memoria con límite de tamaño y TTL
 */
export class MemoryCacheStrategy extends CacheStrategy {
  constructor(options = {}) {
    super();
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 300000; // 5 minutos
    this.cache = new Map();
    this.accessOrder = new Map(); // Para LRU
    this.timers = new Map(); // Para TTL
  }

  async get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    // Actualizar orden de acceso (LRU)
    this.accessOrder.set(key, Date.now());
    
    return entry.value;
  }

  async set(key, value, ttl = this.defaultTtl) {
    // Verificar límite de tamaño
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      await this.evictLRU();
    }

    const expiresAt = ttl ? Date.now() + ttl : null;
    
    // Limpiar timer anterior si existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Crear entrada
    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());

    // Configurar auto-eliminación por TTL
    if (ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);
    }
  }

  async delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  async deletePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    await Promise.all(keysToDelete.map(key => this.delete(key)));
  }

  async clear() {
    // Limpiar todos los timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.accessOrder.clear();
    this.timers.clear();
  }

  async size() {
    return this.cache.size;
  }

  async keys() {
    return Array.from(this.cache.keys());
  }

  // Evict Least Recently Used entry
  async evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;
    
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < lruTime) {
        lruTime = accessTime;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  // Obtener estadísticas
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredEntries: expiredCount,
      utilizationRate: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%'
    };
  }
}

/**
 * LocalStorage Cache Strategy
 * Persiste entre sesiones del navegador
 */
export class LocalStorageCacheStrategy extends CacheStrategy {
  constructor(options = {}) {
    super();
    this.prefix = options.prefix || 'cache';
    this.defaultTtl = options.defaultTtl || 300000;
    this.maxSize = options.maxSize || 500; // Límite por espacio de storage
  }

  async get(key) {
    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }

      const entry = JSON.parse(item);
      
      // Verificar TTL
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
      
    } catch (error) {
      console.error('Error getting from localStorage cache:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTtl) {
    try {
      // Verificar límite de tamaño
      const currentSize = await this.size();
      if (currentSize >= this.maxSize) {
        await this.evictOldest();
      }

      const storageKey = this.getStorageKey(key);
      const expiresAt = ttl ? Date.now() + ttl : null;
      
      const entry = {
        value,
        createdAt: Date.now(),
        expiresAt,
        key // Para facilitar la limpieza
      };

      localStorage.setItem(storageKey, JSON.stringify(entry));
      
    } catch (error) {
      console.error('Error setting localStorage cache:', error);
      
      // Si hay error de cuota, intentar limpiar y reintentar
      if (error.name === 'QuotaExceededError') {
        await this.clearExpired();
        try {
          localStorage.setItem(this.getStorageKey(key), JSON.stringify({
            value,
            createdAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
          }));
        } catch (retryError) {
          console.error('Failed to set cache after cleanup:', retryError);
        }
      }
    }
  }

  async delete(key) {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error deleting from localStorage cache:', error);
    }
  }

  async deletePattern(pattern) {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':') && regex.test(key)) {
          keysToDelete.push(key.replace(this.prefix + ':', ''));
        }
      }
      
      await Promise.all(keysToDelete.map(key => this.delete(key)));
      
    } catch (error) {
      console.error('Error deleting pattern from localStorage cache:', error);
    }
  }

  async clear() {
    try {
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing localStorage cache:', error);
    }
  }

  async size() {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          count++;
        }
      }
    } catch (error) {
      console.error('Error getting localStorage cache size:', error);
    }
    return count;
  }

  async keys() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keys.push(key.replace(this.prefix + ':', ''));
        }
      }
    } catch (error) {
      console.error('Error getting localStorage cache keys:', error);
    }
    return keys;
  }

  // Limpiar entradas expiradas
  async clearExpired() {
    try {
      const now = Date.now();
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              if (entry.expiresAt && now > entry.expiresAt) {
                keysToDelete.push(key);
              }
            }
          } catch (parseError) {
            // Si no se puede parsear, eliminar
            keysToDelete.push(key);
          }
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing expired localStorage cache:', error);
    }
  }

  // Eliminar la entrada más antigua
  async evictOldest() {
    try {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
              }
            }
          } catch (parseError) {
            // Si no se puede parsear, es candidato a eliminación
            oldestKey = key;
            break;
          }
        }
      }
      
      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
      
    } catch (error) {
      console.error('Error evicting oldest from localStorage cache:', error);
    }
  }

  getStorageKey(key) {
    return `${this.prefix}:${key}`;
  }
}

/**
 * SessionStorage Cache Strategy
 * Cache temporal que se limpia al cerrar la pestaña
 */
export class SessionStorageCacheStrategy extends LocalStorageCacheStrategy {
  constructor(options = {}) {
    super(options);
    // Heredar de LocalStorage pero usar sessionStorage
  }

  async get(key) {
    try {
      const storageKey = this.getStorageKey(key);
      const item = sessionStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }

      const entry = JSON.parse(item);
      
      // Verificar TTL
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
      
    } catch (error) {
      console.error('Error getting from sessionStorage cache:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTtl) {
    try {
      const storageKey = this.getStorageKey(key);
      const expiresAt = ttl ? Date.now() + ttl : null;
      
      const entry = {
        value,
        createdAt: Date.now(),
        expiresAt
      };

      sessionStorage.setItem(storageKey, JSON.stringify(entry));
      
    } catch (error) {
      console.error('Error setting sessionStorage cache:', error);
    }
  }

  async delete(key) {
    try {
      const storageKey = this.getStorageKey(key);
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error deleting from sessionStorage cache:', error);
    }
  }

  // Override métodos para usar sessionStorage en lugar de localStorage
  async size() {
    let count = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          count++;
        }
      }
    } catch (error) {
      console.error('Error getting sessionStorage cache size:', error);
    }
    return count;
  }

  async clear() {
    try {
      const keysToDelete = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => sessionStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing sessionStorage cache:', error);
    }
  }
}

/**
 * Multi-Level Cache Strategy - Decorator Pattern
 * Combina múltiples estrategias de cache (L1: Memory, L2: LocalStorage)
 */
export class MultiLevelCacheStrategy extends CacheStrategy {
  constructor(strategies = []) {
    super();
    this.strategies = strategies; // Ordenadas por velocidad (más rápido primero)
  }

  async get(key) {
    for (let i = 0; i < this.strategies.length; i++) {
      const value = await this.strategies[i].get(key);
      
      if (value !== null) {
        // Backfill a niveles superiores
        for (let j = 0; j < i; j++) {
          await this.strategies[j].set(key, value);
        }
        return value;
      }
    }
    
    return null;
  }

  async set(key, value, ttl) {
    // Establecer en todos los niveles
    await Promise.all(
      this.strategies.map(strategy => strategy.set(key, value, ttl))
    );
  }

  async delete(key) {
    await Promise.all(
      this.strategies.map(strategy => strategy.delete(key))
    );
  }

  async deletePattern(pattern) {
    await Promise.all(
      this.strategies.map(strategy => strategy.deletePattern(pattern))
    );
  }

  async clear() {
    await Promise.all(
      this.strategies.map(strategy => strategy.clear())
    );
  }

  async size() {
    // Retornar el tamaño del primer nivel
    return this.strategies[0]?.size() || 0;
  }

  async keys() {
    // Retornar las claves del primer nivel
    return this.strategies[0]?.keys() || [];
  }
}

/**
 * Factory para crear estrategias de cache
 */
export class CacheStrategyFactory {
  static create(type, options = {}) {
    switch (type) {
      case 'memory':
        return new MemoryCacheStrategy(options);
      
      case 'localStorage':
        return new LocalStorageCacheStrategy(options);
      
      case 'sessionStorage':
        return new SessionStorageCacheStrategy(options);
      
      case 'multiLevel':
        const strategies = options.strategies || [
          new MemoryCacheStrategy({ maxSize: 100 }),
          new LocalStorageCacheStrategy({ maxSize: 500 })
        ];
        return new MultiLevelCacheStrategy(strategies);
      
      default:
        throw new Error(`Unknown cache strategy type: ${type}`);
    }
  }

  static createDefault() {
    return this.create('multiLevel');
  }
}

