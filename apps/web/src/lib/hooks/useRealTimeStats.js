/**
 * Hook personalizado para obtener estadísticas en tiempo real
 * Obtiene datos actuales de la base de datos
 */

import { useState, useEffect } from 'react';
import optimizedCache from '../optimized-supabase-cache.js';

export const useRealTimeStats = (refreshInterval = 600000) => { // 10 minutos (era 30 segundos) - REDUCCIÓN 20X
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalActivities: 0,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching real-time stats using OPTIMIZED CACHE...');

      // USAR CACHÉ OPTIMIZADO - reduce múltiples llamadas a 1 resultado cacheado
      const cachedCounters = await optimizedCache.getOptimizedCounters();

      const newStats = {
        totalUsers: cachedCounters.totalUsers,
        activeProjects: cachedCounters.activeProjects,
        completedProjects: cachedCounters.completedProjects,
        totalActivities: cachedCounters.totalActivities,
        isLoading: false,
        error: null,
        lastUpdated: cachedCounters.lastUpdated
      };

      setStats(newStats);
      console.log('✅ Real-time stats updated from CACHE:', newStats);

      return newStats;
    } catch (error) {
      console.error('❌ Error fetching real-time stats:', error);
      setStats(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      return null;
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh automático
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Función manual de refresh
  const refreshStats = async () => {
    setStats(prev => ({ ...prev, isLoading: true }));
    return await fetchStats();
  };

  return {
    ...stats,
    refreshStats
  };
};

export default useRealTimeStats;