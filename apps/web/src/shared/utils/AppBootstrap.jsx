/**
 * AppBootstrap - Factory Pattern + Builder Pattern
 * Centraliza la inicialización de toda la aplicación
 * Reemplaza la configuración dispersa de App.jsx
 */

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { container, createFactory } from './DependencyContainer.js';
import { configManager } from './ConfigManager.js';
import { eventBus, DomainEvents } from './EventBus.js';
import { CacheStrategyFactory } from '../../infrastructure/storage/CacheStrategies.js';
import CachedRepository from '../../infrastructure/storage/CachedRepository.js';

// Importar repositorios y casos de uso
import SupabaseUserRepository from '../../infrastructure/api/SupabaseUserRepository.js';
import SupabaseActivityRepository from '../../infrastructure/api/SupabaseActivityRepository.js';
import UnifiedAuthRepository from '../../infrastructure/api/UnifiedAuthRepository.js';
import LoginUser from '../../application/usecases/LoginUser.js';
import GetDashboardData from '../../application/usecases/GetDashboardData.js';

/**
 * Application Bootstrap Factory
 * Patrón: Abstract Factory + Builder + Facade
 */
export class AppBootstrap {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.services = new Map();
  }

  /**
   * Inicializar aplicación completa
   * @returns {Promise<Object>} Servicios inicializados
   */
  async initialize() {
    if (this.isInitialized) {
      return this.services;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Realizar inicialización paso a paso
   */
  async performInitialization() {
    try {
      console.log('🚀 [AppBootstrap] Starting application initialization...');

      // 1. Inicializar configuración
      await this.initializeConfiguration();

      // 2. Configurar clientes externos
      await this.initializeExternalClients();

      // 3. Configurar cache
      await this.initializeCache();

      // 4. Registrar repositorios
      await this.registerRepositories();

      // 5. Registrar casos de uso
      await this.registerUseCases();

      // 6. Configurar event bus
      await this.configureEventBus();

      // 7. Configurar error handling
      await this.configureErrorHandling();

      this.isInitialized = true;
      console.log('✅ [AppBootstrap] Application initialized successfully');

      // Emitir evento de inicialización completa
      eventBus.emit('app.initialized', {
        services: Array.from(this.services.keys()),
        timestamp: new Date()
      });

      return this.services;

    } catch (error) {
      console.error('❌ [AppBootstrap] Initialization failed:', error);
      
      // Emitir evento de error
      eventBus.emit(DomainEvents.ERROR_OCCURRED, {
        type: 'INITIALIZATION_ERROR',
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Obtener servicio del container
   * @param {string} name - Nombre del servicio
   * @returns {*} Instancia del servicio
   */
  getService(name) {
    if (!this.isInitialized) {
      console.warn(`[AppBootstrap] Getting service '${name}' before initialization`);
    }

    return container.resolve(name);
  }

  /**
   * Verificar si la app está inicializada
   * @returns {boolean} True si está inicializada
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Reinicializar aplicación
   */
  async reinitialize() {
    console.log('🔄 [AppBootstrap] Reinitializing application...');
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Limpiar container
    container.clear();
    
    // Limpiar event bus
    eventBus.clear();
    
    // Recargar configuración
    await configManager.reload();
    
    // Inicializar de nuevo
    return this.initialize();
  }

  // ===============================================================================
  // MÉTODOS PRIVADOS DE INICIALIZACIÓN
  // ===============================================================================

  /**
   * Inicializar configuración
   */
  async initializeConfiguration() {
    console.log('⚙️ [AppBootstrap] Initializing configuration...');
    
    await configManager.initialize();
    
    // Registrar config manager en el container
    container.registerInstance('configManager', configManager);
    
    this.services.set('configManager', configManager);
  }

  /**
   * Inicializar clientes externos (Supabase, etc.)
   */
  async initializeExternalClients() {
    console.log('🔌 [AppBootstrap] Initializing external clients...');
    
    // Crear cliente de Supabase
    const supabaseUrl = configManager.get('supabase.url');
    const supabaseKey = configManager.get('supabase.anonKey');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Registrar en container
    container.registerInstance('supabaseClient', supabaseClient);
    
    // Crear localStorage adapter
    const localStorageAdapter = {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
      clear: () => localStorage.clear()
    };
    
    container.registerInstance('localStorageAdapter', localStorageAdapter);
    
    this.services.set('supabaseClient', supabaseClient);
    this.services.set('localStorageAdapter', localStorageAdapter);
  }

  /**
   * Inicializar sistema de cache
   */
  async initializeCache() {
    console.log('💾 [AppBootstrap] Initializing cache system...');
    
    const cacheStrategy = configManager.get('cache.strategy', 'multiLevel');
    const cacheTtl = configManager.get('cache.ttl', 300000);
    const cacheMaxSize = configManager.get('cache.maxSize', 1000);
    
    const cacheInstance = CacheStrategyFactory.create(cacheStrategy, {
      defaultTtl: cacheTtl,
      maxSize: cacheMaxSize,
      prefix: 'casira'
    });
    
    container.registerInstance('cacheStrategy', cacheInstance);
    
    this.services.set('cacheStrategy', cacheInstance);
  }

  /**
   * Registrar repositorios en el container
   */
  async registerRepositories() {
    console.log('🗄️ [AppBootstrap] Registering repositories...');
    
    // UserRepository
    container.registerSingleton(
      'userRepository',
      createFactory(SupabaseUserRepository),
      ['supabaseClient']
    );
    
    // ActivityRepository
    container.registerSingleton(
      'activityRepository',
      createFactory(SupabaseActivityRepository),
      ['supabaseClient']
    );
    
    // AuthRepository
    container.registerSingleton(
      'authRepository',
      createFactory(UnifiedAuthRepository),
      ['supabaseClient', 'localStorageAdapter']
    );
    
    // Cached versions de los repositorios
    container.registerSingleton(
      'cachedUserRepository',
      (userRepo, cacheStrategy) => {
        return CachedRepository.createProxy(userRepo, cacheStrategy, {
          ttl: configManager.get('cache.ttl'),
          keyPrefix: 'user',
          enableLogging: configManager.get('app.debug', false)
        });
      },
      ['userRepository', 'cacheStrategy']
    );
    
    container.registerSingleton(
      'cachedActivityRepository',
      (activityRepo, cacheStrategy) => {
        return CachedRepository.createProxy(activityRepo, cacheStrategy, {
          ttl: configManager.get('cache.ttl'),
          keyPrefix: 'activity',
          enableLogging: configManager.get('app.debug', false)
        });
      },
      ['activityRepository', 'cacheStrategy']
    );
  }

  /**
   * Registrar casos de uso en el container
   */
  async registerUseCases() {
    console.log('🎯 [AppBootstrap] Registering use cases...');
    
    // LoginUser UseCase
    container.registerTransient(
      'loginUserUseCase',
      createFactory(LoginUser),
      ['authRepository', 'cachedUserRepository']
    );
    
    // GetDashboardData UseCase
    container.registerTransient(
      'getDashboardDataUseCase',
      createFactory(GetDashboardData),
      ['cachedActivityRepository', 'cachedUserRepository'] // PostRepository se agregará después
    );
    
    // Registrar más casos de uso según sea necesario...
  }

  /**
   * Configurar event bus global
   */
  async configureEventBus() {
    console.log('📡 [AppBootstrap] Configuring event bus...');
    
    // Habilitar debug en desarrollo
    if (configManager.get('app.debug', false)) {
      eventBus.setDebugMode(true);
    }
    
    // Registrar listeners globales
    this.registerGlobalEventListeners();
    
    // Registrar event bus en container
    container.registerInstance('eventBus', eventBus);
    
    this.services.set('eventBus', eventBus);
  }

  /**
   * Configurar manejo global de errores
   */
  async configureErrorHandling() {
    console.log('🚨 [AppBootstrap] Configuring error handling...');
    
    // Error handler global para promesas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      eventBus.emit(DomainEvents.ERROR_OCCURRED, {
        type: 'UNHANDLED_PROMISE_REJECTION',
        error: event.reason,
        timestamp: new Date()
      });
      
      // Prevenir que el error aparezca en la consola del navegador
      if (configManager.get('app.debug', false)) {
        event.preventDefault();
      }
    });
    
    // Error handler global para errores JavaScript
    window.addEventListener('error', (event) => {
      console.error('Global JavaScript error:', event.error);
      
      eventBus.emit(DomainEvents.ERROR_OCCURRED, {
        type: 'JAVASCRIPT_ERROR',
        error: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date()
      });
    });
  }

  /**
   * Registrar listeners globales de eventos
   */
  registerGlobalEventListeners() {
    // Listener para errores del sistema
    eventBus.on(DomainEvents.ERROR_OCCURRED, (eventData) => {
      // En producción, aquí se enviarían errores a servicio de monitoring
      if (configManager.get('environment') === 'production') {
        // sendToErrorService(eventData.data);
      }
    });
    
    // Listener para eventos de usuario
    eventBus.on(DomainEvents.USER_LOGGED_IN, (eventData) => {
      console.log('User logged in:', eventData.data.user?.email);
      
      // Aquí se pueden activar otros procesos (analytics, etc.)
    });
    
    // Listener para sincronización de datos
    eventBus.on(DomainEvents.DATA_SYNC_COMPLETED, (eventData) => {
      console.log('Data sync completed:', eventData.data);
    });
    
    // Listener para limpiar cache cuando sea necesario
    eventBus.on('cache.invalidate', async (eventData) => {
      const { pattern } = eventData.data;
      const cacheStrategy = container.resolve('cacheStrategy');
      
      if (pattern) {
        await cacheStrategy.deletePattern(pattern);
      } else {
        await cacheStrategy.clear();
      }
    });
  }

  /**
   * Obtener información de debug del bootstrap
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      services: Array.from(this.services.keys()),
      containerInfo: container.getDebugInfo(),
      configInfo: configManager.getDebugInfo(),
      eventBusStats: eventBus.getStats()
    };
  }
}

// Singleton global del bootstrap
export const appBootstrap = new AppBootstrap();

/**
 * Hook de React para usar servicios de la aplicación
 */
export function useAppService(serviceName) {
  const [service, setService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadService = async () => {
      try {
        if (!appBootstrap.isReady()) {
          await appBootstrap.initialize();
        }
        
        if (isMounted) {
          const serviceInstance = appBootstrap.getService(serviceName);
          setService(serviceInstance);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadService();

    return () => {
      isMounted = false;
    };
  }, [serviceName]);

  return { service, isLoading, error };
}

/**
 * HOC para inyectar servicios en componentes
 */
export function withServices(serviceNames = []) {
  return function(WrappedComponent) {
    return function WithServicesComponent(props) {
      const [services, setServices] = React.useState({});
      const [isLoading, setIsLoading] = React.useState(true);
      const [error, setError] = React.useState(null);

      React.useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
          try {
            if (!appBootstrap.isReady()) {
              await appBootstrap.initialize();
            }

            if (isMounted) {
              const serviceInstances = {};
              
              for (const serviceName of serviceNames) {
                serviceInstances[serviceName] = appBootstrap.getService(serviceName);
              }
              
              setServices(serviceInstances);
              setError(null);
            }
          } catch (err) {
            if (isMounted) {
              setError(err);
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        };

        loadServices();

        return () => {
          isMounted = false;
        };
      }, []);

      if (isLoading) {
        return <div>Loading services...</div>;
      }

      if (error) {
        return <div>Error loading services: {error.message}</div>;
      }

      return <WrappedComponent {...props} services={services} />;
    };
  };
}

export default appBootstrap;