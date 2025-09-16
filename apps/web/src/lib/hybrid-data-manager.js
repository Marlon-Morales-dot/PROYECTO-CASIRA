// ============= CASIRA Connect - Hybrid Data Manager =============
// Gestor unificado de datos que combina Supabase, localStorage y Google Auth
import { supabaseAPI } from './supabase-api.js';
import adminService from './services/admin.service.js';

class HybridDataManager {
  constructor() {
    this.supabaseAPI = supabaseAPI;
    this.adminService = adminService;
    console.log('🔄 HybridDataManager: Iniciado');
  }

  // ============= USUARIOS =============

  async getAllUsers() {
    try {
      console.log('👥 HybridDataManager: Obteniendo todos los usuarios...');
      const users = await this.adminService.getAllUsers();
      console.log(`✅ HybridDataManager: ${users.length} usuarios obtenidos`);
      return users;
    } catch (error) {
      console.error('❌ HybridDataManager: Error obteniendo usuarios:', error);
      return [];
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      console.log(`🔄 HybridDataManager: Actualizando rol de usuario ${userId} a ${newRole}`);

      // Usar adminService que ya tiene toda la lógica implementada
      const result = await this.adminService.updateUserRole(userId, newRole);

      console.log('✅ HybridDataManager: Rol de usuario actualizado exitosamente');

      // Disparar evento para notificar a los componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('casira-users-updated', {
          detail: {
            action: 'role_updated',
            userId,
            newRole,
            timestamp: new Date().toISOString()
          }
        }));
      }

      return result;
    } catch (error) {
      console.error('❌ HybridDataManager: Error actualizando rol:', error);
      throw error;
    }
  }

  async syncUsersToSupabase() {
    try {
      console.log('🔄 HybridDataManager: Iniciando sincronización de usuarios a Supabase...');

      let result = {
        synced: 0,
        errors: 0,
        errorDetails: []
      };

      // 1. Obtener usuarios locales que no estén en Supabase
      const localUsers = this._getLocalUsers();
      const googleUsers = this._getGoogleUsers();

      console.log(`📊 Usuarios locales: ${localUsers.length}, Google: ${googleUsers.length}`);

      // 2. Obtener usuarios existentes en Supabase para evitar duplicados
      const { data: existingUsers } = await this.supabaseAPI.users.getAllUsers();
      const existingEmails = new Set(existingUsers.map(u => u.email));

      console.log(`📊 Usuarios existentes en Supabase: ${existingUsers.length}`);

      // 3. Sincronizar usuarios locales
      for (const user of localUsers) {
        if (!existingEmails.has(user.email)) {
          try {
            await this._syncUserToSupabase(user);
            result.synced++;
            console.log(`✅ Usuario local sincronizado: ${user.email}`);
          } catch (error) {
            result.errors++;
            result.errorDetails.push({
              user: user.email,
              error: error.message
            });
            console.error(`❌ Error sincronizando usuario local ${user.email}:`, error);
          }
        }
      }

      // 4. Sincronizar usuarios de Google
      for (const user of googleUsers) {
        if (!existingEmails.has(user.email)) {
          try {
            await this._syncUserToSupabase(user);
            result.synced++;
            console.log(`✅ Usuario Google sincronizado: ${user.email}`);
          } catch (error) {
            result.errors++;
            result.errorDetails.push({
              user: user.email,
              error: error.message
            });
            console.error(`❌ Error sincronizando usuario Google ${user.email}:`, error);
          }
        }
      }

      console.log(`✅ HybridDataManager: Sincronización completada. Sincronizados: ${result.synced}, Errores: ${result.errors}`);
      return result;

    } catch (error) {
      console.error('❌ HybridDataManager: Error en sincronización:', error);
      throw error;
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  _getLocalUsers() {
    try {
      // Obtener usuarios del storage manager
      const storageData = this._getStorageManagerData();
      return storageData.users || [];
    } catch (error) {
      console.warn('⚠️ HybridDataManager: Error obteniendo usuarios locales:', error);
      return [];
    }
  }

  _getGoogleUsers() {
    try {
      // Obtener usuarios de Google desde localStorage
      const googleUsers = JSON.parse(localStorage.getItem('google_users') || '[]');

      // También obtener de casira-data-v2
      const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
      const casiraGoogleUsers = (casiraData.users || []).filter(u => u.provider === 'google');

      // Combinar y eliminar duplicados
      const allGoogleUsers = [...googleUsers, ...casiraGoogleUsers];
      const seenEmails = new Set();

      return allGoogleUsers.filter(user => {
        if (!seenEmails.has(user.email)) {
          seenEmails.add(user.email);
          return true;
        }
        return false;
      });
    } catch (error) {
      console.warn('⚠️ HybridDataManager: Error obteniendo usuarios Google:', error);
      return [];
    }
  }

  _getStorageManagerData() {
    try {
      // Simular carga de storageManager sin importar dinámicamente aquí
      const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
      return casiraData;
    } catch (error) {
      console.warn('⚠️ HybridDataManager: Error obteniendo datos de storage:', error);
      return { users: [], activities: [] };
    }
  }

  async _syncUserToSupabase(user) {
    try {
      const userData = {
        email: user.email,
        first_name: user.first_name || user.given_name || user.email.split('@')[0],
        last_name: user.last_name || user.family_name || '',
        full_name: user.full_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role || 'visitor',
        avatar_url: user.avatar_url || user.picture || null,
        provider: user.provider || (user.google_id ? 'google' : 'casira'),
        google_id: user.google_id || null,
        verified: user.verified || false,
        status: user.status || 'active'
      };

      const result = await this.supabaseAPI.users.createUser(userData);
      return result;
    } catch (error) {
      console.error('❌ HybridDataManager: Error creando usuario en Supabase:', error);
      throw error;
    }
  }

  // ============= ACTIVIDADES =============

  async getAllActivities() {
    try {
      console.log('🎯 HybridDataManager: Obteniendo todas las actividades...');
      const activities = await this.supabaseAPI.activities.getAllActivities();
      console.log(`✅ HybridDataManager: ${activities.length} actividades obtenidas`);
      return activities;
    } catch (error) {
      console.error('❌ HybridDataManager: Error obteniendo actividades:', error);
      return [];
    }
  }

  // ============= NOTIFICACIONES =============

  async getAllNotifications() {
    try {
      console.log('🔔 HybridDataManager: Obteniendo todas las notificaciones...');
      const notifications = await this.supabaseAPI.notifications.getUserNotifications();
      console.log(`✅ HybridDataManager: ${notifications.length} notificaciones obtenidas`);
      return notifications;
    } catch (error) {
      console.error('❌ HybridDataManager: Error obteniendo notificaciones:', error);
      return [];
    }
  }

  // ============= HEALTH CHECK =============

  async healthCheck() {
    try {
      const supabaseHealth = await this.supabaseAPI.healthCheck();
      const localStorageSize = this._getLocalStorageSize();

      return {
        supabase: supabaseHealth,
        localStorage: {
          available: typeof Storage !== 'undefined',
          size: localStorageSize
        },
        hybrid: {
          ready: supabaseHealth.healthy,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ HybridDataManager: Error en health check:', error);
      return {
        supabase: { healthy: false, error: error.message },
        localStorage: { available: false, size: 0 },
        hybrid: { ready: false, timestamp: new Date().toISOString() }
      };
    }
  }

  _getLocalStorageSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      return 0;
    }
  }

  // ============= EVENTOS =============

  dispatchDataUpdate(type, data) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('casira-data-updated', {
        detail: {
          type,
          data,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }
}

// Crear instancia singleton
const hybridDataManager = new HybridDataManager();

export default hybridDataManager;
export { HybridDataManager };