import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class LogoutService {
  
  async performCompleteLogout() {
    console.log('🚪 LogoutService: Iniciando cierre de sesión completo...');
    
    try {
      // 1. Cerrar sesión de Supabase si existe sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('🔐 LogoutService: Cerrando sesión de Supabase...');
        await supabase.auth.signOut();
      }

      // 2. Limpiar Google Auth si está disponible
      if (window.google && window.google.accounts) {
        try {
          console.log('🌐 LogoutService: Cerrando sesión de Google...');
          window.google.accounts.id.disableAutoSelect();
        } catch (googleError) {
          console.warn('⚠️ LogoutService: Error cerrando Google Auth:', googleError);
        }
      }

      // 3. Limpiar localStorage completamente
      console.log('🧹 LogoutService: Limpiando almacenamiento local...');
      this.clearLocalStorage();

      // 4. Limpiar sessionStorage también
      console.log('🧹 LogoutService: Limpiando almacenamiento de sesión...');
      sessionStorage.clear();

      // 5. Limpiar cookies relacionadas con autenticación
      this.clearAuthCookies();

      console.log('✅ LogoutService: Cierre de sesión completado exitosamente');
      
      // 6. Redireccionar después de una pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Forzar redirección a la página principal
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ LogoutService: Error durante el cierre de sesión:', error);
      
      // En caso de error, al menos limpiar localStorage y redireccionar
      this.clearLocalStorage();
      window.location.href = '/';
      
      throw error;
    }
  }

  clearLocalStorage() {
    // Lista de claves específicas que debemos limpiar
    const keysToRemove = [
      'token',
      'user',
      'supabase.auth.token',
      'sb-wlliqmcpiiktcdzwzhdn-auth-token',
      'google_user',
      'auth_session',
      'casira-data'
    ];

    // Remover claves específicas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Remover todas las claves que empiecen con patrones específicos
    const patterns = [
      'lastLoginTime_',
      'supabase.',
      'sb-',
      'google_',
      'auth_',
      'casira_'
    ];

    Object.keys(localStorage).forEach(key => {
      patterns.forEach(pattern => {
        if (key.startsWith(pattern)) {
          localStorage.removeItem(key);
        }
      });
    });
  }

  clearAuthCookies() {
    // Lista de cookies de autenticación comunes a limpiar
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'google-signin',
      'auth-session'
    ];

    cookiesToClear.forEach(cookieName => {
      // Limpiar cookie para el dominio actual
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Limpiar cookie para subdominios
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  }

  // Método para logout con confirmación modal
  async logoutWithConfirmation(user, navigate) {
    return new Promise((resolve, reject) => {
      // Este método será usado por el componente LogoutModal
      this.performCompleteLogout()
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // Método rápido sin confirmación (para casos especiales)
  async quickLogout() {
    try {
      await this.performCompleteLogout();
    } catch (error) {
      console.error('Error en logout rápido:', error);
      // Forzar limpieza y redirección aunque haya error
      this.clearLocalStorage();
      window.location.href = '/';
    }
  }
}

// Crear instancia singleton
const logoutService = new LogoutService();

export default logoutService;
export { LogoutService };