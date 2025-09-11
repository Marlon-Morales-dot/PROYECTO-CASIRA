// ============= CASIRA Notifications Service - SUPABASE ONLY =============
import { supabase } from '../supabase-client.js';

class NotificationsService {
  
  // ============= NOTIFICATION CRUD OPERATIONS =============
  
  async getAllNotifications(userId = null) {
    try {
      console.log('📬 NotificationsService: Getting notifications from Supabase for user:', userId);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Si se especifica usuario, filtrar por él o notificaciones globales
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ NotificationsService: Error getting notifications:', error);
        throw error;
      }
      
      const notifications = data || [];
      console.log('📬 NotificationsService: Retrieved notifications:', notifications.length);
      return notifications;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      console.log('🔔 NotificationsService: Getting notification by ID:', id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 NotificationsService: Notification not found:', id);
          return null;
        }
        throw error;
      }
      
      console.log('🔔 NotificationsService: Retrieved notification:', data?.title || 'Unknown');
      return data;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notification by ID:', error);
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      console.log('✨ NotificationsService: Creating notification:', notificationData.title);
      
      const newNotification = {
        ...notificationData,
        created_at: new Date().toISOString(),
        read: false,
        type: notificationData.type || 'info'
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();
      
      if (error) {
        console.error('❌ NotificationsService: Error creating notification:', error);
        throw error;
      }
      
      console.log('✅ NotificationsService: Notification created:', data.id);
      return data;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error creating notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      console.log('👁️ NotificationsService: Marking notification as read:', notificationId);
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ NotificationsService: Error marking as read:', error);
        throw error;
      }
      
      console.log('👁️ NotificationsService: Notification marked as read:', data?.title);
      return data;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      console.log('👁️‍🗨️ NotificationsService: Marking all notifications as read for user:', userId);
      
