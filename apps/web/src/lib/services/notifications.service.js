// ============= CASIRA Notifications Service =============
import apiClient from '../axios-config.js';

class NotificationsService {
  
  // ============= NOTIFICATION CRUD OPERATIONS =============
  
  async getAllNotifications(userId = null) {
    try {
      const notifications = this.getStoredNotifications();
      const filtered = userId 
        ? notifications.filter(n => n.user_id == userId || n.user_id === 'all')
        : notifications;
      
      console.log('📬 NotificationsService: Retrieved notifications:', filtered.length);
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id == id);
      console.log('🔔 NotificationsService: Retrieved notification by ID:', notification?.title || 'Not found');
      return notification || null;
    } catch (error) {
      console.error('❌ NotificationsService: Error getting notification by ID:', error);
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      const notifications = this.getStoredNotifications();
      
      const newNotification = {
        id: Date.now(),
        ...notificationData,
        created_at: new Date().toISOString(),
        read: false,
        type: notificationData.type || 'info'
      };

      notifications.push(newNotification);
      this.saveNotifications(notifications);
      
      console.log('✅ NotificationsService: Notification created:', newNotification.title);
      return newNotification;
    } catch (error) {
      console.error('❌ NotificationsService: Error creating notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const notifications = this.getStoredNotifications();
      const notificationIndex = notifications.findIndex(n => n.id == notificationId);
      
      if (notificationIndex === -1) {
        throw new Error('Notificación no encontrada');
      }

      notifications[notificationIndex].read = true;
      notifications[notificationIndex].read_at = new Date().toISOString();

      this.saveNotifications(notifications);
      console.log('👁️ NotificationsService: Notification marked as read:', notifications[notificationIndex].title);
      return notifications[notificationIndex];
    } catch (error) {
      console.error('❌ NotificationsService: Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const notifications = this.getStoredNotifications();
      const userNotifications = notifications.filter(n => 
        n.user_id == userId || n.user_id === 'all'
      );
      
      userNotifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.read_at = new Date().toISOString();
        }
      });

      this.saveNotifications(notifications);
      console.log('👁️‍🗨️ NotificationsService: All notifications marked as read for user:', userId);
      return userNotifications.length;
    } catch (error) {
      console.error('❌ NotificationsService: Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const notifications = this.getStoredNotifications();
      const notificationIndex = notifications.findIndex(n => n.id == notificationId);
      
      if (notificationIndex === -1) {
        throw new Error('Notificación no encontrada');
      }

      const deletedNotification = notifications[notificationIndex];
      notifications.splice(notificationIndex, 1);
      
      this.saveNotifications(notifications);
      console.log('🗑️ NotificationsService: Notification deleted:', deletedNotification.title);
      return deletedNotification;
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
      activity_id: activityData.id,
      user_id: 'all', // Broadcast to all users
      action_url: `/activities/${activityData.id}`
    };
    
    return await this.createNotification(notificationData);
  }

  async createUserNotification(userData, type = 'welcome') {
    const notificationData = {
      title: this.getUserNotificationTitle(type, userData),
      message: this.getUserNotificationMessage(type, userData),
      type: 'user',
      user_id: userData.id,
      action_url: '/profile'
    };
    
    return await this.createNotification(notificationData);
  }

  async createSystemNotification(title, message, userId = 'all') {
    const notificationData = {
      title,
      message,
      type: 'system',
      user_id: userId,
      action_url: '/dashboard'
    };
    
    return await this.createNotification(notificationData);
  }

  // ============= FILTERING AND QUERIES =============

  async getUnreadNotifications(userId) {
    try {
      const notifications = await this.getAllNotifications(userId);
      const unread = notifications.filter(n => !n.read);
      console.log('🔕 NotificationsService: Retrieved unread notifications:', unread.length);
      return unread;
    } catch (error) {
      console.error('❌ NotificationsService: Error getting unread notifications:', error);
      throw error;
    }
  }

  async getNotificationsByType(type, userId = null) {
    try {
      const notifications = await this.getAllNotifications(userId);
      const filtered = notifications.filter(n => n.type === type);
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
      const notifications = await this.getAllNotifications(userId);
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        read: notifications.filter(n => n.read).length,
        byType: {
          activity: notifications.filter(n => n.type === 'activity').length,
          user: notifications.filter(n => n.type === 'user').length,
          system: notifications.filter(n => n.type === 'system').length,
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

  // ============= STORAGE HELPERS =============

  getStoredNotifications() {
    try {
      const casiraData = localStorage.getItem('casira-data');
      if (casiraData) {
        const data = JSON.parse(casiraData);
        return data.notifications || this.getDefaultNotifications();
      }
      return this.getDefaultNotifications();
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return this.getDefaultNotifications();
    }
  }

  saveNotifications(notifications) {
    try {
      let casiraData = {};
      const existingData = localStorage.getItem('casira-data');
      if (existingData) {
        casiraData = JSON.parse(existingData);
      }
      casiraData.notifications = notifications;
      localStorage.setItem('casira-data', JSON.stringify(casiraData));
      console.log('💾 NotificationsService: Notifications saved to storage');
    } catch (error) {
      console.error('❌ NotificationsService: Error saving notifications:', error);
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

  getDefaultNotifications() {
    return [
      {
        id: 1,
        title: "🎉 ¡Bienvenido a CASIRA Connect!",
        message: "Gracias por unirte a nuestra plataforma. Explora las actividades disponibles.",
        type: "system",
        user_id: "all",
        read: false,
        created_at: "2024-01-01T10:00:00Z",
        action_url: "/activities"
      },
      {
        id: 2,
        title: "🆕 Nueva actividad: Taller de Programación",
        message: "Se ha creado una nueva actividad de programación básica. ¡Inscríbete ahora!",
        type: "activity",
        activity_id: 1,
        user_id: "all",
        read: false,
        created_at: "2024-01-05T14:30:00Z",
        action_url: "/activities/1"
      },
      {
        id: 3,
        title: "📢 Campaña de donación activa",
        message: "Únete a nuestra campaña de recolección de útiles escolares.",
        type: "activity", 
        activity_id: 2,
        user_id: "all",
        read: false,
        created_at: "2024-01-10T09:00:00Z",
        action_url: "/activities/2"
      }
    ];
  }
}

// Create singleton instance
const notificationsService = new NotificationsService();

export default notificationsService;
export { NotificationsService };