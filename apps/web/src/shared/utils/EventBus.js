/**
 * Event Bus - Observer Pattern Implementation
 * Patrón: Observer + Publisher-Subscriber + Event Aggregator
 * Desacopla componentes y facilita comunicación entre capas
 * Permite notificaciones reactivas sin dependencias directas
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.wildcardListeners = new Set();
    this.isDebugMode = false;
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Callback a ejecutar
   * @param {Object} options - Opciones adicionales
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listener = {
      callback,
      priority: options.priority || 0,
      context: options.context,
      id: this.generateId()
    };

    this.listeners.get(event).add(listener);

    if (this.isDebugMode) {
      console.log(`[EventBus] Registered listener for '${event}'`, listener);
    }

    // Retornar función de desuscripción
    return () => this.off(event, listener.id);
  }

  /**
   * Suscribirse a un evento una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Callback a ejecutar
   * @param {Object} options - Opciones adicionales
   * @returns {Function} Función para desuscribirse
   */
  once(event, callback, options = {}) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }

    const listener = {
      callback,
      priority: options.priority || 0,
      context: options.context,
      id: this.generateId()
    };

    this.onceListeners.get(event).add(listener);

    if (this.isDebugMode) {
      console.log(`[EventBus] Registered once listener for '${event}'`, listener);
    }

    // Retornar función de desuscripción
    return () => this.offOnce(event, listener.id);
  }

  /**
   * Suscribirse a eventos con patrón wildcard
   * @param {string} pattern - Patrón (ej: 'user.*', 'activity.created')
   * @param {Function} callback - Callback a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  onPattern(pattern, callback) {
    const listener = {
      pattern: new RegExp(pattern.replace(/\*/g, '.*')),
      callback,
      id: this.generateId()
    };

    this.wildcardListeners.add(listener);

    if (this.isDebugMode) {
      console.log(`[EventBus] Registered pattern listener for '${pattern}'`, listener);
    }

    // Retornar función de desuscripción
    return () => this.wildcardListeners.delete(listener);
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   * @param {Object} options - Opciones adicionales
   */
  async emit(event, data = null, options = {}) {
    const eventObj = {
      type: event,
      data,
      timestamp: new Date(),
      source: options.source || 'unknown',
      id: this.generateId()
    };

    if (this.isDebugMode) {
      console.log(`[EventBus] Emitting '${event}'`, eventObj);
    }

    try {
      // Ejecutar listeners normales
      await this.executeListeners(event, eventObj);

      // Ejecutar listeners de una sola vez
      await this.executeOnceListeners(event, eventObj);

      // Ejecutar listeners con patrón wildcard
      await this.executeWildcardListeners(event, eventObj);

    } catch (error) {
      console.error(`[EventBus] Error emitting '${event}':`, error);
      
      // Emitir evento de error
      this.emit('error', { originalEvent: event, error }, { source: 'EventBus' });
    }
  }

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {string} listenerId - ID del listener (opcional)
   */
  off(event, listenerId = null) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);

    if (listenerId) {
      // Remover listener específico
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          break;
        }
      }
    } else {
      // Remover todos los listeners del evento
      listeners.clear();
    }

    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Desuscribirse de un evento once
   * @param {string} event - Nombre del evento
   * @param {string} listenerId - ID del listener
   */
  offOnce(event, listenerId) {
    if (!this.onceListeners.has(event)) return;

    const listeners = this.onceListeners.get(event);

    for (const listener of listeners) {
      if (listener.id === listenerId) {
        listeners.delete(listener);
        break;
      }
    }

    if (listeners.size === 0) {
      this.onceListeners.delete(event);
    }
  }

  /**
   * Limpiar todos los listeners
   */
  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
    this.wildcardListeners.clear();

    if (this.isDebugMode) {
      console.log('[EventBus] All listeners cleared');
    }
  }

  /**
   * Obtener estadísticas del event bus
   * @returns {Object} Estadísticas
   */
  getStats() {
    const normalEvents = Array.from(this.listeners.keys());
    const onceEvents = Array.from(this.onceListeners.keys());
    
    let totalListeners = 0;
    this.listeners.forEach(listeners => {
      totalListeners += listeners.size;
    });
    
    let totalOnceListeners = 0;
    this.onceListeners.forEach(listeners => {
      totalOnceListeners += listeners.size;
    });

    return {
      normalEvents,
      onceEvents,
      totalListeners,
      totalOnceListeners,
      wildcardListeners: this.wildcardListeners.size,
      totalEvents: normalEvents.length + onceEvents.length
    };
  }

  /**
   * Habilitar/deshabilitar modo debug
   * @param {boolean} enabled - Habilitar debug
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;
  }

  // ===============================================================================
  // MÉTODOS PRIVADOS
  // ===============================================================================

  /**
   * Ejecutar listeners normales
   */
  async executeListeners(event, eventObj) {
    if (!this.listeners.has(event)) return;

    const listeners = Array.from(this.listeners.get(event))
      .sort((a, b) => b.priority - a.priority); // Mayor prioridad primero

    for (const listener of listeners) {
      try {
        if (listener.context) {
          await listener.callback.call(listener.context, eventObj);
        } else {
          await listener.callback(eventObj);
        }
      } catch (error) {
        console.error(`[EventBus] Error in listener for '${event}':`, error);
      }
    }
  }

  /**
   * Ejecutar listeners de una sola vez
   */
  async executeOnceListeners(event, eventObj) {
    if (!this.onceListeners.has(event)) return;

    const listeners = Array.from(this.onceListeners.get(event))
      .sort((a, b) => b.priority - a.priority);

    // Limpiar listeners antes de ejecutar
    this.onceListeners.delete(event);

    for (const listener of listeners) {
      try {
        if (listener.context) {
          await listener.callback.call(listener.context, eventObj);
        } else {
          await listener.callback(eventObj);
        }
      } catch (error) {
        console.error(`[EventBus] Error in once listener for '${event}':`, error);
      }
    }
  }

  /**
   * Ejecutar listeners con patrón wildcard
   */
  async executeWildcardListeners(event, eventObj) {
    for (const listener of this.wildcardListeners) {
      if (listener.pattern.test(event)) {
        try {
          await listener.callback(eventObj);
        } catch (error) {
          console.error(`[EventBus] Error in wildcard listener for '${event}':`, error);
        }
      }
    }
  }

  /**
   * Generar ID único para listeners
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton global del event bus
export const eventBus = new EventBus();

/**
 * Decorador para auto-suscripción a eventos
 * @param {string} event - Nombre del evento
 * @param {string} method - Nombre del método a ejecutar
 */
