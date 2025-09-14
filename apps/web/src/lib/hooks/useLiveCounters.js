/**
 * Hook especializado para contadores en vivo con suscripción a cambios
 * Proporciona datos actualizados para los contadores de la LandingPage
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase-singleton.js';
import { supabaseAPI } from '../supabase-api.js';

export const useLiveCounters = (options = {}) => {
  const {
    enableRealTimeSubscription = true,
    refreshInterval = 15000, // 15 segundos por defecto
    retryAttempts = 3,
    retryDelay = 2000
  } = options;

  const [counters, setCounters] = useState({
    totalUsers: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalActivities: 0,
    totalPosts: 0,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const subscriptionsRef = useRef([]);
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);

  const fetchCounters = async () => {
    try {
      console.log('🔄 Fetching live counters...');

      // Obtener todos los datos en paralelo para mejor performance
      const [users, activities, posts] = await Promise.all([
        supabaseAPI.users.getAllUsers(),
        supabaseAPI.activities.getAllActivities(),
        supabaseAPI.posts.getAllPosts()
      ]);

      // Calcular estadísticas
      const totalUsers = users.length;
      const totalActivities = activities.length;
      const totalPosts = posts.length;

      // Contar proyectos por estado
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

      const newCounters = {
        totalUsers,
        activeProjects,
        completedProjects,
        totalActivities,
        totalPosts,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };

      setCounters(newCounters);
      retryCountRef.current = 0; // Reset retry count on success

      console.log('✅ Live counters updated:', newCounters);
      return newCounters;

    } catch (error) {
      console.error('❌ Error fetching live counters:', error);

      // Implementar retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        console.log(`🔄 Retrying... Attempt ${retryCountRef.current}/${retryAttempts}`);

        setTimeout(() => {
          fetchCounters();
        }, retryDelay * retryCountRef.current);
      } else {
        setCounters(prev => ({
          ...prev,
          error: error.message,
          isLoading: false
        }));
      }
    }
  };

  const setupRealTimeSubscriptions = () => {
    if (!enableRealTimeSubscription) return;

    console.log('🔔 Setting up real-time subscriptions for counters');

    // Suscripción a cambios en usuarios
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('👤 User change detected:', payload.eventType);
          fetchCounters();
        }
      )
      .subscribe();

    // Suscripción a cambios en actividades
    const activitiesSubscription = supabase
      .channel('activities-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          console.log('📋 Activity change detected:', payload.eventType);
          fetchCounters();
        }
      )
      .subscribe();

    // Suscripción a cambios en posts
    const postsSubscription = supabase
      .channel('posts-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('📝 Post change detected:', payload.eventType);
          fetchCounters();
        }
      )
      .subscribe();

    subscriptionsRef.current = [
      usersSubscription,
      activitiesSubscription,
      postsSubscription
    ];
  };

  const setupPolling = () => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchCounters();
      }, refreshInterval);
    }
  };

  const cleanup = () => {
    // Limpiar suscripciones
    subscriptionsRef.current.forEach(subscription => {
      subscription.unsubscribe();
    });
    subscriptionsRef.current = [];

    // Limpiar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Inicialización
  useEffect(() => {
    fetchCounters();
    setupRealTimeSubscriptions();
    setupPolling();

    return cleanup;
  }, []);

  // Función para refresh manual
  const refreshCounters = async () => {
    setCounters(prev => ({ ...prev, isLoading: true }));
    return await fetchCounters();
  };

  // Función para toggle real-time
  const toggleRealTime = (enabled) => {
    if (enabled && subscriptionsRef.current.length === 0) {
      setupRealTimeSubscriptions();
    } else if (!enabled && subscriptionsRef.current.length > 0) {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
    }
  };

  return {
    ...counters,
    refreshCounters,
    toggleRealTime
  };
};

export default useLiveCounters;