// ============= CASIRA Google Auth - Sistema Avanzado de Autenticación =============

import { storageManager } from './storage-manager.js';

class GoogleAuthManager {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.listeners = [];
    
    // Configuración de Google Auth
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1009348371055-7b2sj5p64g1c8vnkmkrv5v6c0baqhbfq.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      cookiePolicy: 'single_host_origin',
    };
    
    console.log('🔧 CASIRA Google Auth: Inicializando con configuración:', {
      clientId: this.config.clientId ? `${this.config.clientId.substring(0, 20)}...` : 'No definido',
      scopes: this.config.scopes
    });
    
    this.initializeGoogleAuth();
  }

  // ============= INICIALIZACIÓN =============
  async initializeGoogleAuth() {
    try {
      console.log('🚀 CASIRA Google Auth: Iniciando inicialización...');
      
      // Verificar si ya existe la API de Google
      if (typeof window.gapi !== 'undefined') {
        await this.setupGoogleAPI();
        return;
      }

      // Cargar Google API si no está disponible
      await this.loadGoogleAPI();
      await this.setupGoogleAPI();
      
    } catch (error) {
      console.error('❌ CASIRA Google Auth: Error en inicialización:', error);
      this.handleInitializationError(error);
    }
  }

  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargada
      if (window.gapi) {
        resolve();
        return;
      }

      console.log('📦 CASIRA Google Auth: Cargando Google API...');
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        console.log('✅ CASIRA Google Auth: Google API cargada');
        resolve();
      };
      script.onerror = (error) => {
        console.error('❌ Error cargando Google API:', error);
        reject(new Error('Failed to load Google API'));
      };
      
      document.head.appendChild(script);
    });
  }

  async setupGoogleAPI() {
    return new Promise((resolve, reject) => {
      window.gapi.load('auth2', async () => {
        try {
          console.log('🔑 CASIRA Google Auth: Configurando Auth2...');
          
          const authInstance = await window.gapi.auth2.init({
            client_id: this.config.clientId,
            scope: this.config.scopes.join(' '),
            cookie_policy: this.config.cookiePolicy
          });

          this.authInstance = authInstance;
          this.isInitialized = true;

          // Verificar si el usuario ya está autenticado
          if (authInstance.isSignedIn.get()) {
            const googleUser = authInstance.currentUser.get();
            await this.handleSignInSuccess(googleUser);
          }

          console.log('✅ CASIRA Google Auth: Inicialización completada');
          resolve();
        } catch (error) {
          console.error('❌ Error configurando Auth2:', error);
          reject(error);
        }
      });
    });
  }

  // ============= AUTENTICACIÓN =============
  
  async signIn() {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Auth no está inicializado');
      }

      console.log('🔐 CASIRA Google Auth: Iniciando sign in...');
      
      const googleUser = await this.authInstance.signIn({
        prompt: 'select_account'
      });
      
      return await this.handleSignInSuccess(googleUser);
    } catch (error) {
      console.error('❌ CASIRA Google Auth: Error en sign in:', error);
      throw this.handleSignInError(error);
    }
  }

  async handleSignInSuccess(googleUser) {
    try {
      const profile = googleUser.getBasicProfile();
      const authResponse = googleUser.getAuthResponse();
      
      // Crear objeto de usuario con información de Google
      const userData = {
        id: profile.getId(),
        googleId: profile.getId(),
        email: profile.getEmail(),
        first_name: profile.getGivenName(),
        last_name: profile.getFamilyName(),
        full_name: profile.getName(),
        avatar_url: profile.getImageUrl(),
        provider: 'google',
        verified: profile.isVerified(),
        access_token: authResponse.access_token,
        expires_at: new Date(Date.now() + (authResponse.expires_in * 1000)).toISOString(),
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      console.log('👤 CASIRA Google Auth: Usuario Google autenticado:', {
        id: userData.id,
        email: userData.email,
        name: userData.full_name
      });

      // Integrar con el sistema de usuarios de CASIRA
      const casiraUser = await this.integrateWithCASIRA(userData);
      
      this.currentUser = casiraUser;
      this.notifyListeners('signin', casiraUser);
      
      return casiraUser;
    } catch (error) {
      console.error('❌ Error procesando autenticación exitosa:', error);
      throw error;
    }
  }

  async integrateWithCASIRA(googleUserData) {
    try {
      console.log('🔄 CASIRA Google Auth: Integrando con sistema CASIRA...');
      
      // Verificar si el usuario ya existe en CASIRA
      const existingUsers = storageManager.get('users') || [];
      let casiraUser = existingUsers.find(user => 
        user.email === googleUserData.email || 
        (user.googleId && user.googleId === googleUserData.googleId)
      );

      if (casiraUser) {
        // Actualizar información existente con datos de Google
        const updatedUser = {
          ...casiraUser,
          ...googleUserData,
          // Mantener rol existente si ya tiene uno asignado
          role: casiraUser.role || this.assignDefaultRole(googleUserData.email),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };

        // Actualizar en storage
        storageManager.updateInArray(
          'users',
          user => user.id === casiraUser.id,
          updatedUser
        );

        console.log('🔄 CASIRA Google Auth: Usuario existente actualizado:', {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        });

        return updatedUser;
      } else {
        // Crear nuevo usuario en CASIRA
        const newUser = {
          ...googleUserData,
          role: this.assignDefaultRole(googleUserData.email),
          status: 'active',
          preferences: {
            notifications: true,
            email_updates: true,
            privacy_level: 'public'
          },
          profile: {
            bio: '',
            skills: [],
            interests: [],
            location: ''
          }
        };

        // Agregar a storage
        storageManager.push('users', newUser);

        console.log('🆕 CASIRA Google Auth: Nuevo usuario creado:', {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        });

        return newUser;
      }
    } catch (error) {
      console.error('❌ Error integrando con CASIRA:', error);
      throw error;
    }
  }

  assignDefaultRole(email) {
    // Lógica para asignar roles por defecto basado en el dominio del email
    if (email.includes('@casira.org')) {
      return 'admin';
    } else if (email.includes('@volunteer.') || email.includes('@voluntario.')) {
      return 'volunteer';
    } else if (email.includes('@donor.') || email.includes('@donante.')) {
      return 'donor';
    } else {
      return 'visitor'; // Rol por defecto
    }
  }

  async signOut() {
    try {
      if (!this.isInitialized || !this.authInstance) {
        console.log('⚠️ CASIRA Google Auth: No hay sesión activa para cerrar');
        return;
      }

      console.log('🚪 CASIRA Google Auth: Cerrando sesión...');
      
      await this.authInstance.signOut();
      
      this.currentUser = null;
      this.notifyListeners('signout', null);
      
      console.log('✅ CASIRA Google Auth: Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      throw error;
    }
  }

  // ============= GESTIÓN DE SESIÓN =============
  
  isSignedIn() {
    return !!(this.isInitialized && this.authInstance && this.authInstance.isSignedIn.get());
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async refreshToken() {
    try {
      if (!this.isSignedIn()) {
        throw new Error('Usuario no autenticado');
      }

      const googleUser = this.authInstance.currentUser.get();
      const authResponse = await googleUser.reloadAuthResponse();
      
      // Actualizar token en el usuario actual
      if (this.currentUser) {
        this.currentUser.access_token = authResponse.access_token;
        this.currentUser.expires_at = new Date(Date.now() + (authResponse.expires_in * 1000)).toISOString();
        
        // Actualizar en storage
        storageManager.updateInArray(
          'users',
          user => user.id === this.currentUser.id,
          {
            access_token: this.currentUser.access_token,
            expires_at: this.currentUser.expires_at
          }
        );
      }

      console.log('🔄 CASIRA Google Auth: Token renovado exitosamente');
      return authResponse;
    } catch (error) {
      console.error('❌ Error renovando token:', error);
      throw error;
    }
  }

  // ============= VERIFICACIÓN DE PERMISOS =============
  
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    const rolePermissions = {
      admin: ['all'],
      volunteer: ['view_activities', 'comment', 'join_activities', 'upload_photos'],
      visitor: ['view_activities', 'comment', 'join_activities'],
      donor: ['view_activities', 'comment', 'view_analytics', 'upload_photos']
    };

    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  canAccessRoute(route) {
    if (!this.currentUser) return false;
    
    const routePermissions = {
      '/admin': ['admin'],
      '/volunteer': ['volunteer', 'admin'],
      '/visitor': ['visitor', 'volunteer', 'admin', 'donor'],
      '/dashboard': ['volunteer', 'admin', 'donor']
    };

    const allowedRoles = routePermissions[route] || ['visitor', 'volunteer', 'admin', 'donor'];
    return allowedRoles.includes(this.currentUser.role);
  }

  // ============= LISTENERS =============
  
  addAuthListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.warn('⚠️ Error en auth listener:', error);
      }
    });
  }

  // ============= MANEJO DE ERRORES =============
  
  handleInitializationError(error) {
    console.error('💥 Error crítico en Google Auth:', error);
    // Continuar sin Google Auth (fallback a autenticación interna)
    this.isInitialized = false;
  }

  handleSignInError(error) {
    const errorMessages = {
      'popup_closed_by_user': 'El usuario cerró la ventana de autenticación',
      'access_denied': 'Acceso denegado por el usuario',
      'immediate_failed': 'La autenticación automática falló'
    };

    const userMessage = errorMessages[error.error] || error.message || 'Error desconocido en la autenticación';
    
    console.error('🚫 Error en autenticación Google:', userMessage);
    
    return new Error(userMessage);
  }

  // ============= UTILIDADES =============
  
  async getUserInfo() {
    if (!this.isSignedIn()) {
      return null;
    }

    try {
      const googleUser = this.authInstance.currentUser.get();
      const profile = googleUser.getBasicProfile();
      
      return {
        id: profile.getId(),
        email: profile.getEmail(),
        name: profile.getName(),
        image: profile.getImageUrl(),
        verified: profile.isVerified()
      };
    } catch (error) {
      console.error('❌ Error obteniendo información del usuario:', error);
      return null;
    }
  }

  getAuthStats() {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn(),
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        email: this.currentUser.email,
        role: this.currentUser.role,
        provider: this.currentUser.provider
      } : null,
      listenersCount: this.listeners.length
    };
  }
}

// Crear instancia global del Google Auth Manager
export const googleAuth = new GoogleAuthManager();

// Export default
export default googleAuth;