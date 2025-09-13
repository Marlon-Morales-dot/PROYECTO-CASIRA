/**
 * ConfigManager - Configuration Pattern + Validation Pattern
 * Centraliza y valida toda la configuración de la aplicación
 * Reemplaza las configuraciones hardcodeadas dispersas en App.jsx
 */

export class ConfigManager {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = {};
    this.validators = new Map();
    this.watchers = new Map();
    this.isInitialized = false;
    
    this.setupDefaultValidators();
  }

  /**
   * Inicializar configuración
   */
  async initialize() {
    try {
      await this.loadEnvironmentConfig();
      await this.validateAllConfig();
      this.isInitialized = true;
      
      console.log(`[ConfigManager] Initialized for environment: ${this.environment}`);
      return this.config;
      
    } catch (error) {
      console.error('[ConfigManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Obtener valor de configuración
   * @param {string} key - Clave de configuración (ej: 'supabase.url')
   * @param {*} defaultValue - Valor por defecto
   * @returns {*} Valor de configuración
   */
  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      console.warn(`[ConfigManager] Getting '${key}' before initialization`);
    }

    const value = this.getNestedValue(this.config, key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Establecer valor de configuración
   * @param {string} key - Clave de configuración
   * @param {*} value - Valor a establecer
   * @param {boolean} validate - Validar el valor
   */
  set(key, value, validate = true) {
    if (validate && this.validators.has(key)) {
      const validator = this.validators.get(key);
      const validationResult = validator(value);
      
      if (!validationResult.isValid) {
        throw new Error(`Invalid value for '${key}': ${validationResult.message}`);
      }
    }

    this.setNestedValue(this.config, key, value);
    
    // Notificar watchers
    this.notifyWatchers(key, value);
    
    console.log(`[ConfigManager] Set '${key}' = ${JSON.stringify(value)}`);
  }

  /**
   * Verificar si existe una configuración
   * @param {string} key - Clave de configuración
   * @returns {boolean} True si existe
   */
  has(key) {
    return this.getNestedValue(this.config, key) !== undefined;
  }

  /**
   * Registrar validador para una clave
   * @param {string} key - Clave de configuración
   * @param {Function} validator - Función validadora
   */
  addValidator(key, validator) {
    this.validators.set(key, validator);
  }

  /**
   * Observar cambios en una configuración
   * @param {string} key - Clave de configuración
   * @param {Function} callback - Callback a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    
    this.watchers.get(key).add(callback);
    
    // Retornar función de desuscripción
    return () => {
      const keyWatchers = this.watchers.get(key);
      if (keyWatchers) {
        keyWatchers.delete(callback);
        if (keyWatchers.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }

  /**
   * Obtener toda la configuración como objeto plano
   * @returns {Object} Configuración completa
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Obtener configuración para debugging
   * @returns {Object} Información de debug
   */
  getDebugInfo() {
    return {
      environment: this.environment,
      isInitialized: this.isInitialized,
      configKeys: this.getAllKeys(this.config),
      validatorKeys: Array.from(this.validators.keys()),
      watcherKeys: Array.from(this.watchers.keys())
    };
  }

  /**
   * Recargar configuración
   */
  async reload() {
    this.isInitialized = false;
    await this.initialize();
  }

  // ===============================================================================
  // MÉTODOS PRIVADOS
  // ===============================================================================

  /**
   * Cargar configuración específica del entorno
   */
  async loadEnvironmentConfig() {
    const baseConfig = {
      app: {
        name: 'CASIRA Connect',
        version: '1.0.0',
        debug: false,
        logLevel: 'warn'
      },
      api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      cache: {
        strategy: 'multiLevel',
        ttl: 300000, // 5 minutos
        maxSize: 1000
      },
      auth: {
        tokenPrefix: 'casira-jwt-',
        sessionTimeout: 3600000, // 1 hora
        rememberMeDuration: 7 * 24 * 3600000 // 7 días
      },
      ui: {
        theme: 'light',
        language: 'es',
        animations: true,
        pageSize: 20
      }
    };

    // Configuración específica del entorno
    const envConfig = await this.loadEnvironmentSpecific();
    
    // Merge configuraciones
    this.config = this.deepMerge(baseConfig, envConfig);
  }

  /**
   * Cargar configuración específica del entorno actual
   */
  async loadEnvironmentSpecific() {
    switch (this.environment) {
      case 'development':
        return {
          app: {
            debug: true,
            logLevel: 'debug'
          },
          api: {
            baseUrl: 'https://proyecto-casira.onrender.com/api'
          },
          supabase: {
            url: import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co',
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo'
          },
          external: {
            renderApiUrl: 'https://proyecto-casira.onrender.com/api'
          }
        };

      case 'production':
        return {
          api: {
            baseUrl: 'https://proyecto-casira.onrender.com/api'
          },
          supabase: {
            url: import.meta.env.VITE_SUPABASE_URL,
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          external: {
            renderApiUrl: 'https://proyecto-casira.onrender.com/api'
          },
          cache: {
            ttl: 600000 // 10 minutos en producción
          }
        };

      case 'test':
        return {
          app: {
            debug: true,
            logLevel: 'error'
          },
          api: {
            baseUrl: 'http://localhost:3001',
            timeout: 5000
          },
          cache: {
            strategy: 'memory',
            ttl: 10000 // 10 segundos para tests
          }
        };

      default:
        return {};
    }
  }

  /**
   * Configurar validadores por defecto
   */
  setupDefaultValidators() {
    // Validador para URLs
    this.addValidator('supabase.url', (value) => {
      try {
        new URL(value);
        return { isValid: true };
      } catch {
        return { isValid: false, message: 'Must be a valid URL' };
      }
    });

    // Validador para claves de API
    this.addValidator('supabase.anonKey', (value) => {
      if (!value || typeof value !== 'string' || value.length < 10) {
        return { isValid: false, message: 'Must be a valid API key' };
      }
      return { isValid: true };
    });

    // Validador para timeouts
    this.addValidator('api.timeout', (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        return { isValid: false, message: 'Must be a positive integer' };
      }
      return { isValid: true };
    });

    // Validador para estrategias de cache
    this.addValidator('cache.strategy', (value) => {
      const validStrategies = ['memory', 'localStorage', 'sessionStorage', 'multiLevel'];
      if (!validStrategies.includes(value)) {
        return { isValid: false, message: `Must be one of: ${validStrategies.join(', ')}` };
      }
      return { isValid: true };
    });

    // Validador para temas
    this.addValidator('ui.theme', (value) => {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(value)) {
        return { isValid: false, message: `Must be one of: ${validThemes.join(', ')}` };
      }
      return { isValid: true };
    });
  }

  /**
   * Validar toda la configuración
   */
  async validateAllConfig() {
    const errors = [];

    for (const [key, validator] of this.validators.entries()) {
      if (this.has(key)) {
        const value = this.get(key);
        const result = validator(value);
        
        if (!result.isValid) {
          errors.push(`${key}: ${result.message}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Obtener valor anidado usando notación de punto
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, keyPart) => {
      return current && current[keyPart] !== undefined ? current[keyPart] : undefined;
    }, obj);
  }

  /**
   * Establecer valor anidado usando notación de punto
   */
  setNestedValue(obj, key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, keyPart) => {
      if (!current[keyPart] || typeof current[keyPart] !== 'object') {
        current[keyPart] = {};
      }
      return current[keyPart];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Merge profundo de objetos
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Obtener todas las claves de configuración
   */
  getAllKeys(obj, prefix = '') {
    const keys = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys.push(...this.getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Notificar watchers de cambios
   */
  notifyWatchers(key, value) {
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      keyWatchers.forEach(callback => {
        try {
          callback(value, key);
        } catch (error) {
          console.error(`[ConfigManager] Error in watcher for '${key}':`, error);
        }
      });
    }
  }
}

// Singleton global del config manager
export const configManager = new ConfigManager(
  import.meta.env.MODE || 'development'
);

/**
 * Hook para configuración en componentes React
 */
export function useConfig(key, defaultValue = null) {
  const [value, setValue] = React.useState(() => configManager.get(key, defaultValue));

  React.useEffect(() => {
    const unwatch = configManager.watch(key, (newValue) => {
      setValue(newValue);
    });

    return unwatch;
  }, [key]);

  return value;
}

/**
 * Decorador para inyectar configuración
 */
export function withConfig(configKeys = []) {
  return function(target) {
    const originalConstructor = target;
    
    function ConfigurableClass(...args) {
      const instance = new originalConstructor(...args);
      
      // Inyectar configuración
      configKeys.forEach(key => {
        const configValue = configManager.get(key);
        if (configValue !== null) {
          instance[key.replace(/\./g, '_')] = configValue;
        }
      });
      
      return instance;
    }
    
    ConfigurableClass.prototype = originalConstructor.prototype;
    return ConfigurableClass;
  };
}

export default configManager;