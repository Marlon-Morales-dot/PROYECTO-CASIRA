// ============= CASIRA Connect - Enhanced Admin Service =============
// Versión mejorada del AdminService con sistema de cambios pendientes
import { createClient } from '@supabase/supabase-js';
import pendingRoleChangeService from './pending-role-change.service.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class EnhancedAdminService {
  constructor() {
    console.log('🚀 EnhancedAdminService: Inicializado con sistema de cambios pendientes');
  }

  // ============= CAMBIO DE ROL CON CONFIRMACIÓN =============

  async updateUserRoleWithConfirmation(targetUserId, newRole, adminMessage = null) {
    try {
      console.log(`🔄 EnhancedAdminService: Iniciando cambio de rol pendiente ${targetUserId} → ${newRole}`);

      // STEP 1: Obtener información del admin actual (quien hace el cambio)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('No hay usuario administrador autenticado');
      }

      // Verificar que el admin existe en la tabla users
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('email', currentUser.email)
        .single();

      if (adminError || !adminData) {
        throw new Error('Administrador no encontrado en el sistema');
      }

      if (adminData.role !== 'admin') {
        throw new Error('Solo los administradores pueden cambiar roles');
      }

      const adminUserId = adminData.id;

      // STEP 2: Encontrar el usuario objetivo
      let finalTargetUserId = targetUserId;
      let targetUserEmail = null;
      let oldRole = 'visitor';

      if (targetUserId.includes('@')) {
        // Es un email, buscar el UUID
        targetUserEmail = targetUserId;
        console.log(`📧 EnhancedAdminService: Buscando usuario por email: ${targetUserEmail}`);

        const { data: foundUser, error: findError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', targetUserEmail)
          .single();

        if (!findError && foundUser) {
          finalTargetUserId = foundUser.id;
          oldRole = foundUser.role || 'visitor';
          console.log(`✅ EnhancedAdminService: Usuario encontrado, ID: ${finalTargetUserId}, rol actual: ${oldRole}`);
        } else {
          throw new Error(`Usuario con email ${targetUserEmail} no encontrado`);
        }
      } else {
        // Es un UUID, verificar que existe
        const { data: existingUser, error: verifyError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', finalTargetUserId)
          .single();

        if (!verifyError && existingUser) {
          targetUserEmail = existingUser.email;
          oldRole = existingUser.role || 'visitor';
          console.log(`✅ EnhancedAdminService: Usuario verificado: ${finalTargetUserId}, rol actual: ${oldRole}`);
        } else {
          throw new Error(`Usuario con ID ${finalTargetUserId} no encontrado`);
        }
      }

      // STEP 3: Verificar si el rol realmente está cambiando
      if (oldRole === newRole) {
        console.log(`ℹ️ EnhancedAdminService: Usuario ya tiene el rol ${newRole}, cancelando operación`);
        return {
          success: true,
          message: `El usuario ya tiene el rol ${newRole}`,
          noChangeNeeded: true
        };
      }

      // STEP 4: Crear el cambio pendiente
      console.log(`📝 EnhancedAdminService: Creando cambio pendiente: ${oldRole} → ${newRole}`);

      const pendingChange = await pendingRoleChangeService.createPendingRoleChange(
        finalTargetUserId,
        adminUserId,
        oldRole,
        newRole,
        adminMessage
      );

      console.log('✅ EnhancedAdminService: Cambio pendiente creado exitosamente');

      // STEP 5: Notificar al usuario objetivo en tiempo real si está online
      this._notifyUserInRealTime(targetUserEmail, oldRole, newRole, adminData.full_name || adminData.email);

      return {
        success: true,
        pendingChangeId: pendingChange.id,
        targetUserEmail: targetUserEmail,
        oldRole: oldRole,
        newRole: newRole,
        message: 'Cambio de rol enviado al usuario para confirmación',
        pendingChange: pendingChange
      };

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error en updateUserRoleWithConfirmation:', error);
      throw error;
    }
  }

  // ============= CAMBIO INMEDIATO (LEGACY) =============

  async updateUserRoleImmediate(targetUserId, newRole) {
    try {
      console.log(`⚡ EnhancedAdminService: Cambio de rol inmediato ${targetUserId} → ${newRole}`);

      // Importar el servicio original para mantener compatibilidad
      const adminService = await import('./admin.service.js');
      return await adminService.default.updateUserRole(targetUserId, newRole);

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error en updateUserRoleImmediate:', error);
      throw error;
    }
  }

  // ============= GESTIÓN DE CAMBIOS PENDIENTES =============

  async getPendingChangesForUser(userId) {
    try {
      return await pendingRoleChangeService.getPendingRoleChanges(userId);
    } catch (error) {
      console.error('❌ Error obteniendo cambios pendientes:', error);
      return [];
    }
  }

  async getAllPendingChanges() {
    try {
      console.log('📋 EnhancedAdminService: Obteniendo todos los cambios pendientes...');

      const { data, error } = await supabase
        .from('pending_role_changes')
        .select(`
          *,
          user:users!pending_role_changes_user_id_fkey(
            id,
            email,
            first_name,
            last_name,
            full_name,
            avatar_url
          ),
          admin:users!pending_role_changes_admin_id_fkey(
            id,
            email,
            first_name,
            last_name,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo cambios pendientes:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} cambios pendientes encontrados`);
      return data || [];

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error en getAllPendingChanges:', error);
      return [];
    }
  }

  async cancelPendingChange(changeId, reason = null) {
    try {
      console.log(`❌ EnhancedAdminService: Cancelando cambio pendiente ${changeId}`);

      const { data, error } = await supabase
        .from('pending_role_changes')
        .update({
          status: 'expired',
          message: reason ? `Cancelado: ${reason}` : 'Cancelado por administrador'
        })
        .eq('id', changeId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('❌ Error cancelando cambio pendiente:', error);
        throw error;
      }

      console.log('✅ Cambio pendiente cancelado exitosamente');
      return data;

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error en cancelPendingChange:', error);
      throw error;
    }
  }

  // ============= ESTADÍSTICAS MEJORADAS =============

  async getEnhancedAdminStats() {
    try {
      console.log('📊 EnhancedAdminService: Obteniendo estadísticas mejoradas...');

      // Obtener estadísticas básicas del servicio original
      const adminService = await import('./admin.service.js');
      const basicStats = await adminService.default.getAdminStats();

      // Obtener estadísticas de cambios pendientes
      const { data: pendingChanges, error: pendingError } = await supabase
        .from('pending_role_changes')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 días

      const pendingStats = {
        pending: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        total_last_30_days: 0
      };

      if (!pendingError && pendingChanges) {
        pendingChanges.forEach(change => {
          pendingStats[change.status] = (pendingStats[change.status] || 0) + 1;
          pendingStats.total_last_30_days++;
        });
      }

      return {
        ...basicStats,
        pending_role_changes: pendingStats
      };

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error en getEnhancedAdminStats:', error);
      // Fallback a estadísticas básicas
      const adminService = await import('./admin.service.js');
      return await adminService.default.getAdminStats();
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  _notifyUserInRealTime(userEmail, oldRole, newRole, adminName) {
    try {
      console.log(`🔔 EnhancedAdminService: Notificando cambio pendiente a ${userEmail}`);

      if (typeof window !== 'undefined') {
        // Disparar evento específico para cambios pendientes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('pending-role-change-notification', {
            detail: {
              userEmail: userEmail,
              oldRole: oldRole,
              newRole: newRole,
              adminName: adminName,
              type: 'pending_confirmation',
              timestamp: new Date().toISOString()
            }
          }));
        }, 500);
      }
    } catch (error) {
      console.warn('⚠️ Error notificando en tiempo real:', error);
    }
  }

  // ============= VERIFICACIÓN AL LOGIN =============

  async checkUserPendingChangesOnLogin(userId) {
    try {
      console.log(`🔍 EnhancedAdminService: Verificando cambios pendientes al login para ${userId}`);

      const pendingChanges = await pendingRoleChangeService.checkPendingChangesOnLogin(userId);

      if (pendingChanges.length > 0) {
        console.log(`📬 ${pendingChanges.length} cambios pendientes encontrados al login`);

        // También limpiar cambios expirados
        await pendingRoleChangeService.cleanupExpiredChanges();
      }

      return pendingChanges;

    } catch (error) {
      console.error('❌ EnhancedAdminService: Error verificando cambios al login:', error);
      return [];
    }
  }

  // ============= UTILIDADES =============

  getRoleDisplayName(role) {
    return pendingRoleChangeService.getRoleDisplayName(role);
  }

  getRoleEmoji(role) {
    return pendingRoleChangeService.getRoleEmoji(role);
  }

  // ============= DELEGACIÓN A SERVICIO ORIGINAL =============

  async getAllUsers() {
    const adminService = await import('./admin.service.js');
    return await adminService.default.getAllUsers();
  }

  async getAllRegistrations() {
    const adminService = await import('./admin.service.js');
    return await adminService.default.getAllRegistrations();
  }

  async approveRegistration(registrationId) {
    const adminService = await import('./admin.service.js');
    return await adminService.default.approveRegistration(registrationId);
  }

  async rejectRegistration(registrationId) {
    const adminService = await import('./admin.service.js');
    return await adminService.default.rejectRegistration(registrationId);
  }

  async getAllNotifications() {
    const adminService = await import('./admin.service.js');
    return await adminService.default.getAllNotifications();
  }

  async getAdminStats() {
    return await this.getEnhancedAdminStats();
  }
}

// Crear instancia singleton
const enhancedAdminService = new EnhancedAdminService();

export default enhancedAdminService;
export { EnhancedAdminService };