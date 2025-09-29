/**
 * AppProvider - Provider Pattern + Context API
 * Centraliza todo el estado global y providers de la aplicación
 * Reemplaza la lógica de estado dispersa en App.jsx
 */

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { appBootstrap } from '../../../shared/utils/AppBootstrap.jsx';
import { eventBus, DomainEvents } from '../../../shared/utils/EventBus.js';
import { configManager } from '../../../shared/utils/ConfigManager.js';

// ===============================================================================
// CONTEXTS
// ===============================================================================

const AppContext = createContext();
const AuthContext = createContext();
const NotificationContext = createContext();

// ===============================================================================
// REDUCERS
// ===============================================================================

/**
 * App State Reducer
 */
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'CLEAR_ERROR':
      return { ...state, error: null };
      
    case 'SET_THEME':
      return { ...state, theme: action.payload };
      
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
      
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
      
    default:
      return state;
  }
};

/**
 * Auth State Reducer
 */
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
      
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
      
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        isLoading: false
      };
      
    case 'UPDATE_USER':
      // Si payload es un objeto usuario completo, usarlo directamente
      // Si no, hacer merge con el usuario existente
      const newUser = action.payload.id ? action.payload : { ...state.user, ...action.payload };
      return { ...state, user: newUser };
      
    case 'CLEAR_AUTH_ERROR':
      return { ...state, error: null };
      
    default:
      return state;
  }
};

/**
 * Notification State Reducer
 */
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
      
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
      
    case 'CLEAR_ALL':
      return { ...state, notifications: [] };
      
    default:
      return state;
  }
};

// ===============================================================================
// INITIAL STATES
// ===============================================================================

const initialAppState = {
  isLoading: true,
  isInitialized: false,
  error: null,
  theme: 'light',
  sidebarOpen: false,
  stats: {
    activeProjects: 0,
    completedProjects: 0,
    totalUsers: 0,
    totalVolunteers: 0
  }
};

const initialAuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null,
  error: null
};

const initialNotificationState = {
  notifications: []
};

// ===============================================================================
// PROVIDER COMPONENTS
// ===============================================================================

/**
 * Auth Provider - Maneja autenticación
 */
