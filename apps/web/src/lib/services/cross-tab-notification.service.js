/**
 * Servicio de notificaciones entre pestañas usando localStorage y storage events
 * Alternativa inmediata cuando Supabase broadcast falla
 */

class CrossTabNotificationService {
  constructor() {
    this.currentUser = null;
    this.isListening = false;
    this.storageKey = 'casira-cross-tab-notifications';
  }

  /**
   * Inicializar el servicio
   */
  initialize(user) {
    try {
      console.log('🔄 CrossTabNotificationService: Inicializando para:', user?.email);

      this.currentUser = user;

      // Limpiar listener anterior
      if (this.isListening) {
        window.removeEventListener('storage', this._handleStorageChange);
      }

      // Escuchar cambios en localStorage desde otras pestañas
      window.addEventListener('storage', this._handleStorageChange.bind(this));
      this.isListening = true;

      console.log('✅ CrossTabNotificationService: Escuchando cambios entre pestañas');

    } catch (error) {
      console.error('❌ CrossTabNotificationService: Error en inicialización:', error);
    }
  }

  /**
   * Manejar cambios en localStorage desde otras pestañas
   */
  _handleStorageChange(event) {
    try {
      if (event.key !== this.storageKey || !event.newValue) return;

      const notifications = JSON.parse(event.newValue);
      const newNotifications = notifications.filter(n =>
        !n.processed &&
        n.targetUserEmail === this.currentUser?.email &&
        (Date.now() - n.timestamp) < 30000 // Solo últimos 30 segundos
      );

      if (newNotifications.length > 0) {
        console.log('📬 CrossTabNotificationService: Notificaciones recibidas desde otra pestaña:', newNotifications);

        newNotifications.forEach(notification => {
          // Marcar como procesada
          notification.processed = true;

          // Disparar evento local
          console.log('🎯 CrossTabNotificationService: Disparando evento para:', notification.targetUserEmail);
          window.dispatchEvent(new CustomEvent('role-changed', {
            detail: {
              userEmail: notification.targetUserEmail,
              oldRole: notification.oldRole,
              newRole: notification.newRole,
              timestamp: new Date(notification.timestamp).toISOString(),
              source: 'cross_tab_notification',
              adminEmail: notification.adminEmail
            }
          }));
        });

        // Actualizar localStorage con notificaciones marcadas como procesadas
        this._updateNotifications(notifications);
      }

    } catch (error) {
      console.warn('⚠️ CrossTabNotificationService: Error manejando storage event:', error);
    }
  }

  /**
   * Enviar notificación a todas las pestañas abiertas
   */
  sendRoleChangeNotification(targetUserEmail, oldRole, newRole, adminEmail) {
    try {
      console.log('📢 CrossTabNotificationService: Enviando notificación entre pestañas para:', targetUserEmail);

      const notifications = this._getNotifications();

      const newNotification = {
        id: `cross-tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetUserEmail: targetUserEmail,
        oldRole: oldRole,
        newRole: newRole,
        adminEmail: adminEmail || 'Administrador',
        timestamp: Date.now(),
        processed: false,
        source: 'cross_tab'
      };

      notifications.push(newNotification);

      // Limpiar notificaciones viejas (más de 5 minutos)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const cleanNotifications = notifications.filter(n => n.timestamp > fiveMinutesAgo);

      this._updateNotifications(cleanNotifications);

      console.log('✅ CrossTabNotificationService: Notificación enviada a todas las pestañas');
      return true;

    } catch (error) {
      console.error('❌ CrossTabNotificationService: Error enviando notificación:', error);
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
      console.warn('⚠️ Error obteniendo notificaciones cross-tab:', error);
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
      console.warn('⚠️ Error guardando notificaciones cross-tab:', error);
    }
  }

  /**
   * Verificar estado del servicio
   */
  getStatus() {
    return {
      isListening: this.isListening,
      hasUser: !!this.currentUser,
      currentUser: this.currentUser?.email
    };
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    try {
      console.log('🧹 CrossTabNotificationService: Limpiando recursos...');

      if (this.isListening) {
        window.removeEventListener('storage', this._handleStorageChange);
        this.isListening = false;
      }

      this.currentUser = null;

      console.log('✅ CrossTabNotificationService: Limpieza completada');

    } catch (error) {
      console.error('❌ CrossTabNotificationService: Error en limpieza:', error);
    }
  }
}

// Crear instancia singleton
const crossTabNotificationService = new CrossTabNotificationService();

export default crossTabNotificationService;
export { CrossTabNotificationService };