export function listenTo(event, method) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      // Auto-suscribirse al evento
      if (!this._eventUnsubscribers) {
        this._eventUnsubscribers = [];
      }
      
      const unsubscribe = eventBus.on(event, (eventData) => {
        if (this[method]) {
          this[method](eventData);
        }
      });
      
      this._eventUnsubscribers.push(unsubscribe);
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Helper para emitir eventos de dominio
 */
export const DomainEvents = {
  // User events
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_REGISTERED: 'user.registered',
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_ROLE_CHANGED: 'user.role_changed',

  // Activity events
  ACTIVITY_CREATED: 'activity.created',
  ACTIVITY_UPDATED: 'activity.updated',
  ACTIVITY_DELETED: 'activity.deleted',
  ACTIVITY_VOLUNTEER_JOINED: 'activity.volunteer_joined',
  ACTIVITY_VOLUNTEER_LEFT: 'activity.volunteer_left',
  ACTIVITY_STATUS_CHANGED: 'activity.status_changed',

  // Post events
  POST_CREATED: 'post.created',
  POST_LIKED: 'post.liked',
  POST_UNLIKED: 'post.unliked',
  POST_COMMENTED: 'post.commented',

  // System events
  ERROR_OCCURRED: 'system.error',
  NOTIFICATION_CREATED: 'notification.created',
  DATA_SYNC_COMPLETED: 'data.sync_completed'
};

export default eventBus;