export function AuthProvider({ children }) {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [loginUseCase, setLoginUseCase] = useState(null);

  // Función para inicializar el servicio de tiempo real
  const initializeRealtimeService = async (user) => {
    try {
      console.log('🔄 AuthProvider: Inicializando servicio de tiempo real para:', user?.email);

      if (!user || !user.email) {
        console.warn('⚠️ AuthProvider: No se puede inicializar servicio sin usuario válido');
        return;
      }

      // USAR SOLO EL SERVICIO REALTIME PRINCIPAL
      try {
        const realtimeService = await import('../../../lib/services/realtime-role-change.service.js');
        await realtimeService.default.initialize(user);
        console.log('✅ AuthProvider: Servicio realtime inicializado exitosamente');
      } catch (realtimeError) {
        console.error('❌ AuthProvider: Error inicializando servicio realtime:', realtimeError);
      }

      console.log('✅ AuthProvider: Servicio de tiempo real inicializado exitosamente');

    } catch (error) {
      console.warn('⚠️ AuthProvider: Error inicializando servicio de tiempo real:', error);
    }
  };

  // Inicializar caso de uso de login
  useEffect(() => {
    const initLoginUseCase = async () => {
      try {
        await appBootstrap.initialize();
        const useCase = appBootstrap.getService('loginUserUseCase');
        setLoginUseCase(useCase);
      } catch (error) {
        console.error('Error initializing login use case:', error);
      }
    };

    initLoginUseCase();
  }, []);

  // Verificar sesión existente al cargar
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Verificar localStorage
        const savedUser = localStorage.getItem('casira-current-user');
        const savedToken = localStorage.getItem('casira-token');

        if (savedUser && savedToken && loginUseCase) {
          const userData = JSON.parse(savedUser);

          // Manejar tokens de Google reales de manera especial
          if (savedToken.startsWith('google-auth-token-')) {
            console.log('🔄 Restaurando sesión Google real...');

            authDispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userData,
                token: savedToken
              }
            });

            // Emitir evento de login
            eventBus.emit(DomainEvents.USER_LOGGED_IN, {
              user: userData,
              method: 'google'
            });

            // Inicializar servicio de tiempo real
            await initializeRealtimeService(userData);
          } else {
            // Verificar tokens CASIRA normales
            const result = await loginUseCase.verifyExistingToken(savedToken);

            if (result.success) {
              authDispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user: result.user,
                  token: result.token
                }
              });

              // Emitir evento de login
              eventBus.emit(DomainEvents.USER_LOGGED_IN, {
                user: result.user,
                method: 'session_restore'
              });

              // Inicializar servicio de tiempo real
              await initializeRealtimeService(result.user);
            } else {
              // Token inválido, limpiar
              localStorage.removeItem('casira-current-user');
              localStorage.removeItem('casira-token');
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
      }
    };

    if (loginUseCase) {
      checkExistingSession();
    }
  }, [loginUseCase]);

  // Listener para cambios de rol en tiempo real - SOLO ACTUALIZAR USUARIO, NO MODAL
  useEffect(() => {
    const handleRoleChange = (event) => {
      const { userEmail, oldRole, newRole } = event.detail;

      console.log('🔄 AuthProvider: Evento role-changed recibido:', { userEmail, oldRole, newRole });
      console.log('🔄 AuthProvider: Usuario actual:', authState.user?.email);

      // Solo actualizar si es el usuario actual
      if (authState.user && authState.user.email === userEmail) {
        console.log(`✅ AuthProvider: Aplicando cambio de rol para ${userEmail}: ${oldRole} → ${newRole}`);

        // Crear objeto usuario completamente actualizado
        const updatedUser = {
          ...authState.user,
          role: newRole,
          // Actualizar métodos de rol también
          isAdmin: () => newRole === 'admin',
          isVolunteer: () => newRole === 'volunteer',
          isVisitor: () => newRole === 'visitor'
        };

        console.log('🔄 AuthProvider: Usuario actualizado:', updatedUser);

        // Actualizar el usuario en el estado de autenticación inmediatamente
        authDispatch({
          type: 'UPDATE_USER',
          payload: updatedUser
        });

        // Actualizar localStorage con el objeto completo
        const savedUser = localStorage.getItem('casira-current-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.role = newRole;
          localStorage.setItem('casira-current-user', JSON.stringify(userData));
          console.log('✅ AuthProvider: localStorage actualizado con nuevo rol:', newRole);
        }

        console.log(`✅ AuthProvider: Usuario y localStorage actualizados. Modal será manejado por GlobalRoleChangeModal`);
      }
    };

    // Solo escuchar role-changed para actualizar usuario, no para modal
    window.addEventListener('role-changed', handleRoleChange);

    return () => {
      window.removeEventListener('role-changed', handleRoleChange);
    };
  }, [authState.user]);

  /**
   * Login con credenciales CASIRA - CONECTADO AL BACKEND REAL
   */
  const loginWithCasira = async (email, password) => {
    authDispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 AppProvider: Iniciando login CASIRA con backend real');

      // Llamar al backend real - EXACTAMENTE como Google OAuth
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Backend error:', data);
        authDispatch({
          type: 'LOGIN_FAILURE',
          payload: data.message || data.error || 'Error de autenticación'
        });
        return {
          success: false,
          message: data.message || data.error || 'Error de autenticación'
        };
      }

      if (data.success && data.user) {
        console.log('✅ AppProvider: Login exitoso desde backend:', data.user);

        // Preparar usuario EXACTAMENTE como Google OAuth
        const user = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          fullName: data.user.fullName || `${data.user.first_name} ${data.user.last_name}`,
          role: data.user.role,
          bio: data.user.bio || '',
          avatar_url: data.user.avatar_url || '',
          created_at: data.user.created_at,
          last_login: data.user.last_login,
          auth_provider: 'casira',
          isAdmin: () => data.user.role === 'admin',
          isVolunteer: () => data.user.role === 'volunteer',
          isVisitor: () => data.user.role === 'visitor'
        };

        const result = {
          success: true,
          user: user,
          token: data.token,
          message: data.message
        };

        // Guardar en localStorage - EXACTAMENTE como Google OAuth
        localStorage.setItem('casira-current-user', JSON.stringify(result.user));
        localStorage.setItem('casira-token', result.token);

        authDispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token
          }
        });

        // Emitir evento de login - EXACTAMENTE como Google OAuth
        eventBus.emit(DomainEvents.USER_LOGGED_IN, {
          user: result.user,
          method: 'casira'
        });

        // Inicializar servicio de tiempo real - EXACTAMENTE como Google OAuth
        await initializeRealtimeService(result.user);

        console.log('✅ AppProvider: Estado actualizado, login completo');
        return result;
      } else {
        console.error('❌ Invalid response format:', data);
        authDispatch({
          type: 'LOGIN_FAILURE',
          payload: 'Respuesta inválida del servidor'
        });
        return {
          success: false,
          message: 'Respuesta inválida del servidor'
        };
      }
    } catch (error) {
      console.error('❌ AppProvider: Error en loginWithCasira:', error);
      authDispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Error de conexión con el servidor'
      });
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  };

  /**
   * Registro con credenciales CASIRA - CONECTADO AL BACKEND REAL
   */
  const registerWithCasira = async (userData) => {
    authDispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 AppProvider: Iniciando registro CASIRA con backend real');

      // Llamar al backend real - EXACTAMENTE como loginWithCasira
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Backend error:', data);
        authDispatch({
          type: 'LOGIN_FAILURE',
          payload: data.message || data.error || 'Error de registro'
        });
        return {
          success: false,
          message: data.message || data.error || 'Error de registro'
        };
      }

      if (data.success && data.user) {
        console.log('✅ AppProvider: Registro exitoso desde backend:', data.user);

        // Preparar usuario EXACTAMENTE como loginWithCasira
        const user = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          fullName: data.user.fullName || `${data.user.first_name} ${data.user.last_name}`,
          role: data.user.role,
          bio: data.user.bio || '',
          avatar_url: data.user.avatar_url || '',
          created_at: data.user.created_at,
          last_login: data.user.last_login,
          auth_provider: 'casira',
          isAdmin: () => data.user.role === 'admin',
          isVolunteer: () => data.user.role === 'volunteer',
          isVisitor: () => data.user.role === 'visitor'
        };

        const result = {
          success: true,
          user: user,
          token: data.token,
          message: data.message
        };

        // Guardar en localStorage - EXACTAMENTE como loginWithCasira
        localStorage.setItem('casira-current-user', JSON.stringify(result.user));
        localStorage.setItem('casira-token', result.token);

        authDispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token
          }
        });

        // Emitir evento de login - EXACTAMENTE como loginWithCasira
        eventBus.emit(DomainEvents.USER_LOGGED_IN, {
          user: result.user,
          method: 'casira'
        });

        // Inicializar servicio de tiempo real - EXACTAMENTE como loginWithCasira
        await initializeRealtimeService(result.user);

        console.log('✅ AppProvider: Usuario registrado y logueado automáticamente');
        return result;
      } else {
        console.error('❌ Invalid registration response:', data);
        authDispatch({
          type: 'LOGIN_FAILURE',
          payload: 'Respuesta inválida del servidor'
        });
        return {
          success: false,
          message: 'Respuesta inválida del servidor'
        };
      }
    } catch (error) {
      console.error('❌ AppProvider: Error en registerWithCasira:', error);
      authDispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Error de conexión con el servidor'
      });
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  };

  /**
   * Login con Google - Usa el servicio unificado directamente
   */
  const loginWithGoogle = async () => {
    authDispatch({ type: 'LOGIN_START' });

    try {
      // Importar el servicio unificado de Google Auth
      const { default: unifiedGoogleAuth } = await import('../../../lib/services/unified-google-auth.service.js');

      // Usar el servicio unificado que maneja todo internamente
      const user = await unifiedGoogleAuth.signIn();

      if (user) {
        const result = {
          success: true,
          user: user,
          token: 'google-auth-token-' + Date.now(),
          message: `¡Bienvenido ${user.first_name}!`
        };

        // Guardar en localStorage
        localStorage.setItem('casira-current-user', JSON.stringify(result.user));
        localStorage.setItem('casira-token', result.token);

        authDispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token
          }
        });

        // Emitir evento de login
        eventBus.emit(DomainEvents.USER_LOGGED_IN, {
          user: result.user,
          method: 'google'
        });

        // Inicializar servicio de tiempo real
        await initializeRealtimeService(result.user);

        return result;
      } else {
        const errorMsg = 'Error de autenticación con Google';
        authDispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMsg
        });
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('❌ Error en loginWithGoogle:', error);
      authDispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      // Limpiar servicios de notificación
      try {
        const broadcastService = await import('../../../lib/services/broadcast-role-change.service.js');
        await broadcastService.default.cleanup();
        console.log('✅ AuthProvider: Servicio de broadcast limpiado');
      } catch (error) {
        console.warn('⚠️ AuthProvider: Error limpiando broadcast service:', error);
      }

      try {
        const simpleService = await import('../../../lib/services/simple-role-notification.service.js');
        simpleService.default.cleanup();
        console.log('✅ AuthProvider: Servicio simple limpiado');
      } catch (error) {
        console.warn('⚠️ AuthProvider: Error limpiando simple service:', error);
      }

      // Limpiar almacenamiento
      localStorage.removeItem('casira-current-user');
      localStorage.removeItem('casira-token');
      sessionStorage.removeItem('casira-current-user');

      // Actualizar estado
      authDispatch({ type: 'LOGOUT' });

      // Emitir evento de logout
      eventBus.emit(DomainEvents.USER_LOGGED_OUT, {
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  /**
   * Actualizar perfil de usuario
   */
  const updateUserProfile = (updates) => {
    authDispatch({
      type: 'UPDATE_USER',
      payload: updates
    });

    // Actualizar localStorage
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      localStorage.setItem('casira-current-user', JSON.stringify(updatedUser));
    }

    // Emitir evento de actualización
    eventBus.emit(DomainEvents.USER_PROFILE_UPDATED, {
      updates,
      user: { ...authState.user, ...updates }
    });
  };

  /**
   * Obtener ruta de redirección basada en el rol
   */
  const getRedirectRoute = () => {
    if (!authState.user) return '/';
    return loginUseCase?.getRedirectRoute(authState.user) || '/dashboard';
  };

  const authContextValue = {
    ...authState,
    loginWithCasira,
    loginWithGoogle,
    registerWithCasira,
    logout,
    updateUserProfile,
    getRedirectRoute,
    clearError: () => authDispatch({ type: 'CLEAR_AUTH_ERROR' })
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Notification Provider - Maneja notificaciones
 */
export function NotificationProvider({ children }) {
  const [notificationState, notificationDispatch] = useReducer(
    notificationReducer,
    initialNotificationState
  );

  // Listener para eventos que generan notificaciones
  useEffect(() => {
    const unsubscribers = [
      // Notificación de login exitoso
      eventBus.on(DomainEvents.USER_LOGGED_IN, (eventData) => {
        const user = eventData.data.user;
        const method = eventData.data.method;
        const isAdmin = user?.role === 'admin';
        const isGoogle = method === 'google';

        let title, message;

        if (isGoogle && isAdmin) {
          title = '🔑 ¡Acceso Administrativo!';
          message = `Hola ${user.first_name || user.firstName || 'Administrador'}, has iniciado sesión con Google. Panel de administración disponible.`;
        } else if (isGoogle) {
          title = '✨ ¡Autenticado con Google!';
          message = `Bienvenido ${user.first_name || user.firstName || 'Usuario'}. Tu cuenta ha sido sincronizada exitosamente.`;
        } else if (isAdmin) {
          title = '🔑 ¡Bienvenido Administrador!';
          message = `Hola ${user.firstName || user.first_name || 'Administrador'}`;
        } else {
          title = '¡Bienvenido!';
          message = `Hola ${user.firstName || user.first_name || 'Usuario'}`;
        }

        addNotification({
          type: 'success',
          title,
          message,
          autoClose: true,
          duration: isAdmin ? 8000 : 5000 // Admins ven la notificación más tiempo
        });
      }),

      // Notificación de error
      eventBus.on(DomainEvents.ERROR_OCCURRED, (eventData) => {
        addNotification({
          type: 'error',
          title: 'Error',
          message: eventData.data.error || 'Ha ocurrido un error',
          autoClose: false
        });
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  /**
   * Agregar notificación
   */
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      autoClose: true,
      duration: 5000,
      ...notification
    };

    notificationDispatch({
      type: 'ADD_NOTIFICATION',
      payload: newNotification
    });

    // Auto-remove si está configurado
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  };

  /**
   * Remover notificación
   */
  const removeNotification = (id) => {
    notificationDispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: id
    });
  };

  /**
   * Marcar como leída
   */
  const markAsRead = (id) => {
    notificationDispatch({
      type: 'MARK_AS_READ',
      payload: id
    });
  };

  /**
   * Limpiar todas las notificaciones
   */
  const clearAll = () => {
    notificationDispatch({ type: 'CLEAR_ALL' });
  };

  const notificationContextValue = {
    ...notificationState,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={notificationContextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Main App Provider - Combina todos los providers
 */
export function AppProvider({ children }) {
  const [appState, appDispatch] = useReducer(appReducer, initialAppState);

  // Inicializar aplicación
  useEffect(() => {
    const initializeApp = async () => {
      try {
        appDispatch({ type: 'SET_LOADING', payload: true });

        // Inicializar bootstrap
        await appBootstrap.initialize();

        // Configurar tema inicial
        const savedTheme = localStorage.getItem('casira-theme') || 'light';
        appDispatch({ type: 'SET_THEME', payload: savedTheme });

        appDispatch({ type: 'SET_INITIALIZED', payload: true });
        appDispatch({ type: 'SET_LOADING', payload: false });

      } catch (error) {
        console.error('App initialization failed:', error);
        appDispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    initializeApp();
  }, []);

  /**
   * Cambiar tema
   */
  const setTheme = (theme) => {
    appDispatch({ type: 'SET_THEME', payload: theme });
    localStorage.setItem('casira-theme', theme);
    
    // Aplicar tema al documento
    document.documentElement.className = theme;
  };

  /**
   * Toggle sidebar
   */
  const toggleSidebar = () => {
    appDispatch({ 
      type: 'SET_SIDEBAR_OPEN', 
      payload: !appState.sidebarOpen 
    });
  };

  /**
   * Actualizar estadísticas
   */
  const updateStats = useCallback((newStats) => {
    appDispatch({ type: 'UPDATE_STATS', payload: newStats });
  }, [appDispatch]);

  /**
   * Limpiar error
   */
  const clearError = () => {
    appDispatch({ type: 'CLEAR_ERROR' });
  };

  const appContextValue = {
    ...appState,
    setTheme,
    toggleSidebar,
    updateStats,
    clearError,
    isReady: appBootstrap.isReady()
  };

  // Mostrar loading mientras se inicializa
  if (appState.isLoading && !appState.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando CASIRA Connect...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si la inicialización falló
  if (appState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error de Inicialización</div>
          <p className="text-gray-600 mb-4">{appState.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={appContextValue}>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
}

// ===============================================================================
// CUSTOM HOOKS
// ===============================================================================

/**
 * Hook para usar el contexto de la app
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook para usar el contexto de notificaciones
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Hook combinado para datos del dashboard
 */
export function useDashboard() {
  const { user } = useAuth();
  const { updateStats } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset initialization flag when user changes
  useEffect(() => {
    setHasInitialized(false);
  }, [user]);

  useEffect(() => {
    // Avoid infinite loops by only loading once per user change
    if (hasInitialized) return;

    const loadDashboardData = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Dashboard loading timeout, using fallback');
        setError('Dashboard loading timeout');
        setIsLoading(false);
        setHasInitialized(true); // Prevent further retries
      }, 10000); // 10 second timeout

      try {
        setIsLoading(true);

        // Wait for app bootstrap to be ready before getting services
        if (!appBootstrap.isReady()) {
          console.log('⏳ App bootstrap not ready, waiting...');
          await appBootstrap.initialize();
        }

        const getDashboardDataUseCase = appBootstrap.getService('getDashboardDataUseCase');

        if (!getDashboardDataUseCase) {
          console.error('❌ getDashboardDataUseCase service not found');
          setError('Dashboard service not available');
          setHasInitialized(true); // Prevent further retries
          clearTimeout(timeoutId);
          return;
        }

        let result;
        if (user) {
          if (user.isAdmin()) {
            result = await getDashboardDataUseCase.executeForAdmin(user);
          } else {
            result = await getDashboardDataUseCase.executeForUser(user);
          }
        } else {
          result = await getDashboardDataUseCase.executeForLanding();
        }

        if (result.success) {
          setDashboardData(result);
          updateStats(result.stats);
          setError(null);
        } else {
          setError(result.message);
        }

        setHasInitialized(true); // Mark as initialized regardless of success/failure
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('❌ Error loading dashboard data:', err);
        setError(err.message || 'Error loading dashboard data');
        setHasInitialized(true); // Prevent further retries even on error
        clearTimeout(timeoutId);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [hasInitialized, updateStats]);

  return { dashboardData, isLoading, error };
}

export default AppProvider;