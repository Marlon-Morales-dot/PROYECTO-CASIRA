// ============= CASIRA Storage Manager - Sistema Avanzado de Almacenamiento =============

class AdvancedStorageManager {
  constructor() {
    this.storageKey = 'casira-data-v2';
    this.sessionStorageKey = 'casira-session';
    this.listeners = [];
    this.memoryStore = new Map();
    this.compressionEnabled = true;
    this.syncEnabled = true;
    
    // Configuración de persistencia multinivel
    this.storageTypes = {
      memory: true,      // RAM (más rápido)
      localStorage: true, // Disco local
      sessionStorage: true // Sesión temporal
    };
    
    // Metadatos del store
    this.metadata = {
      version: '2.0.0',
      lastSync: null,
      totalOperations: 0,
      compressionRatio: 1.0
    };
    
    this.initializeStorage();
  }

  // ============= INICIALIZACIÓN =============
  initializeStorage() {
    try {
      console.log('🚀 CASIRA Storage Manager: Inicializando sistema avanzado...');
      
      // Verificar disponibilidad de APIs de almacenamiento
      this.checkStorageAvailability();
      
      // Cargar datos desde todos los niveles disponibles
      this.loadFromAllSources();
      
      // Configurar sincronización automática
      this.setupAutoSync();
      
      console.log('✅ CASIRA Storage Manager: Sistema inicializado correctamente');
    } catch (error) {
      console.error('❌ CASIRA Storage Manager: Error en inicialización:', error);
      this.handleInitializationError(error);
    }
  }

