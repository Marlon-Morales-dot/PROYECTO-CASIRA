/**
 * CachedRepository - Decorator Pattern + Strategy Pattern
 * Añade capacidades de cache a cualquier repositorio
 * Implementa Strategy para diferentes tipos de cache
 * Mejora rendimiento y reduce llamadas a la red
 */

export class CachedRepository {
  constructor(repository, cacheStrategy, options = {}) {
    this.repository = repository;
    this.cacheStrategy = cacheStrategy;
    this.options = {
      ttl: options.ttl || 300000, // 5 minutos por defecto
      maxEntries: options.maxEntries || 1000,
      keyPrefix: options.keyPrefix || 'repo',
      enableLogging: options.enableLogging || false,
      ...options
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      errors: 0
    };
  }

  /**
   * Buscar por ID con cache
   */
  async findById(id) {
    const cacheKey = this.generateKey('findById', id);
    
    try {
      // Intentar obtener del cache
      const cached = await this.cacheStrategy.get(cacheKey);
      if (cached) {
        this.stats.hits++;
        this.log(`Cache HIT for ${cacheKey}`);
        return this.deserializeEntity(cached);
      }

      // Cache miss - obtener del repositorio
      this.stats.misses++;
      this.log(`Cache MISS for ${cacheKey}`);
      
      const entity = await this.repository.findById(id);
      
      if (entity) {
        await this.cacheStrategy.set(
          cacheKey, 
          this.serializeEntity(entity), 
          this.options.ttl
        );
        this.log(`Cached entity for ${cacheKey}`);
      }
      
      return entity;
      
    } catch (error) {
      this.stats.errors++;
      this.log(`Cache ERROR for ${cacheKey}: ${error.message}`);
      
      // Fallback al repositorio sin cache
      return await this.repository.findById(id);
    }
  }

  /**
   * Buscar por email con cache
   */
  async findByEmail(email) {
    const cacheKey = this.generateKey('findByEmail', email);
    
    try {
      const cached = await this.cacheStrategy.get(cacheKey);
      if (cached) {
        this.stats.hits++;
        return this.deserializeEntity(cached);
      }

      this.stats.misses++;
      const entity = await this.repository.findByEmail(email);
      
      if (entity) {
        await this.cacheStrategy.set(
          cacheKey, 
          this.serializeEntity(entity), 
          this.options.ttl
        );
      }
      
      return entity;
      
    } catch (error) {
      this.stats.errors++;
      return await this.repository.findByEmail(email);
    }
  }

  /**
   * Buscar todos con cache (con invalidación inteligente)
   */
  async findAll(filters = {}, pagination = {}, sorting = {}) {
    // Para queries complejas, usar cache más corto
    const shortTtl = this.options.ttl / 5;
    const cacheKey = this.generateKey('findAll', { filters, pagination, sorting });
    
    try {
      const cached = await this.cacheStrategy.get(cacheKey);
      if (cached) {
        this.stats.hits++;
        return {
          ...cached,
          activities: cached.activities?.map(a => this.deserializeEntity(a)) || [],
          users: cached.users?.map(u => this.deserializeEntity(u)) || []
        };
      }

      this.stats.misses++;
      const result = await this.repository.findAll(filters, pagination, sorting);
      
      if (result && (result.activities || result.users)) {
        const serializedResult = {
          ...result,
          activities: result.activities?.map(a => this.serializeEntity(a)) || [],
          users: result.users?.map(u => this.serializeEntity(u)) || []
        };
        
        await this.cacheStrategy.set(cacheKey, serializedResult, shortTtl);
      }
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      return await this.repository.findAll(filters, pagination, sorting);
    }
  }

