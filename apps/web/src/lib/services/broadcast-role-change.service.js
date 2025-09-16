import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class BroadcastRoleChangeService {
  constructor() {
    this.channel = null;
    this.isListening = false;
    this.currentUser = null;
  }

  /**
   * Inicializar el servicio para escuchar broadcasts globales
   */
  async initialize(user) {
    try {
      console.log('🔄 BroadcastRoleChangeService: Inicializando para:', user?.email);

      this.currentUser = user;

      // Limpiar canal anterior si existe
      if (this.channel) {
        await this.cleanup();
      }

      // Crear canal global para todas las notificaciones de cambio de rol
      this.channel = supabase.channel('global-role-changes', {
        config: {
          broadcast: {
            self: false,
            ack: true
          }
        }
      });

      // Escuchar mensajes de broadcast
      this.channel
        .on('broadcast', { event: 'role-change-notification' }, (payload) => {
          this._handleRoleChangeNotification(payload);
        })
        .subscribe((status) => {
          console.log('🔌 BroadcastRoleChangeService: Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
            this.isListening = true;
            console.log('✅ BroadcastRoleChangeService: Escuchando cambios globales');
          }
        });

      console.log('✅ BroadcastRoleChangeService: Inicialización completa');

    } catch (error) {
      console.error('❌ BroadcastRoleChangeService: Error en inicialización:', error);
    }
  }

  /**
   * Manejar notificaciones de cambio de rol recibidas
   */
  _handleRoleChangeNotification(payload) {
    try {
      console.log('📢 BroadcastRoleChangeService: Broadcast recibido:', payload);

      const { targetUserEmail, oldRole, newRole, timestamp, adminEmail } = payload.payload;

      // Solo procesar si es para el usuario actual
      if (this.currentUser && this.currentUser.email === targetUserEmail) {
        console.log('🎯 BroadcastRoleChangeService: ¡Este mensaje es para mí!');

        // Disparar evento local para GlobalRoleChangeModal
        window.dispatchEvent(new CustomEvent('role-changed', {
          detail: {
            userEmail: targetUserEmail,
            oldRole: oldRole,
            newRole: newRole,
            timestamp: timestamp,
            source: 'broadcast',
            adminEmail: adminEmail
          }
        }));

        console.log('✅ BroadcastRoleChangeService: Evento local disparado');
      } else {
        console.log('👋 BroadcastRoleChangeService: Mensaje para otro usuario:', targetUserEmail);
      }

    } catch (error) {
      console.error('❌ BroadcastRoleChangeService: Error manejando notificación:', error);
    }
  }

  /**
   * Enviar notificación de cambio de rol a todos los usuarios conectados
   */
  async sendRoleChangeNotification(targetUserEmail, oldRole, newRole, adminEmail) {
    try {
      console.log('📡 BroadcastRoleChangeService: Enviando broadcast...');

      if (!this.channel) {
        console.warn('⚠️ BroadcastRoleChangeService: No hay canal activo');
        return false;
      }

      const message = {
        targetUserEmail: targetUserEmail,
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date().toISOString(),
        adminEmail: adminEmail || 'Administrador'
      };

      const result = await this.channel.send({
        type: 'broadcast',
        event: 'role-change-notification',
        payload: message
      });

      console.log('📡 BroadcastRoleChangeService: Resultado del broadcast:', result);
      console.log('✅ BroadcastRoleChangeService: Mensaje enviado a todos los usuarios conectados');

      return true;

    } catch (error) {
      console.error('❌ BroadcastRoleChangeService: Error enviando broadcast:', error);
      return false;
    }
  }

  /**
   * Verificar estado del servicio
   */
  getStatus() {
    return {
      isListening: this.isListening,
      hasChannel: !!this.channel,
      currentUser: this.currentUser?.email
    };
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    try {
      console.log('🧹 BroadcastRoleChangeService: Limpiando recursos...');

      if (this.channel) {
        await this.channel.unsubscribe();
        this.channel = null;
      }

      this.isListening = false;
      this.currentUser = null;

      console.log('✅ BroadcastRoleChangeService: Limpieza completada');

    } catch (error) {
      console.error('❌ BroadcastRoleChangeService: Error en limpieza:', error);
    }
  }
}

// Crear instancia singleton
const broadcastRoleChangeService = new BroadcastRoleChangeService();

export default broadcastRoleChangeService;
export { BroadcastRoleChangeService };