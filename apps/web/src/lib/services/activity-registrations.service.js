// ============= CASIRA Activity Registrations Service =============
// Servicio para manejar suscripciones a actividades en tiempo real
import { supabase } from '../supabase-singleton.js';
import { supabaseAPI } from '../supabase-api.js';

class ActivityRegistrationsService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  // ============= SUSCRIPCIÓN A ACTIVIDADES =============

  async registerForActivity(activityId, userInfo, message = '') {
    try {
      console.log('🎯 REGISTER: Starting activity registration:', { activityId, userInfo });

      // 1. Validar y resolver usuario
      const resolvedUser = await this.resolveUserForRegistration(userInfo);
      if (!resolvedUser || !resolvedUser.supabase_id) {
        throw new Error('No se pudo resolver el usuario para la suscripción');
      }

      // 2. Verificar que la actividad existe en Supabase
      const activity = await this.getActivityFromSupabase(activityId);
      if (!activity) {
        throw new Error('Actividad no encontrada en la base de datos');
      }

      // 3. Verificar si ya está registrado
      const existingRequest = await this.checkExistingRegistration(activityId, resolvedUser.supabase_id);
      if (existingRequest) {
        if (existingRequest.status === 'approved') {
          throw new Error('Ya estás registrado y aprobado para esta actividad');
        } else if (existingRequest.status === 'pending') {
          throw new Error('Ya tienes una solicitud pendiente para esta actividad');
        }
      }

      // 4. Crear solicitud de voluntario
      const request = await this.createVolunteerRequest({
        user_id: resolvedUser.supabase_id,
        activity_id: activityId,
        message: message || `Solicitud para participar en ${activity.title}`,
        status: 'pending'
      });

      // 5. Notificar a administradores
      await this.notifyAdminsNewRequest(request, resolvedUser, activity);

      console.log('✅ REGISTER: Registration successful:', request.id);
      return request;

    } catch (error) {
      console.error('❌ REGISTER: Error in registration:', error);
      throw error;
    }
  }

  // ============= APROBACIÓN/RECHAZO DE SOLICITUDES =============

  async approveRegistration(requestId, adminUserId, notes = '') {
    try {
      console.log('✅ APPROVE: Approving registration:', requestId);

      // 1. Actualizar estado de la solicitud
      const { data: updatedRequest, error: updateError } = await supabase
        .from('volunteer_requests')
        .update({
          status: 'approved',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', requestId)
        .select(`
          *,
          user:users!volunteer_requests_user_id_fkey(*),
          activity:activities!volunteer_requests_activity_id_fkey(*)
        `)
        .single();

      if (updateError) throw updateError;

      // 2. Agregar a participantes confirmados
      const { error: participantError } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: updatedRequest.activity_id,
          user_id: updatedRequest.user_id,
          joined_at: new Date().toISOString(),
          role: 'volunteer'
        });

      if (participantError && participantError.code !== '23505') { // Ignorar duplicados
        console.warn('⚠️ APPROVE: Error adding participant (ignored):', participantError);
      }

      // 3. Actualizar contador de voluntarios
      await this.updateVolunteerCount(updatedRequest.activity_id);

      // 4. Notificar al usuario aprobado
      await this.notifyUserRequestApproved(updatedRequest);

      console.log('✅ APPROVE: Registration approved successfully');
      return updatedRequest;

    } catch (error) {
      console.error('❌ APPROVE: Error approving registration:', error);
      throw error;
    }
  }

  async rejectRegistration(requestId, adminUserId, notes = '') {
    try {
      console.log('❌ REJECT: Rejecting registration:', requestId);

      const { data: updatedRequest, error } = await supabase
        .from('volunteer_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', requestId)
        .select(`
          *,
          user:users!volunteer_requests_user_id_fkey(*),
          activity:activities!volunteer_requests_activity_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Notificar al usuario rechazado
      await this.notifyUserRequestRejected(updatedRequest);

      console.log('✅ REJECT: Registration rejected successfully');
      return updatedRequest;

    } catch (error) {
      console.error('❌ REJECT: Error rejecting registration:', error);
      throw error;
    }
  }

  // ============= CONTEO EN TIEMPO REAL =============

  async updateVolunteerCount(activityId) {
    try {
      console.log('🔢 COUNT: Updating volunteer count for activity:', activityId);

      // Contar participantes confirmados
      const { count, error } = await supabase
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      if (error) {
        console.error('❌ COUNT: Error counting participants:', error);
        throw error;
      }

      const volunteerCount = count || 0;
      console.log(`📊 COUNT: Found ${volunteerCount} participants for activity ${activityId}`);

      // Actualizar el contador en la actividad
      const { data: updatedActivity, error: updateError } = await supabase
        .from('activities')
        .update({
          current_volunteers: volunteerCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ COUNT: Error updating activity:', updateError);
        throw updateError;
      }

      console.log(`✅ COUNT: Updated volunteer count to ${volunteerCount} for activity ${activityId}`);

      // Emitir evento para listeners
      this.emitVolunteerCountUpdate(activityId, volunteerCount);

      // También actualizar localStorage si es necesario
      try {
        await this.updateLocalActivityCount(activityId, volunteerCount);
      } catch (localError) {
        console.warn('⚠️ Could not update local activity count:', localError);
      }

      return volunteerCount;

    } catch (error) {
      console.error('❌ COUNT: Error updating volunteer count:', error);

      // Intentar recuperación con datos locales
      try {
        console.log('🔄 COUNT: Attempting local fallback...');
        const localCount = await this.getLocalVolunteerCount(activityId);
        console.log(`📊 COUNT: Local fallback count: ${localCount}`);
        return localCount;
      } catch (fallbackError) {
        console.error('❌ COUNT: Local fallback also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  async updateLocalActivityCount(activityId, count) {
    try {
      const storageManager = require('../storage-manager.js').default;
      const data = storageManager.loadData();

      if (data.activities) {
        const activityIndex = data.activities.findIndex(a => a.id === activityId);
        if (activityIndex !== -1) {
          data.activities[activityIndex].current_volunteers = count;
          data.activities[activityIndex].participants = data.activities[activityIndex].participants || [];
          storageManager.saveData(data);
          console.log('✅ Local activity count updated');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not update local activity count:', error);
    }
  }

  async getLocalVolunteerCount(activityId) {
    try {
      const storageManager = require('../storage-manager.js').default;
      const data = storageManager.loadData();

      const activity = data.activities?.find(a => a.id === activityId);
      return activity?.participants?.length || activity?.current_volunteers || 0;
    } catch (error) {
      console.warn('⚠️ Could not get local volunteer count:', error);
      return 0;
    }
  }

  // ============= SUSCRIPCIONES EN TIEMPO REAL =============

  subscribeToActivityRegistrations(activityId, callback) {
    console.log('👂 SUBSCRIBE: Setting up real-time subscription for activity:', activityId);

    // Cancelar suscripción anterior si existe
    this.unsubscribeFromActivityRegistrations(activityId);

    // Suscribirse a cambios en volunteer_requests
    const requestsChannel = supabase
      .channel(`activity-requests-${activityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'volunteer_requests',
        filter: `activity_id=eq.${activityId}`
      }, (payload) => {
        console.log('🔄 SUBSCRIBE: Volunteer request change:', payload.eventType);
        this.handleRegistrationChange(activityId, payload, callback);
      })
      .subscribe();

    // Suscribirse a cambios en activity_participants
    const participantsChannel = supabase
      .channel(`activity-participants-${activityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_participants',
        filter: `activity_id=eq.${activityId}`
      }, (payload) => {
        console.log('🔄 SUBSCRIBE: Participant change:', payload.eventType);
        this.updateVolunteerCount(activityId);
      })
      .subscribe();

    // Guardar referencias
    this.subscriptions.set(activityId, {
      requests: requestsChannel,
      participants: participantsChannel
    });

    this.listeners.set(activityId, callback);

    return () => this.unsubscribeFromActivityRegistrations(activityId);
  }

  unsubscribeFromActivityRegistrations(activityId) {
    const subscription = this.subscriptions.get(activityId);
    if (subscription) {
      subscription.requests.unsubscribe();
      subscription.participants.unsubscribe();
      this.subscriptions.delete(activityId);
    }
    this.listeners.delete(activityId);
    console.log('👋 UNSUBSCRIBE: Unsubscribed from activity:', activityId);
  }

  // ============= OBTENER DATOS =============

  async getActivityRegistrations(activityId) {
    try {
      console.log('📋 FETCH: Getting registrations for activity:', activityId);

      const [requests, participants, activity] = await Promise.all([
        // Solicitudes pendientes
        supabase
          .from('volunteer_requests')
          .select(`
            *,
            user:users!volunteer_requests_user_id_fkey(*)
          `)
          .eq('activity_id', activityId)
          .order('created_at', { ascending: false }),

        // Participantes confirmados
        supabase
          .from('activity_participants')
          .select(`
            *,
            user:users!activity_participants_user_id_fkey(*)
          `)
          .eq('activity_id', activityId)
          .order('joined_at', { ascending: false }),

        // Datos de la actividad
        supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single()
      ]);

      if (requests.error) throw requests.error;
      if (participants.error) throw participants.error;
      if (activity.error) throw activity.error;

      const result = {
        activity: activity.data,
        pendingRequests: requests.data || [],
        approvedRequests: requests.data?.filter(r => r.status === 'approved') || [],
        rejectedRequests: requests.data?.filter(r => r.status === 'rejected') || [],
        participants: participants.data || [],
        volunteerCount: participants.data?.length || 0
      };

      console.log('✅ FETCH: Retrieved activity registrations:', {
        pending: result.pendingRequests.length,
        approved: result.approvedRequests.length,
        participants: result.participants.length
      });

      return result;

    } catch (error) {
      console.error('❌ FETCH: Error getting activity registrations:', error);
      throw error;
    }
  }

  async getAllPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('volunteer_requests')
        .select(`
          *,
          user:users!volunteer_requests_user_id_fkey(*),
          activity:activities!volunteer_requests_activity_id_fkey(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Error getting all pending requests:', error);
      throw error;
    }
  }

  // ============= MÉTODOS AUXILIARES =============

  async resolveUserForRegistration(userInfo) {
    try {
      // Si ya es un objeto con supabase_id, usarlo directamente
      if (typeof userInfo === 'object' && userInfo.supabase_id) {
        return userInfo;
      }

      // Si es un ID numérico (Google ID), buscar en usuarios actuales
      if (typeof userInfo === 'string' || typeof userInfo === 'number') {
        const googleId = userInfo.toString();

        // Buscar en usuarios almacenados localmente con Google ID
        const storageManager = await import('../storage-manager.js');
        const data = storageManager.default.loadData();

        const localUser = data.users?.find(u =>
          u.id === googleId ||
          u.google_id === googleId ||
          u.sub === googleId
        );

        if (localUser && localUser.supabase_id) {
          console.log('✅ RESOLVE: Found user with supabase_id:', localUser.supabase_id);
          return localUser;
        }

        // Si no tiene supabase_id, crear/encontrar en Supabase
        if (localUser) {
          console.log('🔄 RESOLVE: Creating/finding user in Supabase...');

          try {
            // Buscar por email en Supabase
            let supabaseUser = await supabaseAPI.users.getUserByEmail(localUser.email);

            if (!supabaseUser) {
              // Crear nuevo usuario en Supabase
              supabaseUser = await supabaseAPI.users.createUser({
                email: localUser.email,
                first_name: localUser.first_name || localUser.given_name || 'Usuario',
                last_name: localUser.last_name || localUser.family_name || 'Nuevo',
                full_name: localUser.name || localUser.full_name,
                avatar_url: localUser.picture || localUser.avatar_url,
                role: localUser.role || 'visitor',
                bio: `Usuario Google sincronizado - ${new Date().toLocaleDateString()}`
              });
            }

            // Actualizar usuario local con supabase_id
            localUser.supabase_id = supabaseUser.id;

            // Actualizar en storage
            const updatedUsers = data.users.map(u =>
              u.id === googleId ? { ...u, supabase_id: supabaseUser.id } : u
            );
            storageManager.default.saveData({ ...data, users: updatedUsers });

            console.log('✅ RESOLVE: User synchronized with Supabase:', supabaseUser.id);
            return localUser;

          } catch (syncError) {
            console.error('❌ RESOLVE: Error synchronizing user:', syncError);
            throw new Error('No se pudo sincronizar el usuario con la base de datos');
          }
        }
      }

      throw new Error('Usuario no encontrado o no válido');

    } catch (error) {
      console.error('❌ RESOLVE: Error resolving user:', error);
      throw error;
    }
  }

  async getActivityFromSupabase(activityId) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('❌ Activity not found in Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting activity from Supabase:', error);
      return null;
    }
  }

  async checkExistingRegistration(activityId, userId) {
    try {
      const { data, error } = await supabase
        .from('volunteer_requests')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('❌ Error checking existing registration:', error);
      return null;
    }
  }

  async createVolunteerRequest(requestData) {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .insert(requestData)
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(*),
        activity:activities!volunteer_requests_activity_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async notifyAdminsNewRequest(request, user, activity) {
    try {
      const admins = await supabaseAPI.users.getAllUsers();
      const adminUsers = admins.filter(u => u.role === 'admin');

      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: 'volunteer_request',
        title: '🙋‍♀️ Nueva Solicitud de Voluntario',
        message: `${user.name || user.full_name || user.email} quiere unirse a "${activity.title}"`,
        data: JSON.stringify({
          volunteer_request_id: request.id,
          activity_id: activity.id,
          user_email: user.email,
          user_name: user.name || user.full_name
        })
      }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
        console.log('✅ Admin notifications sent:', notifications.length);
      }
    } catch (error) {
      console.warn('⚠️ Error sending admin notifications:', error);
    }
  }

  async notifyUserRequestApproved(request) {
    try {
      console.log('📬 NOTIFY: Sending approval notification to user:', request.user_id);

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'request_approved',
          title: '✅ Solicitud Aprobada',
          message: `Tu solicitud para "${request.activity.title}" ha sido aprobada. ¡Bienvenido al equipo!`,
          data: JSON.stringify({
            activity_id: request.activity_id,
            activity_title: request.activity.title,
            request_id: request.id
          }),
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ NOTIFY: Approval notification sent successfully');

      // También intentar notificar por otros medios si están disponibles
      try {
        // Actualizar localStorage si el usuario está activo
        this.updateLocalNotifications(request.user_id, {
          type: 'success',
          title: 'Solicitud Aprobada',
          message: `Tu solicitud para "${request.activity.title}" ha sido aprobada.`,
          timestamp: new Date().toISOString()
        });
      } catch (localError) {
        console.warn('⚠️ Could not update local notifications:', localError);
      }

    } catch (error) {
      console.error('❌ NOTIFY: Error sending approval notification:', error);
      throw error; // Re-throw para que el calling code sepa que falló
    }
  }

  async notifyUserRequestRejected(request) {
    try {
      console.log('📬 NOTIFY: Sending rejection notification to user:', request.user_id);

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'request_rejected',
          title: '❌ Solicitud Rechazada',
          message: `Tu solicitud para "${request.activity.title}" no fue aprobada esta vez.`,
          data: JSON.stringify({
            activity_id: request.activity_id,
            activity_title: request.activity.title,
            notes: request.review_notes,
            request_id: request.id
          }),
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ NOTIFY: Rejection notification sent successfully');

      // También intentar notificar por otros medios
      try {
        this.updateLocalNotifications(request.user_id, {
          type: 'warning',
          title: 'Solicitud Rechazada',
          message: `Tu solicitud para "${request.activity.title}" no fue aprobada.`,
          timestamp: new Date().toISOString()
        });
      } catch (localError) {
        console.warn('⚠️ Could not update local notifications:', localError);
      }

    } catch (error) {
      console.error('❌ NOTIFY: Error sending rejection notification:', error);
      throw error;
    }
  }

  updateLocalNotifications(userId, notification) {
    try {
      // Intentar actualizar notificaciones en localStorage para usuarios activos
      const storageManager = require('../storage-manager.js').default;
      const data = storageManager.loadData();

      if (!data.notifications) {
        data.notifications = [];
      }

      data.notifications.push({
        id: Date.now(),
        user_id: userId,
        ...notification
      });

      // Mantener solo las últimas 50 notificaciones
      if (data.notifications.length > 50) {
        data.notifications = data.notifications.slice(-50);
      }

      storageManager.saveData(data);
      console.log('✅ Local notifications updated');

    } catch (error) {
      console.warn('⚠️ Could not update local notifications:', error);
    }
  }

  handleRegistrationChange(activityId, payload, callback) {
    // Actualizar conteo cuando hay cambios
    this.updateVolunteerCount(activityId);

    // Llamar callback si está definido
    if (callback) {
      callback({
        type: 'registration_change',
        activityId,
        event: payload.eventType,
        data: payload.new || payload.old
      });
    }
  }

  emitVolunteerCountUpdate(activityId, count) {
    const callback = this.listeners.get(activityId);
    if (callback) {
      callback({
        type: 'volunteer_count_update',
        activityId,
        count
      });
    }
  }

  // ============= CLEANUP =============

  destroy() {
    // Limpiar todas las suscripciones
    for (const [activityId] of this.subscriptions) {
      this.unsubscribeFromActivityRegistrations(activityId);
    }
    this.subscriptions.clear();
    this.listeners.clear();
    console.log('🧹 ActivityRegistrationsService destroyed');
  }
}

// Crear instancia singleton
const activityRegistrationsService = new ActivityRegistrationsService();

export default activityRegistrationsService;
export { ActivityRegistrationsService };