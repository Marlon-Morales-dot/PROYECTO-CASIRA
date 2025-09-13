/**
 * Dependency Injection Container
 * Patrón: Dependency Injection + Service Locator + Factory
 * Centraliza la creación y gestión de dependencias
 * Facilita testing y mantiene bajo acoplamiento
 */

export class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }

  /**
   * Registrar un servicio como singleton
   * @param {string} name - Nombre del servicio
   * @param {Function} factory - Factory function que crea el servicio
   * @param {Array} dependencies - Array de dependencias requeridas
   */
  registerSingleton(name, factory, dependencies = []) {
    this.factories.set(name, { factory, dependencies, isSingleton: true });
    return this;
  }

  /**
   * Registrar un servicio como transient (nueva instancia cada vez)
   * @param {string} name - Nombre del servicio
   * @param {Function} factory - Factory function que crea el servicio
   * @param {Array} dependencies - Array de dependencias requeridas
   */
  registerTransient(name, factory, dependencies = []) {
    this.factories.set(name, { factory, dependencies, isSingleton: false });
    return this;
  }

  /**
   * Registrar una instancia específica
   * @param {string} name - Nombre del servicio
   * @param {*} instance - Instancia del servicio
   */
  registerInstance(name, instance) {
    this.singletons.set(name, instance);
    return this;
  }

  /**
   * Resolver y obtener un servicio
   * @param {string} name - Nombre del servicio
   * @returns {*} Instancia del servicio
   */
  resolve(name) {
    try {
      // Si es singleton y ya existe, devolverlo
      if (this.singletons.has(name)) {
        return this.singletons.get(name);
      }

      // Si no hay factory registrada, lanzar error
      if (!this.factories.has(name)) {
        console.error(`❌ Service '${name}' not registered. Available services:`, Array.from(this.factories.keys()));
        throw new Error(`Service '${name}' not registered`);
      }

      const { factory, dependencies, isSingleton } = this.factories.get(name);

      // Resolver dependencias recursivamente
      const resolvedDependencies = dependencies.map(dep => {
        try {
          return this.resolve(dep);
        } catch (error) {
          console.error(`❌ Failed to resolve dependency '${dep}' for service '${name}':`, error);
          throw error;
        }
      });

      // Validar que todas las dependencias se resolvieron correctamente
      const undefinedDependencies = resolvedDependencies
        .map((dep, index) => ({ dep, name: dependencies[index] }))
        .filter(item => item.dep === undefined || item.dep === null);

      if (undefinedDependencies.length > 0) {
        console.error(`❌ Service '${name}' has undefined dependencies:`, undefinedDependencies.map(item => item.name));
      }

      // Crear instancia usando factory
      const instance = factory(...resolvedDependencies);

      // Validar que la instancia se creó correctamente
      if (!instance) {
        console.error(`❌ Factory for '${name}' returned undefined instance`);
        throw new Error(`Factory for '${name}' returned undefined instance`);
      }

      // Si es singleton, guardarlo para futuras resoluciones
      if (isSingleton) {
        this.singletons.set(name, instance);
      }

      return instance;
    } catch (error) {
      console.error(`❌ Failed to resolve service '${name}':`, error);
      throw error;
    }
  }

  /**
   * Verificar si un servicio está registrado
   * @param {string} name - Nombre del servicio
   * @returns {boolean} True si está registrado
   */
  isRegistered(name) {
    return this.factories.has(name) || this.singletons.has(name);
  }

  /**
   * Limpiar container (útil para testing)
   */
  clear() {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Obtener información de debugging
   * @returns {Object} Información del estado del container
   */
  getDebugInfo() {
    return {
      registeredFactories: Array.from(this.factories.keys()),
      singletonInstances: Array.from(this.singletons.keys()),
      totalServices: this.factories.size + this.singletons.size
    };
  }
}

// Singleton global del container
export const container = new DependencyContainer();

/**
 * Decorador para inyección automática de dependencias
 * @param {Array} dependencies - Array de nombres de dependencias
 */
export function inject(...dependencies) {
  return function(target) {
    target.dependencies = dependencies;
    return target;
  };
}

/**
 * Helper para crear factory functions más limpias
 * @param {Class} ServiceClass - Clase del servicio
 * @returns {Function} Factory function
 */
export function createFactory(ServiceClass) {
  return (...dependencies) => new ServiceClass(...dependencies);
}

export default container;