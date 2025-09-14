/**
 * Hook personalizado para obtener estadísticas en tiempo real
 * Obtiene datos actuales de la base de datos
 */

import { useState, useEffect } from 'react';
import { supabaseAPI } from '../supabase-api.js';

export const useRealTimeStats = (refreshInterval = 30000) => {
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
      // Obtener usuarios totales
      const users = await supabaseAPI.users.getAllUsers();
      const totalUsers = users.length;

      // Obtener actividades
      const activities = await supabaseAPI.activities.getAllActivities();
      const totalActivities = activities.length;

      // Contar proyectos activos (estado: planning, active, in_progress)
      const activeStatuses = ['planning', 'active', 'in_progress'];
      const activeProjects = activities.filter(activity =>
        activeStatuses.includes(activity.status?.toLowerCase())
      ).length;

      // Contar proyectos completados (estado: completed, finished, done)
      const completedStatuses = ['completed', 'finished', 'done'];
      const completedProjects = activities.filter(activity =>
        completedStatuses.includes(activity.status?.toLowerCase())
      ).length;

      const newStats = {
        totalUsers,
        activeProjects,
        completedProjects,
        totalActivities,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };

      setStats(newStats);
      console.log('📊 Real-time stats updated:', newStats);

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