  /**
   * Crear entidad (invalida cache relacionado)
   */
  async create(entity) {
    try {
      const result = await this.repository.create(entity);
      
      // Invalidar cache relacionado
      await this.invalidateRelatedCache('create', entity);
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Actualizar entidad (invalida cache relacionado)
   */
  async update(entity) {
    try {
      const result = await this.repository.update(entity);
      
      // Invalidar cache relacionado
      await this.invalidateRelatedCache('update', entity);
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Eliminar entidad (invalida cache relacionado)
   */
  async delete(id) {
    try {
      const result = await this.repository.delete(id);
      
      // Invalidar cache relacionado
      await this.invalidateRelatedCache('delete', { id });
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Búsqueda con cache
   */
  async search(searchText, filters = {}, pagination = {}) {
    // Búsquedas tienen TTL más corto
    const searchTtl = this.options.ttl / 10;
    const cacheKey = this.generateKey('search', { searchText, filters, pagination });
    
    try {
      const cached = await this.cacheStrategy.get(cacheKey);
      if (cached) {
        this.stats.hits++;
        return {
          ...cached,
          activities: cached.activities?.map(a => this.deserializeEntity(a)) || [],
          users: cached.users?.map(u => this.deserializeEntity(u)) || []
        };
      }

      this.stats.misses++;
      const result = await this.repository.search(searchText, filters, pagination);
      
      if (result && (result.activities || result.users)) {
        const serializedResult = {
          ...result,
          activities: result.activities?.map(a => this.serializeEntity(a)) || [],
          users: result.users?.map(u => this.serializeEntity(u)) || []
        };
        
        await this.cacheStrategy.set(cacheKey, serializedResult, searchTtl);
      }
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      return await this.repository.search(searchText, filters, pagination);
    }
  }

  /**
   * Invalidar cache específico por patrón
   */
  async invalidateByPattern(pattern) {
    try {
      await this.cacheStrategy.deletePattern(`${this.options.keyPrefix}:${pattern}`);
      this.log(`Invalidated cache pattern: ${pattern}`);
    } catch (error) {
      this.log(`Error invalidating pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * Limpiar todo el cache del repositorio
   */
  async clearCache() {
    try {
      await this.cacheStrategy.deletePattern(`${this.options.keyPrefix}:*`);
      this.log('Cleared all repository cache');
    } catch (error) {
      this.log(`Error clearing cache: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
      
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests: this.stats.hits + this.stats.misses
    };
  }

  /**
   * Resetear estadísticas
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      errors: 0
    };
  }

  // ===============================================================================
  // MÉTODOS PRIVADOS
  // ===============================================================================

  /**
   * Generar clave de cache
   */
  generateKey(method, params) {
    const paramString = typeof params === 'object' 
      ? JSON.stringify(params) 
      : String(params);
    
    return `${this.options.keyPrefix}:${method}:${this.hashString(paramString)}`;
  }

  /**
   * Hash simple para claves
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Serializar entidad para cache
   */
  serializeEntity(entity) {
    if (!entity) return null;
    
    // Si tiene método toJSON, usarlo
    if (typeof entity.toJSON === 'function') {
      return entity.toJSON();
    }
    
    // Serialización básica
    return JSON.parse(JSON.stringify(entity));
  }

  /**
   * Deserializar entidad desde cache
   */
  deserializeEntity(cached) {
    if (!cached) return null;
    
    // Reconstruir entidad usando el factory apropiado
    // En una implementación más sofisticada, se determinaría el tipo automáticamente
    return cached;
  }

  /**
   * Invalidar cache relacionado basado en la operación
   */
  async invalidateRelatedCache(operation, entity) {
    try {
      const patterns = [];
      
      switch (operation) {
        case 'create':
        case 'update':
        case 'delete':
          // Invalidar findAll y search
          patterns.push('findAll:*', 'search:*');
          
          // Invalidar específicos si hay ID
          if (entity.id) {
            patterns.push(`findById:*${entity.id}*`);
          }
          
          // Invalidar por email si existe
          if (entity.email) {
            patterns.push(`findByEmail:*${entity.email}*`);
          }
          break;
      }
      
      // Ejecutar invalidaciones en paralelo
      await Promise.all(
        patterns.map(pattern => this.invalidateByPattern(pattern))
      );
      
    } catch (error) {
      this.log(`Error invalidating related cache: ${error.message}`);
    }
  }

  /**
   * Logging condicional
   */
  log(message) {
    if (this.options.enableLogging) {
      console.log(`[CachedRepository] ${message}`);
    }
  }

  /**
   * Proxy para métodos no implementados (delegación al repositorio original)
   */
  static createProxy(repository, cacheStrategy, options = {}) {
    const cachedRepo = new CachedRepository(repository, cacheStrategy, options);
    
    return new Proxy(cachedRepo, {
      get(target, prop) {
        // Si el método existe en CachedRepository, usarlo
        if (prop in target) {
          return target[prop];
        }
        
        // Si el método existe en el repositorio original, delegarlo
        if (prop in target.repository && typeof target.repository[prop] === 'function') {
          return target.repository[prop].bind(target.repository);
        }
        
        return undefined;
      }
    });
  }
}

export default CachedRepository;