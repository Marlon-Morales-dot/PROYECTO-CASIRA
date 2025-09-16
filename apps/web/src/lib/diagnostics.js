// ============= CASIRA Diagnostics =============
// Herramientas de diagnóstico para verificar el sistema
import { supabase } from './supabase-singleton.js';

class DiagnosticsService {
  async runFullDiagnostics() {
    console.log('🩺 DIAGNOSTICS: Running full system diagnostics...');

    const results = {
      supabase: await this.testSupabaseConnection(),
      adminUser: await this.testAdminUser(),
      activities: await this.testActivities(),
      requests: await this.testVolunteerRequests(),
      notifications: await this.testNotifications(),
      overall: 'pending'
    };

    // Determinar estado general
    const failed = Object.values(results).filter(r => r?.status === 'error').length;
    const warnings = Object.values(results).filter(r => r?.status === 'warning').length;

    if (failed > 0) {
      results.overall = 'error';
    } else if (warnings > 0) {
      results.overall = 'warning';
    } else {
      results.overall = 'success';
    }

    console.log('🩺 DIAGNOSTICS: Full diagnostics completed:', results);
    return results;
  }

  async testSupabaseConnection() {
    try {
      console.log('🔌 Testing Supabase connection...');

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        status: 'success',
        message: 'Supabase connection working',
        data: { connected: true }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message
      };
    }
  }

  async testAdminUser() {
    try {
      console.log('👤 Testing admin user access...');

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin');

      if (error) throw error;

      if (users.length === 0) {
        return {
          status: 'warning',
          message: 'No admin users found in Supabase',
          data: { adminCount: 0 }
        };
      }

      return {
        status: 'success',
        message: `Found ${users.length} admin user(s)`,
        data: {
          adminCount: users.length,
          admins: users.map(u => ({ id: u.id, email: u.email }))
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to check admin users',
        error: error.message
      };
    }
  }

  async testActivities() {
    try {
      console.log('📋 Testing activities access...');

      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, title, current_volunteers, max_volunteers')
        .limit(5);

      if (error) throw error;

      return {
        status: 'success',
        message: `Found ${activities.length} activities`,
        data: {
          activityCount: activities.length,
          activities: activities
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to access activities',
        error: error.message
      };
    }
  }

  async testVolunteerRequests() {
    try {
      console.log('📨 Testing volunteer requests access...');

      const { data: requests, error } = await supabase
        .from('volunteer_requests')
        .select(`
          id, status, created_at,
          user:users!volunteer_requests_user_id_fkey(id, email),
          activity:activities!volunteer_requests_activity_id_fkey(id, title)
        `)
        .limit(10);

      if (error) throw error;

      const pending = requests.filter(r => r.status === 'pending').length;
      const approved = requests.filter(r => r.status === 'approved').length;

      return {
        status: 'success',
        message: `Found ${requests.length} volunteer requests`,
        data: {
          total: requests.length,
          pending,
          approved,
          requests: requests.slice(0, 3) // Solo los primeros 3 para logs
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to access volunteer requests',
        error: error.message
      };
    }
  }

  async testNotifications() {
    try {
      console.log('🔔 Testing notifications access...');

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, type, title, created_at, read')
        .limit(5);

      if (error) throw error;

      return {
        status: 'success',
        message: `Found ${notifications.length} notifications`,
        data: {
          notificationCount: notifications.length,
          unread: notifications.filter(n => !n.read).length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to access notifications',
        error: error.message
      };
    }
  }

  async testVolunteerRegistration(testUserId, testActivityId) {
    try {
      console.log('🧪 Testing volunteer registration flow...');

      // Importar el servicio
      const { default: registrationService } = await import('./services/activity-registrations.service.js');

      // Crear solicitud de prueba
      const request = await registrationService.createVolunteerRequest({
        user_id: testUserId,
        activity_id: testActivityId,
        message: 'Test registration from diagnostics',
        status: 'pending'
      });

      // Inmediatamente eliminar la solicitud de prueba
      await supabase
        .from('volunteer_requests')
        .delete()
        .eq('id', request.id);

      return {
        status: 'success',
        message: 'Volunteer registration flow working',
        data: { testRequestCreated: true }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Volunteer registration flow failed',
        error: error.message
      };
    }
  }

  async quickFix() {
    console.log('🔧 QUICK FIX: Attempting to fix common issues...');

    const fixes = [];

    try {
      // Fix 1: Asegurar que hay al menos un admin
      const { data: admins } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .limit(1);

      if (admins.length === 0) {
        console.log('🔧 Creating emergency admin user...');

        const { data: anyUser } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (anyUser.length > 0) {
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', anyUser[0].id);

          fixes.push('Promoted first user to admin');
        }
      }

      // Fix 2: Actualizar conteos de voluntarios
      const { data: activities } = await supabase
        .from('activities')
        .select('id');

      for (const activity of activities || []) {
        try {
          const { count } = await supabase
            .from('activity_participants')
            .select('*', { count: 'exact', head: true })
            .eq('activity_id', activity.id);

          await supabase
            .from('activities')
            .update({ current_volunteers: count || 0 })
            .eq('id', activity.id);

        } catch (error) {
          console.warn(`⚠️ Could not fix count for activity ${activity.id}`);
        }
      }

      fixes.push(`Updated volunteer counts for ${activities?.length || 0} activities`);

      console.log('✅ QUICK FIX: Fixes applied:', fixes);
      return { success: true, fixes };

    } catch (error) {
      console.error('❌ QUICK FIX: Error applying fixes:', error);
      return { success: false, error: error.message, fixes };
    }
  }
}

const diagnosticsService = new DiagnosticsService();

// Exponer funciones globalmente para uso en consola
window.casiraDiagnostics = {
  runFullDiagnostics: () => diagnosticsService.runFullDiagnostics(),
  quickFix: () => diagnosticsService.quickFix(),
  testSupabase: () => diagnosticsService.testSupabaseConnection(),
  testAdmin: () => diagnosticsService.testAdminUser()
};

console.log('🩺 DIAGNOSTICS: Available in console as window.casiraDiagnostics');

export default diagnosticsService;