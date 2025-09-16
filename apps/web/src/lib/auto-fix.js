// ============= CASIRA Auto-Fix Service =============
// Servicio que se ejecuta automáticamente para resolver problemas comunes
import { supabase } from './supabase-singleton.js';
import { supabaseAPI } from './supabase-api.js';

class AutoFixService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
  }

  async runAutoFix() {
    if (this.isRunning) {
      console.log('⚠️ AUTO-FIX: Already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔧 AUTO-FIX: Starting automatic fixes...');

    try {
      const fixes = [];

      // Fix 1: Resolver usuarios administradores
      const adminFix = await this.ensureAdminUsers();
      if (adminFix.applied) fixes.push(adminFix.message);

      // Fix 2: Sincronizar conteos de voluntarios
      const countFix = await this.syncVolunteerCounts();
      if (countFix.applied) fixes.push(countFix.message);

      // Fix 3: Limpiar solicitudes huérfanas
      const cleanupFix = await this.cleanupOrphanedRequests();
      if (cleanupFix.applied) fixes.push(cleanupFix.message);

      this.lastRun = new Date().toISOString();

      if (fixes.length > 0) {
        console.log('✅ AUTO-FIX: Applied fixes:', fixes);

        // Mostrar notificación discreta al usuario
        this.showFixNotification(fixes);
      } else {
        console.log('✅ AUTO-FIX: No fixes needed, system is healthy');
      }

      return { success: true, fixes };

    } catch (error) {
      console.error('❌ AUTO-FIX: Error during auto-fix:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  async ensureAdminUsers() {
    try {
      console.log('👤 AUTO-FIX: Checking admin users...');

      // Buscar usuarios admin
      const { data: admins, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin');

      if (error) throw error;

      if (admins.length === 0) {
        console.log('🔧 AUTO-FIX: No admin users found, promoting first user...');

        // Buscar primer usuario disponible
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, role')
          .limit(1);

        if (usersError) throw usersError;

        if (users.length > 0) {
          // Promover a admin
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', users[0].id);

          if (updateError) throw updateError;

          return {
            applied: true,
            message: `Promoted user ${users[0].email} to admin`
          };
        } else {
          return {
            applied: false,
            message: 'No users found to promote to admin'
          };
        }
      }

      console.log(`✅ AUTO-FIX: Found ${admins.length} admin user(s)`);
      return {
        applied: false,
        message: `${admins.length} admin users already exist`
      };

    } catch (error) {
      console.error('❌ AUTO-FIX: Error ensuring admin users:', error);
      return { applied: false, error: error.message };
    }
  }

  async syncVolunteerCounts() {
    try {
      console.log('🔢 AUTO-FIX: Syncing volunteer counts...');

      // Obtener todas las actividades
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, current_volunteers');

      if (error) throw error;

      let updatedCount = 0;

      for (const activity of activities) {
        try {
          // Contar participantes reales
          const { count, error: countError } = await supabase
            .from('activity_participants')
            .select('*', { count: 'exact', head: true })
            .eq('activity_id', activity.id);

          if (countError) {
            console.warn(`⚠️ Could not count participants for activity ${activity.id}`);
            continue;
          }

          const realCount = count || 0;

          // Solo actualizar si es diferente
          if (activity.current_volunteers !== realCount) {
            const { error: updateError } = await supabase
              .from('activities')
              .update({ current_volunteers: realCount })
              .eq('id', activity.id);

            if (!updateError) {
              updatedCount++;
              console.log(`🔄 Updated activity ${activity.id}: ${activity.current_volunteers} → ${realCount}`);
            }
          }

        } catch (activityError) {
          console.warn(`⚠️ Error processing activity ${activity.id}:`, activityError);
        }
      }

      if (updatedCount > 0) {
        return {
          applied: true,
          message: `Synchronized volunteer counts for ${updatedCount} activities`
        };
      }

      return {
        applied: false,
        message: 'All volunteer counts are already synchronized'
      };

    } catch (error) {
      console.error('❌ AUTO-FIX: Error syncing volunteer counts:', error);
      return { applied: false, error: error.message };
    }
  }

  async cleanupOrphanedRequests() {
    try {
      console.log('🧹 AUTO-FIX: Cleaning up orphaned requests...');

      // Buscar solicitudes que referencian usuarios o actividades inexistentes
      const { data: orphanedRequests, error } = await supabase
        .from('volunteer_requests')
        .select(`
          id, user_id, activity_id,
          user:users!volunteer_requests_user_id_fkey(id),
          activity:activities!volunteer_requests_activity_id_fkey(id)
        `)
        .or('users.id.is.null,activities.id.is.null');

      if (error) throw error;

      if (orphanedRequests.length > 0) {
        console.log(`🗑️ AUTO-FIX: Found ${orphanedRequests.length} orphaned requests, cleaning up...`);

        const requestIds = orphanedRequests.map(r => r.id);

        const { error: deleteError } = await supabase
          .from('volunteer_requests')
          .delete()
          .in('id', requestIds);

        if (deleteError) throw deleteError;

        return {
          applied: true,
          message: `Cleaned up ${orphanedRequests.length} orphaned volunteer requests`
        };
      }

      return {
        applied: false,
        message: 'No orphaned requests found'
      };

    } catch (error) {
      console.error('❌ AUTO-FIX: Error cleaning up orphaned requests:', error);
      return { applied: false, error: error.message };
    }
  }

  showFixNotification(fixes) {
    try {
      // Crear notificación temporal en la esquina
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0">🔧</div>
          <div>
            <div class="font-medium">Sistema Auto-reparado</div>
            <div class="text-sm opacity-90">${fixes.length} problema(s) resuelto(s)</div>
          </div>
        </div>
      `;

      document.body.appendChild(notification);

      // Remover después de 5 segundos
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);

    } catch (error) {
      console.warn('⚠️ Could not show fix notification:', error);
    }
  }

  // Ejecutar auto-fix cada 5 minutos
  startAutoFixScheduler() {
    console.log('⏰ AUTO-FIX: Starting auto-fix scheduler (every 5 minutes)');

    setInterval(() => {
      this.runAutoFix();
    }, 5 * 60 * 1000); // 5 minutos

    // Ejecutar una vez inmediatamente
    setTimeout(() => {
      this.runAutoFix();
    }, 2000); // Esperar 2 segundos después de cargar
  }
}

// Crear instancia y iniciar scheduler
const autoFixService = new AutoFixService();

// Iniciar auto-fix automático
if (typeof window !== 'undefined') {
  autoFixService.startAutoFixScheduler();

  // Exponer para uso manual
  window.casiraAutoFix = {
    runNow: () => autoFixService.runAutoFix(),
    lastRun: () => autoFixService.lastRun
  };

  console.log('🔧 AUTO-FIX: Service started. Use window.casiraAutoFix.runNow() to run manually');
}

export default autoFixService;