      const readAt = new Date().toISOString();
      let query = supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: readAt
        })
        .eq('read', false);
      
      // Filtrar por usuario o notificaciones globales
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error('❌ NotificationsService: Error marking all as read:', error);
        throw error;
      }
      
      const count = data?.length || 0;
      console.log('👁️‍🗨️ NotificationsService: Marked', count, 'notifications as read');
      return count;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      console.log('🗑️ NotificationsService: Deleting notification:', notificationId);
      
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ NotificationsService: Error deleting notification:', error);
        throw error;
      }
      
      console.log('🗑️ NotificationsService: Notification deleted:', data?.title);
      return data;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error deleting notification:', error);
      throw error;
    }
  }

  // ============= NOTIFICATION TYPES =============

  async createActivityNotification(activityData, type = 'new_activity') {
    const notificationData = {
      title: this.getActivityNotificationTitle(type, activityData),
      message: this.getActivityNotificationMessage(type, activityData),
      type: 'activity',
      data: JSON.stringify({
        activity_id: activityData.id,
        action_url: `/activities/${activityData.id}`
      })
    };
    
    return await this.createNotification(notificationData);
  }

  async createUserNotification(userData, type = 'welcome') {
    const notificationData = {
      title: this.getUserNotificationTitle(type, userData),
      message: this.getUserNotificationMessage(type, userData),
      type: 'user',
      user_id: userData.id,
      data: JSON.stringify({
        action_url: '/profile'
      })
    };
    
    return await this.createNotification(notificationData);
  }

  async createSystemNotification(title, message, userId = null) {
    const notificationData = {
      title,
      message,
      type: 'system',
      user_id: userId,
      data: JSON.stringify({
        action_url: '/dashboard'
      })
    };
    
    return await this.createNotification(notificationData);
  }

  // ============= FILTERING AND QUERIES =============

  async getUnreadNotifications(userId) {
    try {
      console.log('🔕 NotificationsService: Getting unread notifications for user:', userId);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ NotificationsService: Error getting unread notifications:', error);
        throw error;
      }
      
      const unread = data || [];
      console.log('🔕 NotificationsService: Retrieved unread notifications:', unread.length);
      return unread;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error getting unread notifications:', error);
      throw error;
    }
  }

  async getNotificationsByType(type, userId = null) {
    try {
      console.log(`🏷️ NotificationsService: Getting ${type} notifications for user:`, userId);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ NotificationsService: Error getting notifications by type:', error);
        throw error;
      }
      
      const filtered = data || [];
      console.log(`🏷️ NotificationsService: Retrieved ${type} notifications:`, filtered.length);
      return filtered;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notifications by type:', error);
      throw error;
    }
  }

  // ============= STATISTICS =============

  async getNotificationStats(userId = null) {
    try {
      console.log('📊 NotificationsService: Getting notification stats for user:', userId);
      
      const notifications = await this.getAllNotifications(userId);
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        read: notifications.filter(n => n.read).length,
        byType: {
          activity: notifications.filter(n => n.type === 'activity').length,
          user: notifications.filter(n => n.type === 'user').length,
          system: notifications.filter(n => n.type === 'system').length,
          volunteer_request: notifications.filter(n => n.type === 'volunteer_request').length,
          welcome: notifications.filter(n => n.type === 'welcome').length,
          info: notifications.filter(n => n.type === 'info').length
        },
        recent: notifications.filter(n => {
          const notificationDate = new Date(n.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return notificationDate > dayAgo;
        }).length
      };

      console.log('📊 NotificationsService: Notification stats:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notification stats:', error);
      throw error;
    }
  }

  // ============= VOLUNTEER REQUEST MANAGEMENT =============
  
  async approveVolunteerRequest(requestId) {
    try {
      console.log('✅ NotificationsService: Approving volunteer request:', requestId);
      
      // 1. Obtener la solicitud
      const { data: request, error: requestError } = await supabase
        .from('volunteer_requests')
        .select(`
          *,
          user:users!volunteer_requests_user_id_fkey(*),
          activity:activities!volunteer_requests_activity_id_fkey(*)
        `)
        .eq('id', requestId)
        .single();
        
      if (requestError || !request) {
        throw new Error('Solicitud no encontrada');
      }
      
      // 2. Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('volunteer_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (updateError) {
        throw updateError;
      }
      
      // 3. Agregar a participantes
      await supabase
        .from('activity_participants')
        .insert({
          activity_id: request.activity_id,
          user_id: request.user_id,
          role: 'volunteer',
          status: 'confirmed'
        });
      
      // 4. Crear notificación de aprobación
      await this.createNotification({
        user_id: request.user_id,
        type: 'volunteer_approved',
        title: '🎉 ¡Solicitud Aprobada!',
        message: `Tu solicitud para participar en "${request.activity?.title}" ha sido aprobada. ¡Bienvenido al equipo!`,
        data: JSON.stringify({
          activity_id: request.activity_id,
          volunteer_request_id: requestId
        })
      });
      
      console.log('✅ NotificationsService: Volunteer request approved successfully');
      return request;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error approving volunteer request:', error);
      throw error;
    }
  }

  async rejectVolunteerRequest(requestId, reason = '') {
    try {
      console.log('❌ NotificationsService: Rejecting volunteer request:', requestId);
      
      // 1. Obtener la solicitud
      const { data: request, error: requestError } = await supabase
        .from('volunteer_requests')
        .select(`
          *,
          user:users!volunteer_requests_user_id_fkey(*),
          activity:activities!volunteer_requests_activity_id_fkey(*)
        `)
        .eq('id', requestId)
        .single();
        
      if (requestError || !request) {
        throw new Error('Solicitud no encontrada');
      }
      
      // 2. Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('volunteer_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (updateError) {
        throw updateError;
      }
      
      // 3. Crear notificación de rechazo
      const rejectionMessage = reason ? 
        `Tu solicitud para "${request.activity?.title}" no fue aprobada. Razón: ${reason}` :
        `Tu solicitud para "${request.activity?.title}" no fue aprobada en esta ocasión.`;
      
      await this.createNotification({
        user_id: request.user_id,
        type: 'volunteer_rejected',
        title: '📋 Solicitud No Aprobada',
        message: rejectionMessage,
        data: JSON.stringify({
          activity_id: request.activity_id,
          volunteer_request_id: requestId,
          reason: reason
        })
      });
      
      console.log('❌ NotificationsService: Volunteer request rejected successfully');
      return request;
      
    } catch (error) {
      console.error('❌ NotificationsService: Error rejecting volunteer request:', error);
      throw error;
    }
  }

  // ============= UTILITY METHODS =============

  getActivityNotificationTitle(type, activityData) {
    const titles = {
      new_activity: '🆕 Nueva actividad disponible',
      activity_updated: '📝 Actividad actualizada',
      activity_reminder: '⏰ Recordatorio de actividad',
      activity_cancelled: '❌ Actividad cancelada'
    };
    return titles[type] || '📢 Notificación de actividad';
  }

  getActivityNotificationMessage(type, activityData) {
    const messages = {
      new_activity: `Se ha creado una nueva actividad: "${activityData.title}". ¡Únete ahora!`,
      activity_updated: `La actividad "${activityData.title}" ha sido actualizada.`,
      activity_reminder: `Recordatorio: La actividad "${activityData.title}" es mañana.`,
      activity_cancelled: `La actividad "${activityData.title}" ha sido cancelada.`
    };
    return messages[type] || `Actualización sobre: ${activityData.title}`;
  }

  getUserNotificationTitle(type, userData) {
    const titles = {
      welcome: '🎉 ¡Bienvenido a CASIRA!',
      role_updated: '🎭 Rol actualizado',
      profile_updated: '👤 Perfil actualizado'
    };
    return titles[type] || '👋 Notificación de usuario';
  }

  getUserNotificationMessage(type, userData) {
    const messages = {
      welcome: `¡Bienvenido ${userData.first_name}! Gracias por unirte a nuestra comunidad.`,
      role_updated: `Tu rol ha sido actualizado a: ${userData.role}`,
      profile_updated: 'Tu perfil ha sido actualizado correctamente.'
    };
    return messages[type] || `Actualización para ${userData.first_name}`;
  }
}

// Create singleton instance
const notificationsService = new NotificationsService();

export default notificationsService;
export { NotificationsService };