  checkStorageAvailability() {
    try {
      // Test localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        this.storageTypes.localStorage = true;
      } else {
        this.storageTypes.localStorage = false;
        console.warn('⚠️ localStorage no disponible');
      }

      // Test sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        this.storageTypes.sessionStorage = true;
      } else {
        this.storageTypes.sessionStorage = false;
        console.warn('⚠️ sessionStorage no disponible');
      }
    } catch (error) {
      console.warn('⚠️ Error verificando almacenamiento:', error);
    }
  }

  // ============= CARGA DE DATOS =============
  loadFromAllSources() {
    let loadedData = null;
    let source = 'default';

    // Prioridad: Memory Store > localStorage > sessionStorage > defaults
    try {
      // 1. Intentar cargar desde localStorage (persistente)
      if (this.storageTypes.localStorage && localStorage.getItem(this.storageKey)) {
        const localData = this.decompressData(localStorage.getItem(this.storageKey));
        if (localData && this.validateData(localData)) {
          loadedData = localData;
          source = 'localStorage';
          console.log('📦 CASIRA: Datos cargados desde localStorage');
        }
      }

      // 2. Si no hay datos locales, intentar sessionStorage
      if (!loadedData && this.storageTypes.sessionStorage && sessionStorage.getItem(this.sessionStorageKey)) {
        const sessionData = this.decompressData(sessionStorage.getItem(this.sessionStorageKey));
        if (sessionData && this.validateData(sessionData)) {
          loadedData = sessionData;
          source = 'sessionStorage';
          console.log('📦 CASIRA: Datos cargados desde sessionStorage');
        }
      }

      // 3. Si no hay datos guardados, usar defaults
      if (!loadedData) {
        loadedData = this.getDefaultData();
        source = 'defaults';
        console.log('📦 CASIRA: Usando datos por defecto');
      }

      // Cargar en memory store
      this.loadIntoMemoryStore(loadedData);
      
      // Actualizar metadata
      this.metadata.lastSync = new Date().toISOString();
      this.metadata.loadSource = source;

      console.log('✅ CASIRA: Datos cargados exitosamente', {
        source,
        users: loadedData.users?.length || 0,
        activities: loadedData.activities?.length || 0,
        googleUsers: loadedData.users?.filter(u => u.provider === 'google').length || 0
      });

    } catch (error) {
      console.error('❌ CASIRA: Error cargando datos:', error);
      this.loadIntoMemoryStore(this.getDefaultData());
    }
  }

  loadIntoMemoryStore(data) {
    // Cargar cada tipo de dato en el memory store
    Object.keys(data).forEach(key => {
      this.memoryStore.set(key, data[key]);
    });
  }

  // ============= VALIDACIÓN DE DATOS =============
  validateData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Validar estructura básica
    const requiredKeys = ['users', 'activities', 'notifications', 'comments', 'likes'];
    return requiredKeys.every(key => Array.isArray(data[key]));
  }

  // ============= COMPRESIÓN =============
  compressData(data) {
    if (!this.compressionEnabled) return JSON.stringify(data);
    
    try {
      const jsonString = JSON.stringify(data);
      // Compresión simple (en producción se podría usar LZ-string o similar)
      const compressed = jsonString;
      
      this.metadata.compressionRatio = compressed.length / jsonString.length;
      return compressed;
    } catch (error) {
      console.warn('⚠️ Error comprimiendo datos:', error);
      return JSON.stringify(data);
    }
  }

  decompressData(compressedData) {
    if (!compressedData) return null;
    
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.warn('⚠️ Error descomprimiendo datos:', error);
      return null;
    }
  }

  // ============= OPERACIONES CRUD =============
  
  // Obtener datos
  get(key) {
    return this.memoryStore.get(key);
  }

  // Establecer datos
  set(key, value, options = {}) {
    const { persist = true, notify = true, validate = true } = options;
    
    try {
      // Validar si es necesario
      if (validate && Array.isArray(value)) {
        value = value.filter(item => item && typeof item === 'object');
      }

      // Actualizar memory store
      this.memoryStore.set(key, value);
      this.metadata.totalOperations++;

      // Persistir si es requerido
      if (persist) {
        this.persistToStorage();
      }

      // Notificar a listeners
      if (notify) {
        this.notifyListeners(key, value);
      }

      console.log(`✅ CASIRA Storage: ${key} actualizado`, {
        items: Array.isArray(value) ? value.length : 'N/A',
        persisted: persist
      });

      return true;
    } catch (error) {
      console.error(`❌ CASIRA Storage: Error actualizando ${key}:`, error);
      return false;
    }
  }

  // Agregar elemento a array
  push(key, item, options = {}) {
    const currentArray = this.get(key) || [];
    const newArray = [...currentArray, item];
    return this.set(key, newArray, options);
  }

  // Actualizar elemento en array
  updateInArray(key, findFn, updateData, options = {}) {
    const currentArray = this.get(key) || [];
    const updatedArray = currentArray.map(item => 
      findFn(item) ? { ...item, ...updateData } : item
    );
    return this.set(key, updatedArray, options);
  }

  // Eliminar elemento de array
  removeFromArray(key, findFn, options = {}) {
    const currentArray = this.get(key) || [];
    const filteredArray = currentArray.filter(item => !findFn(item));
    return this.set(key, filteredArray, options);
  }

  // ============= PERSISTENCIA =============
  persistToStorage() {
    try {
      // Recopilar todos los datos del memory store
      const dataToSave = {};
      for (const [key, value] of this.memoryStore.entries()) {
        dataToSave[key] = value;
      }

      // Agregar metadata
      dataToSave._metadata = {
        ...this.metadata,
        savedAt: new Date().toISOString()
      };

      const compressedData = this.compressData(dataToSave);

      // Guardar en localStorage si está disponible
      if (this.storageTypes.localStorage) {
        localStorage.setItem(this.storageKey, compressedData);
      }

      // Guardar en sessionStorage si está disponible
      if (this.storageTypes.sessionStorage) {
        sessionStorage.setItem(this.sessionStorageKey, compressedData);
      }

      this.metadata.lastSync = new Date().toISOString();

      // Log detallado para usuarios de Google Auth
      const users = this.get('users') || [];
      const googleUsers = users.filter(u => u.provider === 'google');
      
      console.log('💾 CASIRA Storage: Datos persistidos', {
        totalUsers: users.length,
        googleUsers: googleUsers.length,
        totalOperations: this.metadata.totalOperations,
        compressionRatio: this.metadata.compressionRatio
      });

      if (googleUsers.length > 0) {
        console.log('👥 Google Users persistidos:', googleUsers.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role
        })));
      }

    } catch (error) {
      console.error('❌ CASIRA Storage: Error persistiendo datos:', error);
      this.handlePersistenceError(error);
    }
  }

  // ============= SINCRONIZACIÓN AUTOMÁTICA =============
  setupAutoSync() {
    if (!this.syncEnabled) return;

    // Sync cada 30 segundos
    setInterval(() => {
      this.persistToStorage();
    }, 30000);

    // Sync antes de cerrar la página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistToStorage();
      });

      // Sync cuando la página vuelve a tener foco
      window.addEventListener('focus', () => {
        this.loadFromAllSources();
      });
    }
  }

  // ============= LISTENERS =============
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(key, value) {
    this.listeners.forEach(callback => {
      try {
        callback(key, value);
      } catch (error) {
        console.warn('⚠️ Error en listener:', error);
      }
    });
  }

  // ============= MANEJO DE ERRORES =============
  handleInitializationError(error) {
    console.error('💥 CASIRA Storage: Error crítico en inicialización:', error);
    // Fallback a datos por defecto
    this.loadIntoMemoryStore(this.getDefaultData());
  }

  handlePersistenceError(error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ CASIRA Storage: Cuota de almacenamiento excedida');
      // Intentar limpiar datos antiguos o no esenciales
      this.cleanupOldData();
    } else {
      console.error('💥 Error de persistencia:', error);
    }
  }

  cleanupOldData() {
    try {
      // Mantener solo datos esenciales
      const essentialKeys = ['users', 'activities', 'notifications', 'volunteers'];
      const cleanedData = {};
      
      essentialKeys.forEach(key => {
        cleanedData[key] = this.get(key) || [];
      });

      this.loadIntoMemoryStore(cleanedData);
      this.persistToStorage();
      
      console.log('🧹 CASIRA Storage: Datos limpiados para liberar espacio');
    } catch (cleanupError) {
      console.error('❌ Error en limpieza de datos:', cleanupError);
    }
  }

  // ============= DATOS POR DEFECTO =============
  getDefaultData() {
    return {
      users: [
        {
          id: 1,
          email: "admin@casira.org",
          first_name: "Administrador",
          last_name: "CASIRA",
          role: "admin",
          provider: "internal",
          bio: "Administrador principal de la plataforma CASIRA Connect",
          created_at: "2024-01-01"
        }
      ],
      activities: [
        {
          id: 1,
          title: "Reforestación Comunitaria",
          description: "Plantar árboles nativos para restaurar el ecosistema local",
          location: "Bosque de San Juan",
          start_date: "2024-09-15",
          max_volunteers: 50,
          current_volunteers: 0,
          status: "active",
          visibility: "public",
          featured: true,
          image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500",
          created_at: "2024-08-01"
        }
      ],
      notifications: [],
      comments: [],
      likes: [],
      volunteers: [],
      photos: [],
      posts: [],
      categories: [
        { id: 1, name: "Medio Ambiente", color: "#10B981", icon: "🌱" },
        { id: 2, name: "Educación", color: "#3B82F6", icon: "📚" }
      ],
      stats: { totalUsers: 1, totalActivities: 1, totalVolunteers: 0 }
    };
  }

  // ============= UTILIDADES =============
  
  // Obtener estadísticas del storage
  getStorageStats() {
    const data = {};
    for (const [key, value] of this.memoryStore.entries()) {
      data[key] = Array.isArray(value) ? value.length : typeof value;
    }

    return {
      ...data,
      metadata: this.metadata,
      storageTypes: this.storageTypes,
      memoryStoreSize: this.memoryStore.size
    };
  }

  // Forzar recarga completa
  forceReload() {
    console.log('🔄 CASIRA Storage: Forzando recarga completa...');
    this.memoryStore.clear();
    this.loadFromAllSources();
    this.notifyListeners('*', 'reload');
  }

  // Limpiar todo el almacenamiento
  clearAll() {
    console.log('🧹 CASIRA Storage: Limpiando todo el almacenamiento...');
    this.memoryStore.clear();
    
    if (this.storageTypes.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
    if (this.storageTypes.sessionStorage) {
      sessionStorage.removeItem(this.sessionStorageKey);
    }
    
    this.loadIntoMemoryStore(this.getDefaultData());
    this.persistToStorage();
    this.notifyListeners('*', 'cleared');
  }

  // Exportar datos para backup
  exportData() {
    const data = {};
    for (const [key, value] of this.memoryStore.entries()) {
      data[key] = value;
    }
    return data;
  }

  // Importar datos desde backup
  importData(data) {
    if (!this.validateData(data)) {
      throw new Error('Datos de importación inválidos');
    }
    
    this.loadIntoMemoryStore(data);
    this.persistToStorage();
    this.notifyListeners('*', 'imported');
    
    console.log('📥 CASIRA Storage: Datos importados exitosamente');
  }
}

// Crear instancia global del storage manager
export const storageManager = new AdvancedStorageManager();

// Export default
export default storageManager;