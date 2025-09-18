/**
 * Hook para gestionar suscripciones a actividades en tiempo real
 * Maneja registro, aprobación/rechazo y conteo de voluntarios
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import activityRegistrationsService from '../services/activity-registrations.service.js';

export const useActivityRegistrations = (activityId = null, options = {}) => {
  const {
    autoSubscribe = true,
    refreshOnMount = true
  } = options;

  const [registrations, setRegistrations] = useState({
    activity: null,
    pendingRequests: [],
    approvedRequests: [],
    rejectedRequests: [],
    participants: [],
    volunteerCount: 0,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const unsubscribeRef = useRef(null);

  // ============= DATOS =============

  const fetchRegistrations = useCallback(async () => {
    if (!activityId) return;

    try {
      setRegistrations(prev => ({ ...prev, isLoading: true, error: null }));

      const data = await activityRegistrationsService.getActivityRegistrations(activityId);

      setRegistrations({
        ...data,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });

      console.log('📊 HOOK: Registrations updated:', {
        pending: data.pendingRequests.length,
        participants: data.participants.length
      });

    } catch (error) {
      console.error('❌ HOOK: Error fetching registrations:', error);
      setRegistrations(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, [activityId]);

  // ============= ACCIONES =============

  const registerForActivity = useCallback(async (userInfo, message = '') => {
    if (!activityId) {
      throw new Error('ID de actividad requerido');
    }

    setIsRegistering(true);
    try {
      console.log('🎯 HOOK: Registering for activity:', { activityId, userInfo });

      const result = await activityRegistrationsService.registerForActivity(
        activityId,
        userInfo,
        message
      );

      // Refrescar datos después del registro
      await fetchRegistrations();

      console.log('✅ HOOK: Registration successful');
      return result;

    } catch (error) {
      console.error('❌ HOOK: Registration failed:', error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  }, [activityId, fetchRegistrations]);

  const approveRequest = useCallback(async (requestId, adminUserId, notes = '') => {
    setIsApproving(true);
    try {
      console.log('✅ HOOK: Approving request:', requestId);

      const result = await activityRegistrationsService.approveRegistration(
        requestId,
        adminUserId,
        notes
      );

      // Refrescar datos después de la aprobación
      await fetchRegistrations();

      console.log('✅ HOOK: Request approved');
      return result;

    } catch (error) {
      console.error('❌ HOOK: Approval failed:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [fetchRegistrations]);

  const rejectRequest = useCallback(async (requestId, adminUserId, notes = '') => {
    setIsApproving(true);
    try {
      console.log('❌ HOOK: Rejecting request:', requestId);

      const result = await activityRegistrationsService.rejectRegistration(
        requestId,
        adminUserId,
        notes
      );

      // Refrescar datos después del rechazo
      await fetchRegistrations();

      console.log('✅ HOOK: Request rejected');
      return result;

    } catch (error) {
      console.error('❌ HOOK: Rejection failed:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [fetchRegistrations]);

  // ============= SUSCRIPCIÓN EN TIEMPO REAL =============

  const setupRealTimeSubscription = useCallback(() => {
    if (!activityId || !autoSubscribe) return;

    console.log('👂 HOOK: Setting up real-time subscription for:', activityId);

    // Cleanup anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Nueva suscripción
    unsubscribeRef.current = activityRegistrationsService.subscribeToActivityRegistrations(
      activityId,
      (update) => {
        console.log('🔄 HOOK: Real-time update received:', update.type);

        // Refrescar datos cuando hay cambios
        if (update.type === 'registration_change' || update.type === 'volunteer_count_update') {
          fetchRegistrations();
        }
      }
    );

  }, [activityId, autoSubscribe, fetchRegistrations]);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // ============= EFECTOS =============

  // Inicialización
  useEffect(() => {
    if (activityId) {
      if (refreshOnMount) {
        fetchRegistrations();
      }
      if (autoSubscribe) {
        setupRealTimeSubscription();
      }
    }

    return cleanup;
  }, [activityId, refreshOnMount, autoSubscribe, fetchRegistrations, setupRealTimeSubscription, cleanup]);

  // ============= UTILIDADES =============

  const isUserRegistered = useCallback((userId) => {
    return registrations.participants.some(p =>
      p.user_id === userId ||
      p.user?.id === userId ||
      p.user?.supabase_id === userId
    );
  }, [registrations.participants]);

  const isUserPending = useCallback((userId) => {
    return registrations.pendingRequests.some(r =>
      r.user_id === userId ||
      r.user?.id === userId ||
      r.user?.supabase_id === userId
    );
  }, [registrations.pendingRequests]);

  const getUserRegistrationStatus = useCallback((userId) => {
    if (isUserRegistered(userId)) return 'approved';
    if (isUserPending(userId)) return 'pending';

    const rejected = registrations.rejectedRequests.find(r =>
      r.user_id === userId ||
      r.user?.id === userId ||
      r.user?.supabase_id === userId
    );
    if (rejected) return 'rejected';

    return 'none';
  }, [isUserRegistered, isUserPending, registrations.rejectedRequests]);

  const canRegister = useCallback((userId) => {
    const status = getUserRegistrationStatus(userId);
    const hasSpots = !registrations.activity?.max_volunteers ||
                    registrations.volunteerCount < registrations.activity.max_volunteers;

    return status === 'none' && hasSpots;
  }, [getUserRegistrationStatus, registrations.activity, registrations.volunteerCount]);

  // ============= REFRESH MANUAL =============

  const refresh = useCallback(async () => {
    await fetchRegistrations();
  }, [fetchRegistrations]);

  // ============= TOGGLE SUSCRIPCIÓN =============

  const toggleRealTime = useCallback((enabled) => {
    if (enabled && !unsubscribeRef.current) {
      setupRealTimeSubscription();
    } else if (!enabled && unsubscribeRef.current) {
      cleanup();
    }
  }, [setupRealTimeSubscription, cleanup]);

  return {
    // Datos
    ...registrations,

    // Estados de carga
    isRegistering,
    isApproving,

    // Acciones
    registerForActivity,
    approveRequest,
    rejectRequest,
    refresh,

    // Utilidades
    isUserRegistered,
    isUserPending,
    getUserRegistrationStatus,
    canRegister,

    // Control
    toggleRealTime,
    cleanup
  };
};

// Hook simplificado para obtener todas las solicitudes pendientes (Admin)
export const usePendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await activityRegistrationsService.getAllPendingRequests();
      setRequests(data);

      console.log('📋 HOOK: Pending requests loaded:', data.length);

    } catch (error) {
      console.error('❌ HOOK: Error loading pending requests:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const refresh = useCallback(async () => {
    await fetchPendingRequests();
  }, [fetchPendingRequests]);

  return {
    requests,
    isLoading,
    error,
    refresh
  };
};

// Hook para obtener TODAS las solicitudes (pendientes, aprobadas, rechazadas) para el admin
export const useAllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await activityRegistrationsService.getAllRequests();
      setRequests(data);

      console.log('📋 HOOK: All requests loaded:', data.length, 'total requests');
      console.log('📊 HOOK: Status breakdown:', {
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length
      });

    } catch (error) {
      console.error('❌ HOOK: Error loading all requests:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests();

    // Configurar Supabase Realtime para actualizaciones instantáneas de solicitudes
    let realtimeChannel = null;
    const setupRealtime = async () => {
      try {
        const { supabase: supabaseClient } = await import('../supabase-singleton.js');

        realtimeChannel = supabaseClient
          .channel('admin-volunteer-requests')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'volunteer_requests'
          }, (payload) => {
            console.log('⚡ REALTIME ADMIN: Cambio en solicitud detectado:', payload);
            // Recargar todas las solicitudes cuando hay cambios
            fetchAllRequests();
          })
          .subscribe();

        console.log('✅ REALTIME ADMIN: Suscripción activada para volunteer_requests');
      } catch (error) {
        console.warn('⚠️ REALTIME ADMIN: No se pudo activar realtime:', error);
      }
    };

    setupRealtime();

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        console.log('🧹 REALTIME ADMIN: Canal desconectado');
      }
    };
  }, [fetchAllRequests]);

  const refresh = useCallback(async () => {
    await fetchAllRequests();
  }, [fetchAllRequests]);

  return {
    requests,
    isLoading,
    error,
    refresh
  };
};

export default useActivityRegistrations;