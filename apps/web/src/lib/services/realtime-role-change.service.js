import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class RealtimeRoleChangeService {
  constructor() {
    this.channel = null;
    this.isListening = false;
    this.currentUser = null;
    this.listeners = new Set();
  }

  /**
   * Inicializar el servicio de tiempo real para un usuario específico
   */
  async initialize(user) {
    try {
      console.log('🔄 RealtimeRoleChangeService: Inicializando para usuario:', user?.email);

      if (!user || !user.email) {
        console.warn('⚠️ RealtimeRoleChangeService: No se puede inicializar sin usuario válido');
        return;
      }

      this.currentUser = user;

      // Limpiar canal anterior si existe
      if (this.channel) {
        await this.cleanup();
      }

      // Crear canal específico para cambios de usuario
      this.channel = supabase.channel(`user-role-changes-${user.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      });

      // Escuchar cambios en la tabla users para el usuario actual
      this.channel
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          (payload) => this._handleUserRoleChange(payload)
        )
        .subscribe((status) => {
          console.log('🔌 RealtimeRoleChangeService: Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
            this.isListening = true;
            console.log('✅ RealtimeRoleChangeService: Escuchando cambios de rol en tiempo real');
          }
        });

      // También crear un canal de broadcast para comunicación instantánea entre administradores
      this.broadcastChannel = supabase.channel('admin-role-broadcast');

      this.broadcastChannel
        .on('broadcast', { event: 'role-change-immediate' }, (payload) => {
          console.log('📢 RealtimeRoleChangeService: Mensaje broadcast recibido:', payload);

          // Solo procesar si es para el usuario actual
          if (payload.payload?.targetUserEmail === user.email) {
            console.log('🎯 RealtimeRoleChangeService: Mensaje es para usuario actual, procesando...');
            this._triggerRoleChangeModal(payload.payload);
          }
        })
        .subscribe();

      console.log('✅ RealtimeRoleChangeService: Inicialización completa');

    } catch (error) {
      console.error('❌ RealtimeRoleChangeService: Error en inicialización:', error);
    }
  }

  /**
   * Manejar cambios de rol detectados por Supabase Realtime
   */
  _handleUserRoleChange(payload) {
    try {
      console.log('🔄 RealtimeRoleChangeService: Cambio detectado en base de datos:', payload);

      const { old_record, new_record } = payload;

      if (!old_record || !new_record) {
        console.warn('⚠️ RealtimeRoleChangeService: Datos incompletos en el cambio');
        return;
      }

      const oldRole = old_record.role;
      const newRole = new_record.role;

      // Solo procesar si realmente cambió el rol
      if (oldRole !== newRole) {
        console.log(`🔄 RealtimeRoleChangeService: Rol cambiado: ${oldRole} → ${newRole}`);

        const changeData = {
          userEmail: new_record.email,
          userId: new_record.id,
          oldRole: oldRole,
          newRole: newRole,
          timestamp: new Date().toISOString(),
          source: 'database_realtime'
        };

        // Disparar modal inmediatamente
        this._triggerRoleChangeModal(changeData);
      }

    } catch (error) {
      console.error('❌ RealtimeRoleChangeService: Error manejando cambio de rol:', error);
    }
  }

  /**
   * Disparar modal de cambio de rol
   */
  _triggerRoleChangeModal(changeData) {
    try {
      console.log('🎯 RealtimeRoleChangeService: Disparando modal de cambio de rol:', changeData);

      // Disparar evento global para GlobalRoleChangeModal
      const roleChangeEvent = new CustomEvent('role-changed', {
        detail: {
          userEmail: changeData.userEmail,
          oldRole: changeData.oldRole,
          newRole: changeData.newRole,
          timestamp: changeData.timestamp,
          source: changeData.source || 'realtime'
        }
      });

      window.dispatchEvent(roleChangeEvent);
      console.log('✅ RealtimeRoleChangeService: Evento role-changed disparado');

      // Notificar a todos los listeners registrados
      this.listeners.forEach(listener => {
        try {
          listener(changeData);
        } catch (error) {
          console.warn('⚠️ Error en listener:', error);
        }
      });

    } catch (error) {
      console.error('❌ RealtimeRoleChangeService: Error disparando modal:', error);
    }
  }

  /**
   * Enviar notificación inmediata a través de broadcast (para administradores)
   */
  async sendImmediateRoleChangeNotification(targetUserEmail, targetUserId, oldRole, newRole) {
    try {
      console.log('📢 RealtimeRoleChangeService: Enviando notificación inmediata vía broadcast');

      if (!this.broadcastChannel) {
        console.warn('⚠️ Canal de broadcast no disponible');
        return false;
      }

      const message = {
        targetUserEmail: targetUserEmail,
        targetUserId: targetUserId,
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date().toISOString(),
        adminId: this.currentUser?.id,
        adminEmail: this.currentUser?.email
      };

      await this.broadcastChannel.send({
        type: 'broadcast',
        event: 'role-change-immediate',
        payload: message
      });

      console.log('✅ RealtimeRoleChangeService: Notificación broadcast enviada');
      return true;

    } catch (error) {
      console.error('❌ RealtimeRoleChangeService: Error enviando broadcast:', error);
      return false;
    }
  }

  /**
   * Registrar listener para cambios de rol
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      console.log('📝 RealtimeRoleChangeService: Listener agregado');
    }
  }

  /**
   * Remover listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
    console.log('🗑️ RealtimeRoleChangeService: Listener removido');
  }

  /**
   * Verificar si está escuchando activamente
   */
  isActive() {
    return this.isListening && this.channel && this.currentUser;
  }

  /**
   * Obtener información del estado actual
   */
  getStatus() {
    return {
      isListening: this.isListening,
      hasChannel: !!this.channel,
      currentUser: this.currentUser?.email,
      listenersCount: this.listeners.size
    };
  }

  /**
   * Limpiar recursos y desconectar
   */
  async cleanup() {
    try {
      console.log('🧹 RealtimeRoleChangeService: Limpiando recursos...');

      if (this.channel) {
        await this.channel.unsubscribe();
        this.channel = null;
      }

      if (this.broadcastChannel) {
        await this.broadcastChannel.unsubscribe();
        this.broadcastChannel = null;
      }

      this.isListening = false;
      this.currentUser = null;
      this.listeners.clear();

      console.log('✅ RealtimeRoleChangeService: Limpieza completada');

    } catch (error) {
      console.error('❌ RealtimeRoleChangeService: Error en limpieza:', error);
    }
  }

  /**
   * Reinicializar el servicio
   */
  async restart(user) {
    await this.cleanup();
    await this.initialize(user);
  }
}

// Crear instancia singleton
const realtimeRoleChangeService = new RealtimeRoleChangeService();

export default realtimeRoleChangeService;
export { RealtimeRoleChangeService };