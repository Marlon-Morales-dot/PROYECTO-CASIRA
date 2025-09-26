/**
 * OPTIMIZED SUPABASE CACHE
 * Reduce drásticamente el consumo de Egress con cache inteligente
 */

import { supabaseAPI } from './supabase-api.js';

class OptimizedSupabaseCache {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = {
      users: 10 * 60 * 1000,      // 10 minutos - usuarios no cambian frecuentemente
      activities: 5 * 60 * 1000,   // 5 minutos - actividades cambian moderadamente
      posts: 2 * 60 * 1000,       // 2 minutos - posts cambian más frecuentemente
      counters: 15 * 60 * 1000    // 15 minutos - contadores solo para landing
    };

    this.pendingRequests = new Map(); // Evitar requests duplicados simultáneos

    console.log('🚀 OptimizedSupabaseCache: Initialized with smart caching');
  }

  /**
   * Verificar si los datos están en cache y son válidos
   */
  isValidCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.duration;

    if (!isValid) {
      this.cache.delete(key);
      console.log(`🗑️ Cache expired for: ${key}`);
    }

    return isValid;
  }

  /**
   * Obtener datos del cache o hacer fetch
   */
  async getOrFetch(key, fetchFunction, duration) {
    // Verificar cache válido
    if (this.isValidCache(key)) {
      console.log(`✅ Cache HIT: ${key}`);
      return this.cache.get(key).data;
    }

    // Verificar si hay una request pendiente para evitar duplicados
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Waiting for pending request: ${key}`);
      return await this.pendingRequests.get(key);
    }

    // Hacer fetch y cachear
    console.log(`🔄 Cache MISS: Fetching ${key}`);
    const fetchPromise = this.executeWithRetry(fetchFunction, key);
    this.pendingRequests.set(key, fetchPromise);

    try {
      const data = await fetchPromise;

      // Guardar en cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        duration
      });

      console.log(`💾 Cached: ${key} (${Array.isArray(data) ? data.length : 'unknown'} items)`);
      return data;

    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Ejecutar con retry automático
   */
  async executeWithRetry(fetchFunction, key, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFunction();
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${key}:`, error.message);

        if (attempt === maxRetries) {
          // En último intento, devolver cache expirado si existe
          const expired = this.cache.get(key);
          if (expired) {
            console.log(`🆘 Returning expired cache for: ${key}`);
            return expired.data;
          }
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * OPTIMIZED METHODS - Reemplazan las llamadas directas
   */

  async getAllUsers() {
    return this.getOrFetch(
      'users',
      () => supabaseAPI.users.getAllUsers(),
      this.cacheDuration.users
    );
  }

  async getAllActivities() {
    return this.getOrFetch(
      'activities',
      () => supabaseAPI.activities.getAllActivities(),
      this.cacheDuration.activities
    );
  }

  async getAllPosts() {
    return this.getOrFetch(
      'posts',
      () => supabaseAPI.posts.getAllPosts(),
      this.cacheDuration.posts
    );
  }

  /**
   * Obtener contadores optimizados - REDUCE 3 CALLS A 1 CACHED RESULT
   */
  async getOptimizedCounters() {
    return this.getOrFetch(
      'counters',
      async () => {
        console.log('📊 Fetching all data for counters (users + activities + posts)...');

        // Hacer las 3 llamadas en paralelo SOLO una vez cada 15 minutos
        const [users, activities, posts] = await Promise.all([
          supabaseAPI.users.getAllUsers(),
          supabaseAPI.activities.getAllActivities(),
          supabaseAPI.posts.getAllPosts()
        ]);

        // Calcular estadísticas una sola vez
        const totalUsers = users.length;
        const totalActivities = activities.length;
        const totalPosts = posts.length;

        const activeStatuses = ['planning', 'active', 'in_progress', 'ongoing'];
        const completedStatuses = ['completed', 'finished', 'done'];

        const activeProjects = activities.filter(activity => {
          const status = activity.status?.toLowerCase();
          return activeStatuses.includes(status);
        }).length;

        const completedProjects = activities.filter(activity => {
          const status = activity.status?.toLowerCase();
          return completedStatuses.includes(status);
        }).length;

        const counters = {
          totalUsers,
          activeProjects,
          completedProjects,
          totalActivities,
          totalPosts,
          lastUpdated: new Date().toISOString()
        };

        console.log('✅ Optimized counters calculated:', counters);
        return counters;
      },
      this.cacheDuration.counters
    );
  }

  /**
   * Invalidar cache específico cuando hay cambios
   */
  invalidateCache(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
        console.log(`🗑️ Cache invalidated: ${key}`);
      }
    });
  }

  /**
   * Limpiar todo el cache
   */
  clearAll() {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🧹 All cache cleared');
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    const stats = {
      totalCached: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys()),
      memory: this.cache.size * 0.1 // Estimación muy aproximada en MB
    };

    console.log('📈 Cache Stats:', stats);
    return stats;
  }

  /**
   * Pre-cargar datos críticos
   */
  async preloadCriticalData() {
    console.log('🚀 Preloading critical data...');

    try {
      // Pre-cargar en paralelo pero sin bloquear
      Promise.all([
        this.getOptimizedCounters(),
        this.getAllUsers(),
        this.getAllActivities()
      ]).catch(error => {
        console.warn('⚠️ Preload failed (non-critical):', error.message);
      });

    } catch (error) {
      console.warn('⚠️ Preload error (non-critical):', error.message);
    }
  }
}

// Singleton instance
const optimizedCache = new OptimizedSupabaseCache();

// Auto-preload en background después de 1 segundo
setTimeout(() => {
  optimizedCache.preloadCriticalData();
}, 1000);

export default optimizedCache;
export { OptimizedSupabaseCache };