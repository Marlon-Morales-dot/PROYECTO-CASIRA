// ============= CASIRA Connect - Servicio de Cambios de Rol Pendientes =============
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class PendingRoleChangeService {
  constructor() {
    console.log('🔄 PendingRoleChangeService: Inicializado');
  }

  // ============= CREAR CAMBIO PENDIENTE =============

  async createPendingRoleChange(targetUserId, adminUserId, oldRole, newRole, message = null) {
    try {
      console.log(`🔄 PendingRoleChangeService: Creando cambio pendiente ${oldRole} → ${newRole} para usuario ${targetUserId}`);

      // Primero verificar si ya existe un cambio pendiente
      const { data: existingChanges, error: checkError } = await supabase
        .from('pending_role_changes')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('status', 'pending');

      if (checkError) {
        console.warn('⚠️ Error verificando cambios existentes:', checkError);
      }

      // Si hay cambios pendientes, cancelarlos primero
      if (existingChanges && existingChanges.length > 0) {
        console.log('🔄 Cancelando cambios pendientes existentes...');
        await supabase
          .from('pending_role_changes')
          .update({ status: 'expired' })
          .eq('user_id', targetUserId)
          .eq('status', 'pending');
      }

      // Crear el nuevo cambio pendiente
      const { data, error } = await supabase
        .from('pending_role_changes')
        .insert({
          user_id: targetUserId,
          admin_id: adminUserId,
          old_role: oldRole,
          new_role: newRole,
          message: message,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
        })
        .select(`
          *,
          admin:users!pending_role_changes_admin_id_fkey(
            id,
            email,
            first_name,
            last_name,
            full_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creando cambio pendiente:', error);
        throw error;
      }

      console.log('✅ Cambio pendiente creado:', data);

      // Crear notificación para el usuario objetivo
      await this._createPendingChangeNotification(data);

      // Disparar evento para UI en tiempo real
      this._dispatchPendingChangeEvent(data);

      return data;
    } catch (error) {
      console.error('❌ PendingRoleChangeService: Error en createPendingRoleChange:', error);
      throw error;
    }
  }

  // ============= OBTENER CAMBIOS PENDIENTES =============

  async getPendingRoleChanges(userId) {
    try {
      console.log(`🔍 PendingRoleChangeService: Obteniendo cambios pendientes para usuario ${userId}`);

      const { data, error } = await supabase
        .from('pending_role_changes')
        .select(`
          *,
          admin:users!pending_role_changes_admin_id_fkey(
            id,
            email,
            first_name,
            last_name,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo cambios pendientes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} cambios pendientes encontrados`);
      return data || [];
    } catch (error) {
      console.error('❌ PendingRoleChangeService: Error en getPendingRoleChanges:', error);
      return [];
    }
  }

  // ============= ACEPTAR CAMBIO =============

  async acceptRoleChange(changeId) {
    try {
      console.log(`✅ PendingRoleChangeService: Aceptando cambio ${changeId}`);

      // Usar función de base de datos para transacción segura
      const { data, error } = await supabase
        .rpc('accept_role_change', { change_id: changeId });

      if (error) {
        console.error('❌ Error aceptando cambio de rol:', error);
        throw error;
      }

      console.log('✅ Cambio de rol aceptado exitosamente');

      // Disparar evento de rol cambiado para actualizar UI
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('role-change-accepted', {
          detail: { changeId, accepted: true }
        }));

        // También disparar evento para recargar datos del usuario
        window.dispatchEvent(new CustomEvent('user-data-refresh-needed'));
      }, 100);

      return true;
    } catch (error) {
      console.error('❌ PendingRoleChangeService: Error en acceptRoleChange:', error);
      throw error;
    }
  }

  // ============= RECHAZAR CAMBIO =============

  async rejectRoleChange(changeId) {
    try {
      console.log(`❌ PendingRoleChangeService: Rechazando cambio ${changeId}`);

      const { data, error } = await supabase
        .rpc('reject_role_change', { change_id: changeId });

      if (error) {
        console.error('❌ Error rechazando cambio de rol:', error);
        throw error;
      }

      console.log('✅ Cambio de rol rechazado exitosamente');

      // Disparar evento
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('role-change-rejected', {
          detail: { changeId, rejected: true }
        }));
      }, 100);

      return true;
    } catch (error) {
      console.error('❌ PendingRoleChangeService: Error en rejectRoleChange:', error);
      throw error;
    }
  }

  // ============= VERIFICAR CAMBIOS AL LOGIN =============

  async checkPendingChangesOnLogin(userId) {
    try {
      console.log(`🔍 PendingRoleChangeService: Verificando cambios pendientes al login para ${userId}`);

      const pendingChanges = await this.getPendingRoleChanges(userId);

      if (pendingChanges.length > 0) {
        console.log(`📬 ${pendingChanges.length} cambios pendientes encontrados al login`);

        // Disparar evento para mostrar modal de cambios pendientes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('pending-role-changes-found', {
            detail: {
              userId,
              changes: pendingChanges,
              count: pendingChanges.length
            }
          }));
        }, 1000); // Delay para que la UI esté lista
      }

      return pendingChanges;
    } catch (error) {
      console.error('❌ PendingRoleChangeService: Error verificando cambios al login:', error);
      return [];
    }
  }

  // ============= LIMPIAR CAMBIOS EXPIRADOS =============

  async cleanupExpiredChanges() {
    try {
      console.log('🧹 PendingRoleChangeService: Limpiando cambios expirados...');

      const { data, error } = await supabase
        .rpc('cleanup_expired_role_changes');

      if (error) {
        console.warn('⚠️ Error limpiando cambios expirados:', error);
      } else {
        console.log('✅ Limpieza de cambios expirados completada');
      }
    } catch (error) {
      console.warn('⚠️ PendingRoleChangeService: Error en cleanupExpiredChanges:', error);
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  async _createPendingChangeNotification(pendingChange) {
    try {
      const roleNames = {
        'visitor': 'Visitante',
        'volunteer': 'Voluntario',
        'admin': 'Administrador'
      };

      const roleEmojis = {
        'visitor': '👁️',
        'volunteer': '🤝',
        'admin': '👑'
      };

      const adminName = pendingChange.admin?.full_name ||
                       `${pendingChange.admin?.first_name || ''} ${pendingChange.admin?.last_name || ''}`.trim() ||
                       pendingChange.admin?.email || 'Administrador';

      const title = `${roleEmojis[pendingChange.new_role]} Cambio de rol pendiente`;
      const message = `Un administrador (${adminName}) quiere cambiar tu rol de ${roleNames[pendingChange.old_role]} a ${roleNames[pendingChange.new_role]}. Por favor revisa y acepta o rechaza este cambio.`;

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: pendingChange.user_id,
          type: 'pending_role_change',
          title: title,
          message: message,
          data: JSON.stringify({
            pending_change_id: pendingChange.id,
            old_role: pendingChange.old_role,
            new_role: pendingChange.new_role,
            admin_message: pendingChange.message,
            expires_at: pendingChange.expires_at
          })
        });

      if (error) {
        console.warn('⚠️ Error creando notificación de cambio pendiente:', error);
      } else {
        console.log('✅ Notificación de cambio pendiente creada');
      }
    } catch (error) {
      console.warn('⚠️ Error en _createPendingChangeNotification:', error);
    }
  }

  _dispatchPendingChangeEvent(pendingChange) {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pending-role-change-created', {
          detail: {
            changeId: pendingChange.id,
            userId: pendingChange.user_id,
            oldRole: pendingChange.old_role,
            newRole: pendingChange.new_role,
            adminName: pendingChange.admin?.full_name || pendingChange.admin?.email,
            message: pendingChange.message,
            expiresAt: pendingChange.expires_at
          }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Error disparando evento de cambio pendiente:', error);
    }
  }

  // ============= UTILIDADES =============

  getRoleDisplayName(role) {
    const roleNames = {
      'visitor': 'Visitante',
      'volunteer': 'Voluntario',
      'admin': 'Administrador'
    };
    return roleNames[role] || role;
  }

  getRoleEmoji(role) {
    const roleEmojis = {
      'visitor': '👁️',
      'volunteer': '🤝',
      'admin': '👑'
    };
    return roleEmojis[role] || '📋';
  }
}

// Crear instancia singleton
const pendingRoleChangeService = new PendingRoleChangeService();

export default pendingRoleChangeService;
export { PendingRoleChangeService };