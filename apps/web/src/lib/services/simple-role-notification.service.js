/**
 * Sistema simple de notificaciones de cambio de rol usando localStorage
 * Como backup si Supabase Realtime falla
 */

class SimpleRoleNotificationService {
  constructor() {
    this.currentUser = null;
    this.pollInterval = null;
    this.isListening = false;
    this.storageKey = 'casira-role-change-notifications';
  }

  /**
   * Inicializar el servicio para un usuario
   */
  initialize(user) {
    try {
      console.log('🔄 SimpleRoleNotificationService: Inicializando para:', user?.email);

      this.currentUser = user;

      // Limpiar listener anterior
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }

      // Iniciar polling cada 2 segundos
      this.pollInterval = setInterval(() => {
        this._checkForNotifications();
      }, 2000);

      this.isListening = true;
      console.log('✅ SimpleRoleNotificationService: Polling iniciado cada 2 segundos');

    } catch (error) {
      console.error('❌ SimpleRoleNotificationService: Error en inicialización:', error);
    }
  }

  /**
   * Verificar si hay notificaciones pendientes para el usuario actual
   */
  _checkForNotifications() {
    try {
      if (!this.currentUser) return;

      const notifications = this._getNotifications();
      const userNotifications = notifications.filter(n =>
        n.targetUserEmail === this.currentUser.email &&
        !n.processed &&
        (Date.now() - n.timestamp) < 300000 // Solo notificaciones de los últimos 5 minutos
      );

      if (userNotifications.length > 0) {
        console.log('🔔 SimpleRoleNotificationService: Notificaciones encontradas:', userNotifications);

        userNotifications.forEach(notification => {
          // Marcar como procesada
          notification.processed = true;
          this._updateNotifications(notifications);

          // Disparar evento para GlobalRoleChangeModal
          console.log('🎯 SimpleRoleNotificationService: Disparando evento para:', notification.targetUserEmail);

          window.dispatchEvent(new CustomEvent('role-changed', {
            detail: {
              userEmail: notification.targetUserEmail,
              oldRole: notification.oldRole,
              newRole: notification.newRole,
              timestamp: new Date(notification.timestamp).toISOString(),
              source: 'simple_notification_service',
              adminEmail: notification.adminEmail
            }
          }));
        });
      }

    } catch (error) {
      console.warn('⚠️ SimpleRoleNotificationService: Error verificando notificaciones:', error);
    }
  }

  /**
   * Crear una notificación de cambio de rol
   */
  createRoleChangeNotification(targetUserEmail, oldRole, newRole, adminEmail) {
    try {
      console.log('📝 SimpleRoleNotificationService: Creando notificación para:', targetUserEmail);

      const notifications = this._getNotifications();

      const newNotification = {
        id: Date.now() + Math.random(),
        targetUserEmail: targetUserEmail,
        oldRole: oldRole,
        newRole: newRole,
        adminEmail: adminEmail || 'Administrador',
        timestamp: Date.now(),
        processed: false
      };

      notifications.push(newNotification);

      // Limpiar notificaciones viejas (más de 1 hora)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const cleanNotifications = notifications.filter(n => n.timestamp > oneHourAgo);

      this._updateNotifications(cleanNotifications);

      console.log('✅ SimpleRoleNotificationService: Notificación creada y guardada');
      return true;

    } catch (error) {
      console.error('❌ SimpleRoleNotificationService: Error creando notificación:', error);
      return false;
    }
  }

  /**
   * Obtener notificaciones del localStorage
   */
  _getNotifications() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('⚠️ Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Actualizar notificaciones en localStorage
   */
  _updateNotifications(notifications) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.warn('⚠️ Error guardando notificaciones:', error);
    }
  }

  /**
   * Verificar estado del servicio
   */
  getStatus() {
    return {
      isListening: this.isListening,
      hasUser: !!this.currentUser,
      currentUser: this.currentUser?.email,
      pollInterval: !!this.pollInterval
    };
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    try {
      console.log('🧹 SimpleRoleNotificationService: Limpiando recursos...');

      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      this.isListening = false;
      this.currentUser = null;

      console.log('✅ SimpleRoleNotificationService: Limpieza completada');

    } catch (error) {
      console.error('❌ SimpleRoleNotificationService: Error en limpieza:', error);
    }
  }
}

// Crear instancia singleton
const simpleRoleNotificationService = new SimpleRoleNotificationService();

export default simpleRoleNotificationService;
export { SimpleRoleNotificationService };