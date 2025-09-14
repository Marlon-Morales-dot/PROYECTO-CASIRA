// ============= UNIFIED GOOGLE AUTH SERVICE - CASIRA =============
// Solución consolidada que combina lo mejor de los sistemas existentes
// y elimina conflictos de COOP y CSP

class UnifiedGoogleAuthService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.listeners = [];
    this.initPromise = null;
    
    // Configuración unificada - usa un solo Client ID válido
    this.config = {
      clientId: '245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com',
      scopes: 'profile email',
      cookiePolicy: 'single_host_origin'
    };

    console.log('🔧 Unified Google Auth: Inicializando...');
    this.initialize();
  }

  // ============= INICIALIZACIÓN MEJORADA =============
  async initialize() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initializeAuth();
    return this.initPromise;
  }

  async _initializeAuth() {
    try {
      console.log('🚀 Unified Google Auth: Comenzando inicialización...');

      // Método 1: Intentar Google Identity Services (Nueva API)
      console.log('🔄 Intentando Google Identity Services...');
      try {
        await this._loadGoogleIdentityServices();
        await this._setupGoogleIdentity();
        this.authMethod = 'identity';
        console.log('✅ Google Identity Services inicializado');
        return true;
      } catch (identityError) {
        console.warn('⚠️ Google Identity Services falló:', identityError.message);
      }

      // Método 2: Fallback a gapi.auth2 clásico
      console.log('🔄 Fallback: Intentando gapi.auth2 clásico...');
      try {
        await this._loadGoogleAPI();
        await this._setupGoogleAuth2();
        this.authMethod = 'gapi';
        console.log('✅ Google Auth2 inicializado como fallback');
        return true;
      } catch (gapiError) {
        console.warn('⚠️ Google Auth2 falló:', gapiError.message);
      }

      // Método 3: Modo offline - continuar sin Google Auth
      console.log('🔄 Modo offline: Google Auth no disponible');
      this.authMethod = 'offline';
      this.isInitialized = true;
      return false;

    } catch (error) {
      console.error('❌ Error crítico inicializando Google Auth:', error);
      this.authMethod = 'offline';
      this.isInitialized = true;
      return false;
    }
  }

  // ============= GOOGLE IDENTITY SERVICES (NUEVA API) =============
  async _loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Google Identity Services no se pudo cargar'));
      
      document.head.appendChild(script);
    });
  }

  async _setupGoogleIdentity() {
    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: this._handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          // Configuración mejorada para evitar COOP issues
          use_fedcm_for_prompt: false
        });

        // Configurar One Tap como método principal (sin popup)
        this.useOneTap = true;

        this.isInitialized = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============= GOOGLE AUTH2 FALLBACK =============
  async _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error('Google API no se pudo cargar'));
      
      document.head.appendChild(script);
    });
  }

  async _setupGoogleAuth2() {
    return new Promise((resolve, reject) => {
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: this.config.clientId,
          scope: this.config.scopes,
          cookie_policy: this.config.cookiePolicy
        }).then(() => {
          this.authInstance = window.gapi.auth2.getAuthInstance();
          this.isInitialized = true;

          // Verificar si ya está autenticado
          if (this.authInstance.isSignedIn.get()) {
            const googleUser = this.authInstance.currentUser.get();
            this._processGoogleUser(googleUser, 'gapi');
          }

          resolve();
        }).catch(reject);
      });
    });
  }

  // ============= MÉTODOS DE AUTENTICACIÓN UNIFICADOS =============
  async signIn() {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        throw new Error('Google Auth no disponible. Usa el login tradicional.');
      }

      console.log(`🔐 Iniciando sign-in con método: ${this.authMethod}`);

      switch (this.authMethod) {
        case 'identity':
          return await this._signInWithIdentity();
        
        case 'gapi':
          return await this._signInWithGapi();
        
        default:
          throw new Error('Método de autenticación no disponible');
      }
    } catch (error) {
      console.error('❌ Error en sign-in:', error);
      throw this._createUserFriendlyError(error);
    }
  }

  async _signInWithIdentity() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔐 Usando Google Identity Services con OAuth2 popup...');

        // Crear cliente OAuth2 para evitar problemas de CSP con iframe
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: 'profile email openid',
          callback: async (tokenResponse) => {
            try {
              console.log('✅ Token OAuth2 recibido:', tokenResponse);

              if (tokenResponse.error) {
                throw new Error(tokenResponse.error);
              }

              const casiraUser = await this._handleTokenResponse(tokenResponse);
              resolve(casiraUser);
            } catch (error) {
              console.error('❌ Error procesando token OAuth2:', error);
              reject(error);
            }
          },
          error_callback: (error) => {
            console.error('❌ Error en callback OAuth2:', error);
            reject(new Error('Error en autenticación OAuth2: ' + error.type));
          }
        });

        // Solicitar token con popup
        client.requestAccessToken({
          prompt: 'consent',
          hint: null
        });

      } catch (error) {
        console.error('❌ Error en _signInWithIdentity:', error);
        reject(error);
      }
    });
  }

  async _signInWithGapi() {
    try {
      const googleUser = await this.authInstance.signIn({
        prompt: 'select_account'
      });
      return await this._processGoogleUser(googleUser, 'gapi');
    } catch (error) {
      throw error;
    }
  }

  // ============= PROCESAMIENTO DE USUARIO =============
  async _fetchUserInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Error obteniendo información del usuario');
    }

    return await response.json();
  }

  async _processGoogleUser(googleUser, method) {
    try {
      let userInfo;

      if (method === 'identity') {
        // Ya tenemos userInfo directamente
        userInfo = googleUser;
      } else if (method === 'gapi') {
        // Extraer de gapi response
        const profile = googleUser.getBasicProfile();
        userInfo = {
          id: profile.getId(),
          email: profile.getEmail(),
          given_name: profile.getGivenName(),
          family_name: profile.getFamilyName(),
          name: profile.getName(),
          picture: profile.getImageUrl(),
          verified_email: true
        };
      }

      // Crear objeto usuario estandarizado
      const userData = {
        id: userInfo.id,
        email: userInfo.email,
        first_name: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Usuario',
        last_name: userInfo.family_name || userInfo.name?.split(' ')[1] || 'Google',
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
        provider: 'google',
        role: this._assignRole(userInfo.email),
        verified_email: userInfo.verified_email,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      console.log('👤 Usuario Google procesado:', {
        email: userData.email,
        role: userData.role,
        method
      });

      // Guardar usuario en dataStore local usando el storageManager correcto
      try {
        // Importar storageManager
        const { storageManager } = await import('../storage-manager.js');
        const existingUsers = storageManager.get('users') || [];
        const userExists = existingUsers.find(u => u.email === userData.email);
        
        if (!userExists) {
          existingUsers.push(userData);
          storageManager.set('users', existingUsers);
          console.log('💾 Usuario Google agregado al storageManager:', userData.email);
        } else {
          // Actualizar último login
          const userIndex = existingUsers.findIndex(u => u.email === userData.email);
          existingUsers[userIndex] = { ...existingUsers[userIndex], ...userData };
          storageManager.set('users', existingUsers);
          console.log('🔄 Usuario Google actualizado:', userData.email);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo guardar usuario Google en storageManager:', error);
        console.warn('📋 Fallback a localStorage directo');
        // Fallback directo
        try {
          const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
          const existingUsers = casiraData.users || [];
          const userExists = existingUsers.find(u => u.email === userData.email);
          
          if (!userExists) {
            existingUsers.push(userData);
            casiraData.users = existingUsers;
            localStorage.setItem('casira-data-v2', JSON.stringify(casiraData));
          }
        } catch (fallbackError) {
          console.error('❌ Error en fallback de storage:', fallbackError);
        }
      }

      // ============= SYNC OBLIGATORIO CON SUPABASE =============
      try {
        console.log('🔄 CASIRA: Sincronizando usuario Google con Supabase...');
        
        // Importar supabaseAPI
        const { supabaseAPI } = await import('../supabase-api.js');
        
        // Verificar si el usuario ya existe en Supabase
        let existingUser = null;
        try {
          existingUser = await supabaseAPI.users.getUserByEmail(userData.email);
        } catch (error) {
          console.log('📧 Usuario no existe aún en Supabase, se creará...');
        }
        
        if (!existingUser) {
          // Crear nuevo usuario en Supabase - OBLIGATORIO
          console.log('👤 Creando nuevo usuario Google en Supabase...');
          const supabaseUser = await supabaseAPI.users.createUser({
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            bio: `Usuario registrado vía Google Auth - ${new Date().toLocaleDateString()}`,
            avatar_url: userData.avatar_url
          });
          
          if (!supabaseUser || !supabaseUser.id) {
            throw new Error('No se pudo crear usuario en Supabase');
          }
          
          console.log('✅ CASIRA: Usuario Google creado en Supabase:', supabaseUser.id);
          
          // Actualizar userData con el ID de Supabase
          userData.supabase_id = supabaseUser.id;
          
          // Crear notificación de bienvenida en Supabase
          try {
            const { supabase } = await import('../supabase-client.js');

            // Notificación específica según el rol asignado
            const isAdmin = userData.role === 'admin';
            const welcomeMessage = isAdmin
              ? `¡Hola ${userData.first_name}! Has sido autenticado como administrador. Tienes acceso completo al panel de administración para gestionar usuarios, actividades y notificaciones.`
              : `Hola ${userData.first_name}, gracias por unirte a nuestra comunidad. Explora las actividades disponibles y comienza a hacer la diferencia.`;

            const welcomeTitle = isAdmin
              ? '🔑 ¡Bienvenido Administrador!'
              : '🎉 ¡Bienvenido a CASIRA!';

            await supabase
              .from('notifications')
              .insert({
                user_id: supabaseUser.id,
                type: isAdmin ? 'admin_welcome' : 'welcome',
                title: welcomeTitle,
                message: welcomeMessage,
                data: JSON.stringify({
                  welcome: true,
                  provider: 'google',
                  role: userData.role,
                  admin_access: isAdmin
                })
              });
            console.log('🔔 Notificación de bienvenida creada para usuario Google:', { role: userData.role, isAdmin });
          } catch (notifError) {
            console.warn('⚠️ Error creando notificación de bienvenida:', notifError);
          }
          
        } else {
          // Actualizar usuario existente en Supabase - OBLIGATORIO
          console.log('🔄 Actualizando usuario Google existente en Supabase...');
          const updatedUser = await supabaseAPI.users.updateUser(existingUser.id, {
            avatar_url: userData.avatar_url,
            first_name: userData.first_name,
            last_name: userData.last_name
            // Removido updated_at porque no existe en la tabla
          });
          
          if (!updatedUser) {
            console.warn('⚠️ No se pudo actualizar usuario, usando datos existentes');
          } else {
            console.log('✅ CASIRA: Usuario Google actualizado en Supabase:', updatedUser.id);
          }
          
          // Actualizar userData con el ID de Supabase
          userData.supabase_id = existingUser.id;
          userData.role = existingUser.role || userData.role; // Mantener rol existente
        }
        
        console.log('🎉 CASIRA: Sincronización con Supabase OBLIGATORIA completada');
        
      } catch (supabaseError) {
        console.error('❌ CASIRA: Error sincronizando con Supabase (continuando sin sync):', supabaseError);
        // No fallar el login, solo continuar sin sincronización
        console.log('⚠️ CASIRA: Continuando con datos locales únicamente');
      }

      this.currentUser = userData;
      this._notifyListeners('signin', userData);

      return userData;
    } catch (error) {
      console.error('❌ Error procesando usuario Google:', error);
      throw error;
    }
  }

  _assignRole(email) {
    // Solo admin@casira.org es admin automáticamente
    if (email === 'admin@casira.org') return 'admin';
    return 'visitor'; // Todos los demás son visitors
  }

  // ============= MANEJO DE RESPONSES =============
  async _handleCredentialResponse(credential) {
    try {
      console.log('🔐 Procesando credential response...');
      const userInfo = this._parseJWT(credential.credential);
      const user = await this._processGoogleUser(userInfo, 'identity');
      return user;
    } catch (error) {
      console.error('❌ Error en credential response:', error);
    }
  }

  async _handleTokenResponse(tokenResponse) {
    try {
      console.log('🔐 Procesando token response...');
      if (tokenResponse.error) {
        throw new Error(tokenResponse.error);
      }
      
      const userInfo = await this._fetchUserInfo(tokenResponse.access_token);
      const user = await this._processGoogleUser(userInfo, 'identity');
      return user;
    } catch (error) {
      console.error('❌ Error en token response:', error);
      throw error;
    }
  }

  _parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Token JWT inválido');
    }
  }

  // ============= SIGN OUT =============
  async signOut() {
    try {
      if (this.authMethod === 'identity' && window.google?.accounts) {
        window.google.accounts.id.disableAutoSelect();
      } else if (this.authMethod === 'gapi' && this.authInstance) {
        await this.authInstance.signOut();
      }

      this.currentUser = null;
      this._notifyListeners('signout', null);
      console.log('🚪 Sign out completado');
    } catch (error) {
      console.error('❌ Error en sign out:', error);
    }
  }

  // ============= UTILIDADES =============
  isSignedIn() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  addAuthListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.warn('⚠️ Error en listener:', error);
      }
    });
  }

  _createUserFriendlyError(error) {
    const errorMessages = {
      'popup_closed_by_user': 'Ventana de Google cerrada. Intenta de nuevo.',
      'access_denied': 'Acceso denegado por el usuario.',
      'network_error': 'Error de conexión. Verifica tu internet.',
      'invalid_client': 'Error de configuración. Contacta al administrador.'
    };

    const message = errorMessages[error.error] || 
                   errorMessages[error.message] || 
                   'Error de autenticación. Usa el login tradicional.';

    return new Error(message);
  }

  // ============= MÉTODOS DE DEBUG =============
  getStatus() {
    return {
      initialized: this.isInitialized,
      method: this.authMethod,
      signedIn: this.isSignedIn(),
      user: this.currentUser ? {
        email: this.currentUser.email,
        role: this.currentUser.role
      } : null
    };
  }
}

// Singleton instance
const unifiedGoogleAuth = new UnifiedGoogleAuthService();

export default unifiedGoogleAuth;
export { UnifiedGoogleAuthService };