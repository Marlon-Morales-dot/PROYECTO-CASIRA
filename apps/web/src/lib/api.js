// ============= CASIRA Connect - API SIMPLIFICADA Y LIMPIA =============
// Backend URL configuration
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';

// Import Supabase API
import { supabaseAPI } from './supabase-api.js';
import { storageAPI } from './supabase-singleton.js';
import { idsMatch, createHybridRecord, generateUUID, isUUID } from './uuid-helper.js';

// Configuration flag - set to true to use Supabase, false for localStorage  
// UUID CONFLICTS RESOLVED - FORCING SUPABASE FOR REAL-TIME SYNC
const USE_SUPABASE = true; // Force Supabase - env vars are configured

console.log('🔄 CASIRA: API Configuration - USE_SUPABASE:', USE_SUPABASE);

// ============= MIGRATION UTILITIES =============
async function migrateLocalStorageToSupabase() {
  if (!USE_SUPABASE) {
    console.log('⚠️ CASIRA: Supabase disabled, skipping migration');
    return;
  }

  try {
    console.log('🔄 CASIRA: Starting localStorage to Supabase migration...');
    
    // STEP 1: Ensure admin user exists in Supabase
    let adminUser = null;
    try {
      adminUser = await supabaseAPI.users.getUserByEmail('admin@casira.org');
      if (!adminUser) {
        console.log('🔧 CASIRA: Creating admin user in Supabase...');
        adminUser = await supabaseAPI.users.createUser({
          email: 'admin@casira.org',
          first_name: 'Administrador',
          last_name: 'CASIRA',
          role: 'admin',
          bio: 'Administrador principal de la plataforma CASIRA Connect',
          avatar_url: null
        });
        console.log('✅ CASIRA: Admin user created:', adminUser);
      }
    } catch (error) {
      console.error('❌ CASIRA: Failed to create/get admin user:', error);
      throw new Error('Cannot proceed without admin user');
    }

    // STEP 2: Migrar usuarios locales
    const userMigrationMap = new Map(); // Map localStorage user IDs to Supabase IDs
    const localUsers = dataStore.users.filter(u => u.provider !== 'google'); // Exclude Google users as they are handled separately
    
    for (const user of localUsers) {
      try {
        const existingUser = await supabaseAPI.users.getUserByEmail(user.email);
        if (!existingUser) {
          const migratedUser = await supabaseAPI.users.createUser(user);
          userMigrationMap.set(user.id, migratedUser.id);
          console.log(`✅ CASIRA: User migrated: ${user.email}`);
        } else {
          userMigrationMap.set(user.id, existingUser.id);
          console.log(`📋 CASIRA: User already exists: ${user.email}`);
        }
      } catch (error) {
        console.warn(`⚠️ CASIRA: Failed to migrate user ${user.email}:`, error);
      }
    }

    // STEP 3: Migrar actividades
    for (const activity of dataStore.activities) {
      try {
        // Check if activity exists in Supabase
        const existingActivities = await supabaseAPI.activities.getAllActivities();
        const existsInSupabase = existingActivities.find(a => 
          a.title === activity.title && 
          a.description === activity.description
        );

        if (!existsInSupabase) {
          // Determine who created this activity
          let createdBy = adminUser.id; // Default to admin
          
          // If activity has a created_by field, try to map it
          if (activity.created_by) {
            const mappedUserId = userMigrationMap.get(activity.created_by);
            if (mappedUserId) {
              createdBy = mappedUserId;
            }
          }

          // Prepare activity data for migration
          const activityData = {
            title: activity.title,
            description: activity.description,
            detailed_description: activity.detailed_description || '',
            status: activity.status || 'planning',
            priority: activity.priority || 'medium',
            budget: activity.budget || 0,
            beneficiaries_count: activity.beneficiaries_count || 0,
            location: activity.location || '',
            date_start: activity.date_start || activity.start_date || null,
            date_end: activity.date_end || activity.end_date || null,
            max_volunteers: activity.max_volunteers || null,
            image_url: activity.image_url || null,
            requirements: activity.requirements || [],
            benefits: activity.benefits || [],
            visibility: activity.visibility || 'public',
            featured: activity.featured || false,
            category_id: activity.category_id || null,
            created_by: createdBy // Use valid user ID
          };

          console.log(`🔄 CASIRA: Migrating activity "${activity.title}" created by user ID: ${createdBy}`);
          const migratedActivity = await supabaseAPI.activities.createActivity(activityData);
          console.log(`✅ CASIRA: Activity migrated: ${activity.title}`);
          
          // Update localStorage activity with Supabase ID for reference
          activity.supabase_id = migratedActivity.id;
        }
      } catch (error) {
        console.warn(`⚠️ CASIRA: Failed to migrate activity ${activity.title}:`, error);
      }
    }

    // Save updated localStorage data with Supabase IDs
    dataStore.saveToStorage();
    
    console.log('🎉 CASIRA: Migration completed successfully');
  } catch (error) {
    console.error('❌ CASIRA: Migration failed:', error);
  }
}

// Auto-migrate DISABLED - Run manually if needed
console.log('⚠️ CASIRA: Auto-migration disabled. Use migrationAPI.forceMigration() if needed');
// 
// if (USE_SUPABASE) {
//   setTimeout(async () => {
//     try {
//       await migrateLocalStorageToSupabase();
//     } catch (error) {
//       console.error('❌ CASIRA: Auto-migration failed:', error);
//     }
//   }, 3000);
// }

// ============= DATA STORE SIMPLIFICADO =============
class CASIRADataStore {
  constructor() {
    this.listeners = [];
    this.storageKey = 'casira-data';
    
    // Initialize core data arrays
    this.users = [];
    this.activities = [];
    this.volunteers = [];
    this.comments = [];
    this.photos = [];
    this.likes = [];
    this.notifications = [];
    this.posts = [];
    this.categories = [];
    this.stats = { totalUsers: 0, totalActivities: 0, totalVolunteers: 0 };
    
    // Load from localStorage or initialize with defaults
    this.loadFromStorage();
  }

  getDefaultData() {
    return {
      users: [
        {
          id: 1,
          email: "admin@casira.org",
          first_name: "Administrador",
          last_name: "CASIRA",
          role: "admin",
          bio: "Administrador principal de la plataforma CASIRA Connect",
          created_at: "2024-01-01"
        },
        {
          id: 2,
          email: "donante@ejemplo.com", 
          first_name: "María",
          last_name: "González",
          role: "donor",
          bio: "Empresaria comprometida con la educación en Guatemala",
          created_at: "2024-01-15"
        },
        {
          id: 3,
          email: "carlos.martinez@email.com",
          first_name: "Carlos",
          last_name: "Martínez",
          role: "volunteer",
          bio: "Ingeniero apasionado por la educación",
          created_at: "2024-02-01"
        },
        {
          id: 4,
          email: "ana.lopez@email.com",
          first_name: "Ana",
          last_name: "López",
          role: "visitor",
          bio: "Interesada en contribuir a la comunidad",
          location: "Quetzaltenango",
          skills: ["Cocina", "Organización"],
          created_at: "2024-02-15"
        }
      ],
      activities: [
        {
          id: 1,
          title: "Reforestación Comunitaria",
          description: "Plantar árboles nativos para restaurar el ecosistema local",
          detailed_description: "Proyecto de reforestación que busca plantar 1000 árboles nativos en áreas degradadas de la comunidad. Incluye capacitación sobre cuidado del medio ambiente y técnicas de plantación.",
          location: "Bosque de San Juan",
          start_date: "2024-09-15",
          end_date: "2024-09-17",
          max_volunteers: 50,
          current_volunteers: 23,
          status: "active",
          visibility: "public",
          featured: true,
          priority: "high",
          image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500",
          created_at: "2024-08-01",
          activity_categories: {
            id: 1,
            name: "Medio Ambiente",
            color: "#10B981",
            icon: "🌱"
          }
        },
        {
          id: 2,
          title: "Alimentación Comunitaria",
          description: "Preparar y distribuir alimentos para familias necesitadas",
          detailed_description: "Programa semanal de preparación y distribución de alimentos nutritivos para 100 familias en situación vulnerable. Incluye educación nutricional.",
          location: "Centro Comunitario",
          start_date: "2024-09-20",
          max_volunteers: 30,
          current_volunteers: 18,
          status: "active",
          visibility: "public",
          priority: "high",
          image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500",
          created_at: "2024-08-05",
          activity_categories: {
            id: 2,
            name: "Alimentación",
            color: "#F59E0B",
            icon: "🍞"
          }
        },
        {
          id: 3,
          title: "Educación Rural",
          description: "Apoyo educativo para niños en comunidades rurales",
          detailed_description: "Programa de apoyo educativo que incluye clases de refuerzo, actividades recreativas y suministro de materiales escolares para niños de comunidades rurales.",
          location: "Escuela Rural El Progreso",
          start_date: "2024-09-25",
          max_volunteers: 20,
          current_volunteers: 12,
          status: "active",
          visibility: "public",
          priority: "medium",
          image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500",
          created_at: "2024-08-10",
          activity_categories: {
            id: 3,
            name: "Educación",
            color: "#3B82F6",
            icon: "📚"
          }
        }
      ],
      categories: [
        { id: 1, name: "Medio Ambiente", color: "#10B981", icon: "🌱" },
        { id: 2, name: "Alimentación", color: "#F59E0B", icon: "🍞" },
        { id: 3, name: "Educación", color: "#3B82F6", icon: "📚" },
        { id: 4, name: "Salud", color: "#EF4444", icon: "❤️" },
        { id: 5, name: "Vivienda", color: "#8B5CF6", icon: "🏠" }
      ],
      posts: [
        {
          id: 1,
          content: "¡Inauguramos la nueva biblioteca en San Juan! 300 niños ahora tienen acceso a libros y tecnología moderna.",
          image_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmlibGlvdGVjYXxlbnwwfHwwfHx8MA%3D%3D",
          created_at: "2024-08-20T10:30:00Z",
          likes_count: 24,
          comments_count: 8
        },
        {
          id: 2,
          content: "El nuevo laboratorio de ciencias del Liceo San Francisco está transformando la educación. Los estudiantes pueden hacer experimentos que antes solo veían en libros.",
          image_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500",
          created_at: "2024-08-18T14:20:00Z",
          likes_count: 18,
          comments_count: 5
        }
      ],
      volunteers: [],
      comments: [],
      photos: [],
      likes: [],
      notifications: [],
      stats: { totalUsers: 4, totalActivities: 3, totalVolunteers: 0 }
    };
  }

  loadFromStorage() {
    try {
      console.log('🔍 CASIRA: Starting to load from storage...');
      
      if (typeof localStorage === 'undefined') {
        console.log('❌ CASIRA: localStorage not available, initializing with defaults');
        this.initializeWithDefaults();
        return;
      }
      
      const savedData = localStorage.getItem(this.storageKey);
      console.log('📦 CASIRA: Raw saved data length:', savedData?.length || 0);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Load with fallbacks to defaults
        // IMPORTANTE: Mantener usuarios existentes y combinar con defaults si es necesario
        const defaultData = this.getDefaultData();
        
        // Para usuarios: mantener todos los existentes + agregar defaults si no existen
        this.users = parsedData.users || [];
        if (this.users.length === 0) {
          this.users = [...defaultData.users];
        } else {
          // Mantener usuarios existentes y agregar usuarios default que no existan
          const existingEmails = new Set(this.users.map(u => u.email));
          const missingDefaults = defaultData.users.filter(u => !existingEmails.has(u.email));
          this.users.push(...missingDefaults);
        }
        
        // Para actividades: similar lógica
        this.activities = parsedData.activities || [];
        if (this.activities.length === 0) {
          this.activities = [...defaultData.activities];
        }
        
        // Para categorías: siempre mantener las por defecto si no hay
        this.categories = parsedData.categories && parsedData.categories.length > 0 ? parsedData.categories : defaultData.categories;
        this.posts = parsedData.posts || this.getDefaultData().posts;
        this.volunteers = parsedData.volunteers || [];
        this.comments = parsedData.comments || [];
        this.photos = parsedData.photos || [];
        this.likes = parsedData.likes || [];
        this.notifications = parsedData.notifications || [];
        this.stats = parsedData.stats || this.getDefaultData().stats;
        
        // Show detailed user info for debugging Google auth persistence
        const googleUsers = this.users.filter(u => u.provider === 'google');
        const internalUsers = this.users.filter(u => u.provider !== 'google');
        
        console.log('✅ CASIRA: Data loaded from localStorage successfully', {
          totalUsers: this.users?.length || 0,
          googleUsers: googleUsers.length,
          internalUsers: internalUsers.length,
          activities: this.activities?.length || 0,
          volunteers: this.volunteers?.length || 0,
          notifications: this.notifications?.length || 0
        });
        
        if (googleUsers.length > 0) {
          console.log('📧 CASIRA: Google users loaded:', googleUsers.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role
          })));
        }
      } else {
        console.log('⚠️ CASIRA: No saved data found, initializing with defaults');
        this.initializeWithDefaults();
      }
    } catch (error) {
      console.error('❌ CASIRA: Error loading from localStorage:', error);
      console.error('Error details:', error.message);
      this.initializeWithDefaults();
    }
  }

  initializeWithDefaults() {
    console.log('🔄 CASIRA: Initializing with default data...');
    console.trace('Call stack for initializeWithDefaults:'); // Esto nos mostrará de dónde se está llamando
    
    const defaultData = this.getDefaultData();
    Object.assign(this, defaultData);
    this.saveToStorage();
    console.log('✅ CASIRA: Initialized with default data successfully', {
      users: this.users?.length || 0,
      activities: this.activities?.length || 0
    });
  }

  saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('CASIRA: localStorage not available');
        return;
      }
      
      const dataToSave = {
        users: this.users || [],
        activities: this.activities || [],
        categories: this.categories || [],
        posts: this.posts || [],
        volunteers: this.volunteers || [],
        comments: this.comments || [],
        photos: this.photos || [],
        likes: this.likes || [],
        notifications: this.notifications || [],
        stats: this.stats || {}
      };
      
      const serializedData = JSON.stringify(dataToSave);
      localStorage.setItem(this.storageKey, serializedData);
      
      // Show detailed user info for debugging Google auth persistence
      const googleUsers = this.users.filter(u => u.provider === 'google');
      const internalUsers = this.users.filter(u => u.provider !== 'google');
      
      console.log('✅ CASIRA: Data saved to localStorage', {
        totalUsers: this.users?.length || 0,
        googleUsers: googleUsers.length,
        internalUsers: internalUsers.length,
        activities: this.activities?.length || 0,
        volunteers: this.volunteers?.length || 0,
        notifications: this.notifications?.length || 0
      });
      
      if (googleUsers.length > 0) {
        console.log('📧 CASIRA: Google users being saved:', googleUsers.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role
        })));
      }
    } catch (error) {
      console.error('❌ CASIRA: Error saving to localStorage:', error);
      
      // Try to recover storage space if it's full
      if (error.name === 'QuotaExceededError') {
        try {
          // Clear some non-essential data
          const essentialData = {
            users: this.users || [],
            activities: this.activities || [],
            volunteers: this.volunteers || [],
            notifications: this.notifications || []
          };
          localStorage.setItem(this.storageKey, JSON.stringify(essentialData));
          console.log('⚠️ CASIRA: Saved essential data only due to quota limit');
        } catch (retryError) {
          console.error('❌ CASIRA: Failed to save even essential data:', retryError);
        }
      }
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Alias methods for compatibility
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notify() {
    this.listeners.forEach(callback => callback());
  }

  // Helper methods
  getUserById(id) {
    return this.users.find(user => user.id == id);
  }

  getActivityById(id) {
    return this.activities.find(activity => activity.id == id);
  }

  getCategoryById(id) {
    return this.categories.find(category => category.id == id);
  }
}

// Create global store instance
export const dataStore = new CASIRADataStore();

// ============= API FUNCTIONS =============

// Users API
export const usersAPI = {
  getUserByEmail: async (email) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.users.getUserByEmail(email);
    }
    return dataStore.users.find(user => user.email === email);
  },

  getUserById: async (id) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.users.getUserById(id);
    }
    return dataStore.getUserById(id);
  },

  getAllUsers: async () => {
    if (USE_SUPABASE) {
      return await supabaseAPI.users.getAllUsers();
    }
    return dataStore.users;
  },

  createUser: async (userData) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.users.createUser(userData);
    }

    // localStorage implementation
    const existingUser = dataStore.users.find(user => user.email === userData.email);
    if (existingUser) {
      console.log('👤 CASIRA: User already exists, updating instead:', userData.email);
      const updatedUser = { ...existingUser, ...userData };
      const userIndex = dataStore.users.findIndex(user => user.email === userData.email);
      dataStore.users[userIndex] = updatedUser;
      dataStore.saveToStorage();
      dataStore.notify();
      return updatedUser;
    }

    const newUser = {
      id: userData.id || Date.now(),
      ...userData,
      created_at: userData.created_at || new Date().toISOString(),
      status: 'active', // Por defecto activo
      verified: userData.provider === 'google' // Los usuarios de Google están verificados
    };
    
    console.log('🔍 CASIRA: createUser called with data:', {
      id: newUser.id,
      email: newUser.email,
      provider: newUser.provider,
      role: newUser.role,
      status: newUser.status
    });
    
    dataStore.users.push(newUser);
    console.log('📦 CASIRA: User added to dataStore. Total users now:', dataStore.users.length);
    
    dataStore.saveToStorage();
    dataStore.notify();
    
    console.log('✅ CASIRA: User creation completed and saved');
    return newUser;
  },

  updateUserProfile: async (userId, updateData) => {
    const userIndex = dataStore.users.findIndex(user => user.id == userId);
    if (userIndex !== -1) {
      dataStore.users[userIndex] = { ...dataStore.users[userIndex], ...updateData };
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.users[userIndex];
    }
    throw new Error('Usuario no encontrado');
  },

  getAllUsers: async () => {
    // Asegurar que todos los usuarios de Google estén sincronizados
    console.log('📊 CASIRA: Getting all users for admin. Current count:', dataStore.users.length);
    
    // Verificar si hay usuarios en currentUser que no estén en dataStore
    const currentUser = authAPI.getCurrentUser();
    if (currentUser && !dataStore.users.find(u => u.email === currentUser.email)) {
      console.log('👤 CASIRA: Found logged user not in dataStore, adding:', currentUser.email);
      try {
        await usersAPI.createUser({
          ...currentUser,
          role: currentUser.role || 'visitor',
          status: 'active'
        });
      } catch (error) {
        console.warn('⚠️ CASIRA: Could not add current user to dataStore:', error);
      }
    }
    
    return dataStore.users;
  },

  blockUser: async (userId) => {
    console.log('🚫 CASIRA: blockUser called - FORCING SUPABASE');
    console.log('🆔 CASIRA: User ID to block:', userId);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.users.blockUser(userId);
      console.log('✅ CASIRA: User blocked in Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase blockUser failed:', error);
      throw new Error(`Failed to block user in Supabase: ${error.message}`);
    }
  },

  unblockUser: async (userId) => {
    console.log('✅ CASIRA: unblockUser called - FORCING SUPABASE');
    console.log('🆔 CASIRA: User ID to unblock:', userId);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.users.unblockUser(userId);
      console.log('✅ CASIRA: User unblocked in Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase unblockUser failed:', error);
      throw new Error(`Failed to unblock user in Supabase: ${error.message}`);
    }
  },

  updateUserRole: async (userId, newRole) => {
    console.log('🔄 CASIRA: updateUserRole called - FORCING SUPABASE');
    console.log('🆔 CASIRA: User ID to update:', userId, 'New role:', newRole);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.users.updateUserRole(userId, newRole);
      console.log('✅ CASIRA: User role updated in Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase updateUserRole failed:', error);
      throw new Error(`Failed to update user role in Supabase: ${error.message}`);
    }
  }
};

// Activities API
export const activitiesAPI = {
  getAllActivities: async () => {
    console.log('📋 CASIRA: getAllActivities called - FORCING SUPABASE');
    console.log('🔧 CASIRA: USE_SUPABASE value:', USE_SUPABASE);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const activities = await supabaseAPI.activities.getAllActivities();
      console.log('✅ CASIRA: Activities retrieved from Supabase:', activities.length, 'activities');
      return activities;
    } catch (error) {
      console.error('❌ CASIRA: Supabase getAllActivities failed:', error);
      throw new Error(`Failed to get activities from Supabase: ${error.message}`);
    }
  },

  getPublicActivities: async () => {
    if (USE_SUPABASE) {
      const activities = await supabaseAPI.activities.getAllActivities();
      return activities.filter(activity => activity.visibility === 'public');
    }
    return dataStore.activities.filter(activity => activity.visibility === 'public');
  },

  getFeaturedActivities: async () => {
    if (USE_SUPABASE) {
      const activities = await supabaseAPI.activities.getAllActivities();
      return activities.filter(activity => activity.featured && activity.visibility === 'public');
    }
    return dataStore.activities.filter(activity => activity.featured && activity.visibility === 'public');
  },

  getActivityById: async (id) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.activities.getActivityById(id);
    }
    return dataStore.activities.find(a => a.id == id);
  },

  createActivity: async (activityData) => {
    console.log('🎯 CASIRA: createActivity called - FORCING SUPABASE');
    console.log('🔧 CASIRA: USE_SUPABASE value:', USE_SUPABASE);
    console.log('📝 CASIRA: Activity data:', activityData);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.activities.createActivity(activityData);
      console.log('✅ CASIRA: Activity created in Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase createActivity failed:', error);
      throw new Error(`Failed to create activity in Supabase: ${error.message}`);
    }
  },

  updateActivity: async (activityId, updateData) => {
    console.log('✏️ CASIRA: updateActivity called - FORCING SUPABASE');
    console.log('🔧 CASIRA: USE_SUPABASE value:', USE_SUPABASE);
    console.log('🆔 CASIRA: Activity ID to update:', activityId);
    console.log('📝 CASIRA: Update data:', updateData);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.activities.updateActivity(activityId, updateData);
      console.log('✅ CASIRA: Activity updated in Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase updateActivity failed:', error);
      throw new Error(`Failed to update activity in Supabase: ${error.message}`);
    }
  },

  deleteActivity: async (activityId) => {
    console.log('🗑️ CASIRA: deleteActivity called - FORCING SUPABASE');
    console.log('🔧 CASIRA: USE_SUPABASE value:', USE_SUPABASE);
    console.log('🆔 CASIRA: Activity ID to delete:', activityId);
    
    // FORCE SUPABASE ONLY - NO LOCALSTORAGE FALLBACK
    try {
      const result = await supabaseAPI.activities.deleteActivity(activityId);
      console.log('✅ CASIRA: Activity deleted from Supabase successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ CASIRA: Supabase deleteActivity failed:', error);
      throw new Error(`Failed to delete activity from Supabase: ${error.message}`);
    }
  },

  // Likes system
  likeActivity: async (activityId, userId) => {
    const existingLike = dataStore.likes.find(l => l.activity_id == activityId && l.user_id == userId);
    
    if (existingLike) {
      // Remove like
      dataStore.likes = dataStore.likes.filter(l => l.id !== existingLike.id);
      dataStore.saveToStorage();
      dataStore.notify();
      return { 
        liked: false, 
        totalLikes: dataStore.likes.filter(l => l.activity_id == activityId).length 
      };
    } else {
      // Add like
      const newLike = {
        id: Date.now(),
        activity_id: activityId,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      dataStore.likes.push(newLike);
      dataStore.saveToStorage();
      dataStore.notify();
      return { 
        liked: true, 
        totalLikes: dataStore.likes.filter(l => l.activity_id == activityId).length 
      };
    }
  },

  getActivityLikes: async (activityId) => {
    const activityLikes = dataStore.likes.filter(l => l.activity_id == activityId);
    return activityLikes.map(like => {
      const user = dataStore.getUserById(like.user_id);
      return { ...like, user: user || { first_name: 'Usuario', last_name: 'Desconocido' } };
    });
  },

  hasUserLiked: async (activityId, userId) => {
    if (!userId) return false;
    return dataStore.likes.some(l => l.activity_id == activityId && l.user_id == userId);
  }
};

// Volunteers API
export const volunteersAPI = {
  registerForActivity: async (userId, activityId, registrationData) => {
    // Check if already registered
    const existingRegistration = dataStore.volunteers.find(
      v => v.user_id == userId && v.activity_id == activityId
    );
    
    if (existingRegistration) {
      throw new Error('Ya estás registrado en esta actividad');
    }

    // Create registration
    const registration = {
      id: Date.now(),
      user_id: userId,
      activity_id: activityId,
      status: 'pending',
      registration_date: new Date().toISOString(),
      notes: registrationData.notes || '',
      skills_offered: registrationData.skills_offered || []
    };

    dataStore.volunteers.push(registration);

    // Create notification for admin
    // Para usuarios de Google, buscar por email en lugar de ID
    let user = dataStore.getUserById(userId);

    // Si no encuentra el usuario por ID (caso común con IDs de Google), buscar por usuario actual
    if (!user) {
      const currentUser = authAPI.getCurrentUser();
      if (currentUser && (currentUser.id == userId || currentUser.email)) {
        user = currentUser;
        console.log('✅ CASIRA: Using current user for notification:', user.email);
      }
    }

    const activity = dataStore.getActivityById(activityId);

    console.log('🔍 Creating volunteer request notification:', {
      userId,
      activityId,
      userFound: !!user,
      activityFound: !!activity,
      userName: user ? `${user.first_name || user.firstName} ${user.last_name || user.lastName}` : 'Unknown',
      activityTitle: activity ? activity.title : 'Unknown',
      userEmail: user ? user.email : 'Unknown'
    });
    
    if (user && activity) {
      const notification = {
        id: Date.now() + 1,
        type: 'volunteer_request',
        user_id: userId,
        activity_id: activityId,
        message: `${user.first_name || user.firstName} ${user.last_name || user.lastName} solicita unirse a ${activity.title}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        user_email: user.email,
        user_avatar: user.avatar_url
      };
      
      dataStore.notifications.push(notification);
      console.log('✅ Volunteer request notification created successfully');
    } else {
      console.error('❌ Failed to create notification - user or activity not found', {
        userId,
        activityId,
        userFound: !!user,
        activityFound: !!activity
      });
    }

    dataStore.saveToStorage();
    dataStore.notify();
    return registration;
  },

  getUserRegistrations: async (userId) => {
    return dataStore.volunteers.filter(v => v.user_id == userId);
  },

  updateRegistrationStatus: async (registrationId, status) => {
    const registrationIndex = dataStore.volunteers.findIndex(v => v.id == registrationId);
    if (registrationIndex !== -1) {
      dataStore.volunteers[registrationIndex].status = status;
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.volunteers[registrationIndex];
    }
    throw new Error('Registro no encontrado');
  },

  getAllRegistrations: async () => {
    // Retornar todas las registraciones con información de usuario y actividad
    return dataStore.volunteers.map(volunteer => {
      const user = dataStore.getUserById(volunteer.user_id);
      const activity = dataStore.getActivityById(volunteer.activity_id);
      return {
        ...volunteer,
        user: user || { first_name: 'Usuario', last_name: 'Desconocido' },
        activity: activity || { title: 'Actividad no encontrada' }
      };
    });
  },

  removeFromActivity: async (registrationId, activityId) => {
    const registrationIndex = dataStore.volunteers.findIndex(
      v => v.id == registrationId && v.activity_id == activityId
    );
    
    if (registrationIndex !== -1) {
      const removedRegistration = dataStore.volunteers[registrationIndex];
      dataStore.volunteers.splice(registrationIndex, 1);
      dataStore.saveToStorage();
      dataStore.notify();
      return removedRegistration;
    }
    throw new Error('Registro no encontrado');
  }
};

// Comments API
export const commentsAPI = {
  getAllComments: async () => {
    if (USE_SUPABASE) {
      return await supabaseAPI.comments.getAllComments();
    }
    return dataStore.comments;
  },

  getCommentsByPost: async (postId) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.comments.getCommentsByPost(postId);
    }
    return dataStore.comments.filter(c => c.post_id == postId);
  },

  createComment: async (commentData) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.comments.createComment(commentData);
    }

    // localStorage implementation - keep existing logic
    let user = dataStore.getUserById(commentData.author_id);
    
    // Si el usuario no existe, intentar obtenerlo del usuario actual loggeado
    if (!user) {
      const currentUser = authAPI.getCurrentUser();
      if (currentUser && (currentUser.id == commentData.author_id || currentUser.email === commentData.author_id)) {
        user = currentUser;
        // Asegurar que el usuario esté en dataStore
        try {
          await usersAPI.createUser(currentUser);
          console.log('✅ Usuario Google agregado al dataStore para comentarios');
        } catch (error) {
          console.log('⚠️ Usuario ya existía en dataStore o error al agregarlo');
        }
      }
    }
    
    if (!user) {
      console.error('❌ Usuario no encontrado para comentario:', { author_id: commentData.author_id, currentUser: authAPI.getCurrentUser() });
      throw new Error('Usuario no encontrado');
    }

    const comment = {
      id: Date.now(),
      activity_id: commentData.activity_id,
      user_id: commentData.author_id,
      content: commentData.content,
      created_at: new Date().toISOString(),
      likes: 0,
      user: user
    };

    dataStore.comments.push(comment);
    dataStore.saveToStorage();
    dataStore.notify();
    return comment;
  },

  getActivityComments: async (activityId) => {
    return dataStore.comments
      .filter(c => c.activity_id == activityId)
      .map(comment => {
        const user = dataStore.getUserById(comment.user_id);
        return { ...comment, user: user || { first_name: 'Usuario', last_name: 'Desconocido' } };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  likeComment: async (commentId) => {
    const commentIndex = dataStore.comments.findIndex(c => c.id == commentId);
    if (commentIndex !== -1) {
      dataStore.comments[commentIndex].likes = (dataStore.comments[commentIndex].likes || 0) + 1;
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.comments[commentIndex];
    }
    throw new Error('Comentario no encontrado');
  },

  // Alias for compatibility with components that expect addComment
  addComment: async (activityId, userId, content) => {
    console.log('💬 CASIRA: addComment called with:', { activityId, userId, content });

    // Resolver el ID correcto del usuario para Supabase
    let resolvedUserId = userId;

    // Si es un ID de Google (no es UUID), necesitamos obtener el supabase_id
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.log('🔍 CASIRA: Non-UUID userId detected, resolving supabase_id...');

      try {
        // Obtener el usuario actual del contexto
        const currentUser = authAPI.getCurrentUser();
        if (currentUser && currentUser.supabase_id) {
          resolvedUserId = currentUser.supabase_id;
          console.log('✅ CASIRA: Using supabase_id from current user:', resolvedUserId);
        } else if (currentUser && currentUser.email) {
          // Si no tenemos supabase_id, buscar por email en Supabase
          const supabaseUser = await supabaseAPI.users.getUserByEmail(currentUser.email);
          if (supabaseUser && supabaseUser.id) {
            resolvedUserId = supabaseUser.id;
            console.log('✅ CASIRA: Found supabase_id by email lookup:', resolvedUserId);
          }
        }
      } catch (error) {
        console.error('❌ CASIRA: Error resolving user ID:', error);
        throw new Error('No se pudo resolver el ID del usuario para comentarios');
      }
    }

    console.log('💬 CASIRA: Creating comment with resolved userId:', resolvedUserId);
    return await commentsAPI.createComment({
      activity_id: activityId,
      author_id: resolvedUserId,
      content: content
    });
  }
};

// Posts API
export const postsAPI = {
  getAllPosts: async () => {
    if (USE_SUPABASE) {
      return await supabaseAPI.posts.getAllPosts();
    }
    return dataStore.posts;
  },

  getPublicPosts: async (limit = 10) => {
    if (USE_SUPABASE) {
      const posts = await supabaseAPI.posts.getAllPosts();
      return posts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    }
    return dataStore.posts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  getPostById: async (id) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.posts.getPostById(id);
    }
    return dataStore.posts.find(p => p.id == id);
  },

  createPost: async (postData) => {
    if (USE_SUPABASE) {
      return await supabaseAPI.posts.createPost(postData);
    }

    // localStorage implementation
    const user = dataStore.getUserById(postData.author_id);
    if (!user) throw new Error('Usuario no encontrado');

    const post = {
      id: Date.now(),
      author_id: postData.author_id,
      activity_id: postData.activity_id || null,
      title: postData.title || '',
      content: postData.content,
      post_type: postData.post_type || 'update',
      images: postData.images || [],
      visibility: postData.visibility || 'public',
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      featured: postData.featured || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: user
    };

    dataStore.posts.push(post);
    dataStore.saveToStorage();
    dataStore.notify();
    return post;
  },

  likePost: async (postId, userId) => {
    const existingLike = dataStore.likes.find(l => 
      l.post_id == postId && l.user_id == userId && l.type === 'post'
    );
    
    if (existingLike) {
      // Remove like
      dataStore.likes = dataStore.likes.filter(l => l.id !== existingLike.id);
      
      // Update post likes count
      const postIndex = dataStore.posts.findIndex(p => p.id == postId);
      if (postIndex !== -1) {
        dataStore.posts[postIndex].likes_count = Math.max(0, (dataStore.posts[postIndex].likes_count || 1) - 1);
      }
    } else {
      // Add like
      const newLike = {
        id: Date.now(),
        post_id: postId,
        user_id: userId,
        type: 'post',
        created_at: new Date().toISOString()
      };
      dataStore.likes.push(newLike);
      
      // Update post likes count
      const postIndex = dataStore.posts.findIndex(p => p.id == postId);
      if (postIndex !== -1) {
        dataStore.posts[postIndex].likes_count = (dataStore.posts[postIndex].likes_count || 0) + 1;
      }
    }

    dataStore.saveToStorage();
    dataStore.notify();
    return { 
      liked: !existingLike, 
      totalLikes: dataStore.likes.filter(l => l.post_id == postId && l.type === 'post').length 
    };
  },

  addCommentToPost: async (postId, userId, content) => {
    const user = dataStore.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const comment = {
      id: Date.now(),
      post_id: postId,
      user_id: userId,
      content: content,
      created_at: new Date().toISOString(),
      likes: 0,
      user: user
    };

    dataStore.comments.push(comment);
    
    // Update post comments count
    const postIndex = dataStore.posts.findIndex(p => p.id == postId);
    if (postIndex !== -1) {
      dataStore.posts[postIndex].comments_count = (dataStore.posts[postIndex].comments_count || 0) + 1;
    }

    dataStore.saveToStorage();
    dataStore.notify();
    return comment;
  },

  getPostComments: async (postId) => {
    return dataStore.comments
      .filter(c => c.post_id == postId)
      .map(comment => {
        const user = dataStore.getUserById(comment.user_id);
        return { ...comment, user: user || { first_name: 'Usuario', last_name: 'Desconocido' } };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
};

// Notifications API
export const notificationsAPI = {
  getAdminNotifications: async () => {
    return dataStore.notifications
      .filter(n => n.status === 'pending')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  createNotification: async (notificationData) => {
    const newNotification = {
      id: Date.now(),
      ...notificationData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    dataStore.notifications.push(newNotification);
    dataStore.saveToStorage();
    dataStore.notify();
    return newNotification;
  },

  updateNotificationStatus: async (notificationId, status) => {
    const notification = dataStore.notifications.find(n => n.id == notificationId);
    if (notification) {
      notification.status = status;
      dataStore.saveToStorage();
      dataStore.notify();
      return notification;
    }
    throw new Error('Notificación no encontrada');
  },

  approveVolunteerRequest: async (notificationId) => {
    const notification = dataStore.notifications.find(n => n.id == notificationId);
    if (notification && notification.type === 'volunteer_request') {
      // Update volunteer registration status
      const registration = dataStore.volunteers.find(
        v => v.user_id == notification.user_id && v.activity_id == notification.activity_id
      );
      
      if (registration) {
        registration.status = 'confirmed';
        
        // Update activity volunteer count
        const activity = dataStore.getActivityById(notification.activity_id);
        if (activity) {
          activity.current_volunteers = (activity.current_volunteers || 0) + 1;
        }
      }
      
      notification.status = 'processed';
      dataStore.saveToStorage();
      dataStore.notify();
      return { success: true };
    }
    throw new Error('Notificación no válida');
  },

  rejectVolunteerRequest: async (notificationId) => {
    const notification = dataStore.notifications.find(n => n.id == notificationId);
    if (notification && notification.type === 'volunteer_request') {
      // Update volunteer registration status
      const registration = dataStore.volunteers.find(
        v => v.user_id == notification.user_id && v.activity_id == notification.activity_id
      );
      
      if (registration) {
        registration.status = 'rejected';
      }
      
      notification.status = 'processed';
      dataStore.saveToStorage();
      dataStore.notify();
      return { success: true };
    }
    throw new Error('Notificación no válida');
  }
};

// Categories API
export const categoriesAPI = {
  getAllCategories: async () => {
    return dataStore.categories;
  }
};

// Photos API (with Supabase Storage integration)
export const photosAPI = {
  getActivityPhotos: async (activityId) => {
    return dataStore.photos.filter(p => p.activity_id == activityId);
  },

  uploadPhoto: async (photoData) => {
    const user = dataStore.getUserById(photoData.user_id);
    if (!user) throw new Error('Usuario no encontrado');

    // Check if it's a file upload or base64 data
    let imageUrl;
    
    if (photoData.file) {
      // Use Supabase storage for file uploads
      try {
        const uploadResult = await storageAPI.uploadImage(
          photoData.file, 
          photoData.user_id, 
          photoData.activity_id
        );
        imageUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading to Supabase:', error);
        // Fallback to base64 if Supabase fails
        imageUrl = photoData.image_data;
      }
    } else {
      // Use provided URL or base64 data
      imageUrl = photoData.image_data || photoData.url;
    }

    const photo = {
      id: Date.now(),
      activity_id: photoData.activity_id,
      user_id: photoData.user_id,
      url: imageUrl,
      caption: photoData.caption || '',
      file_name: photoData.file_name || `photo_${Date.now()}`,
      created_at: new Date().toISOString(),
      likes: 0,
      user: user
    };

    dataStore.photos.push(photo);
    dataStore.saveToStorage();
    dataStore.notify();
    return photo;
  },

  likePhoto: async (photoId) => {
    const photoIndex = dataStore.photos.findIndex(p => p.id == photoId);
    if (photoIndex !== -1) {
      dataStore.photos[photoIndex].likes = (dataStore.photos[photoIndex].likes || 0) + 1;
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.photos[photoIndex];
    }
    throw new Error('Foto no encontrada');
  },

  deletePhoto: async (photoId) => {
    const photoIndex = dataStore.photos.findIndex(p => p.id == photoId);
    if (photoIndex !== -1) {
      const photo = dataStore.photos[photoIndex];
      
      // Try to delete from Supabase storage if it's a Supabase URL
      if (photo.url && photo.url.includes('supabase')) {
        try {
          await storageAPI.deleteImage(photo.file_name);
        } catch (error) {
          console.error('Error deleting from Supabase:', error);
        }
      }
      
      dataStore.photos.splice(photoIndex, 1);
      dataStore.saveToStorage();
      dataStore.notify();
      return photo;
    }
    throw new Error('Foto no encontrada');
  }
};

// Permissions API
export const permissionsAPI = {
  canUserPerform: (user, action) => {
    if (!user) return false;
    
    const permissions = {
      admin: {
        create_activity: true,
        edit_activity: true,
        delete_activity: true,
        manage_users: true,
        approve_volunteers: true,
        view_analytics: true,
        moderate_comments: true,
        upload_photos: true,
        comment: true,
        like_posts: true,
        join_activities: true
      },
      volunteer: {
        create_activity: false,
        edit_activity: false,
        delete_activity: false,
        manage_users: false,
        approve_volunteers: false,
        view_analytics: false,
        moderate_comments: false,
        upload_photos: true,
        comment: true,
        like_posts: true,
        join_activities: true
      },
      visitor: {
        create_activity: false,
        edit_activity: false,
        delete_activity: false,
        manage_users: false,
        approve_volunteers: false,
        view_analytics: false,
        moderate_comments: false,
        upload_photos: false,
        comment: true,
        like_posts: true,
        join_activities: true
      },
      donor: {
        create_activity: false,
        edit_activity: false,
        delete_activity: false,
        manage_users: false,
        approve_volunteers: false,
        view_analytics: true,
        moderate_comments: false,
        upload_photos: true,
        comment: true,
        like_posts: true,
        join_activities: true
      }
    };
    
    return permissions[user.role]?.[action] || false;
  },

  // Funciones específicas para diferentes acciones
  canJoinActivity: (userRole) => {
    const allowedRoles = ['visitor', 'volunteer', 'donor', 'admin'];
    return allowedRoles.includes(userRole);
  },

  canComment: (userRole) => {
    const allowedRoles = ['visitor', 'volunteer', 'donor', 'admin'];
    return allowedRoles.includes(userRole);
  },

  canLike: (userRole) => {
    const allowedRoles = ['visitor', 'volunteer', 'donor', 'admin'];
    return allowedRoles.includes(userRole);
  }
};

// Stats API
export const statsAPI = {
  getStats: async () => {
    return {
      totalUsers: dataStore.users.length,
      totalActivities: dataStore.activities.length,
      totalVolunteers: dataStore.volunteers.filter(v => v.status === 'confirmed').length,
      totalComments: dataStore.comments.length,
      totalLikes: dataStore.likes.length,
      totalNotifications: dataStore.notifications.filter(n => n.status === 'pending').length
    };
  },

  getDashboardStats: async () => {
    return {
      totalUsers: dataStore.users.length,
      totalActivities: dataStore.activities.length,
      totalVolunteers: dataStore.volunteers.length,
      totalComments: dataStore.comments.length,
      totalLikes: dataStore.likes.length,
      totalNotifications: dataStore.notifications.filter(n => n.status === 'pending').length,
      pendingVolunteers: dataStore.volunteers.filter(v => v.status === 'pending').length,
      confirmedVolunteers: dataStore.volunteers.filter(v => v.status === 'confirmed').length,
      rejectedVolunteers: dataStore.volunteers.filter(v => v.status === 'rejected').length
    };
  }
};

// Utility functions for admin management
export const forceRefreshData = () => {
  console.warn('⚠️ CASIRA: forceRefreshData called - this will reset all data!');
  console.trace('Call stack for forceRefreshData:');
  
  // Solo permitir si es explícitamente solicitado
  if (window.confirm && !window.confirm('¿Estás seguro de que quieres forzar la actualización? Esto eliminará todos los datos actuales.')) {
    console.log('❌ CASIRA: forceRefreshData cancelled by user');
    return;
  }
  
  dataStore.initializeWithDefaults();
  console.log('✅ CASIRA: Data forcefully refreshed');
};

export const resetDataToDefaults = () => {
  console.warn('⚠️ CASIRA: resetDataToDefaults called - this will reset all data!');
  console.trace('Call stack for resetDataToDefaults:');
  
  // Solo permitir si es explícitamente solicitado
  if (window.confirm && !window.confirm('¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
    console.log('❌ CASIRA: resetDataToDefaults cancelled by user');
    return;
  }
  
  dataStore.initializeWithDefaults();
  console.log('✅ CASIRA: Data reset to defaults');
};

export const cleanStorageData = () => {
  console.warn('⚠️ CASIRA: cleanStorageData called - this will delete all saved data!');
  console.trace('Call stack for cleanStorageData:');
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('casira-data');
      console.log('🧹 CASIRA: Storage data cleaned');
    }
    dataStore.initializeWithDefaults();
  } catch (error) {
    console.error('❌ CASIRA: Error cleaning storage:', error);
  }
};

// Auth API (local authentication fallback)
export const authAPI = {
  login: async (email, password) => {
    console.log('🔐 CASIRA Auth: Attempting local login for:', email);
    
    // Find user by email
    const user = dataStore.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Usuario no encontrado. ¿Necesitas registrarte?');
    }
    
    // Simple password check (in production, use proper password hashing)
    const validPasswords = ['admin123', 'demo123', 'casira123', '123'];
    if (!validPasswords.includes(password)) {
      throw new Error('Contraseña incorrecta');
    }
    
    // Update last login
    const userIndex = dataStore.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      dataStore.users[userIndex].last_login = new Date().toISOString();
      dataStore.saveToStorage();
    }
    
    console.log('✅ CASIRA Auth: Login successful for user:', user.email);
    return user;
  },
  
  register: async (userData) => {
    console.log('📝 CASIRA Auth: Attempting registration for:', userData.email);
    
    // Check if user already exists
    const existingUser = dataStore.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }
    
    // Create new user - TODOS LOS NUEVOS USUARIOS SON VISITORS
    const newUser = {
      id: Date.now(),
      email: userData.email,
      first_name: userData.first_name || 'Usuario',
      last_name: userData.last_name || 'Nuevo',
      role: userData.email === 'admin@casira.org' ? 'admin' : 'visitor', // Solo admin@casira.org es admin
      provider: 'local',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: 'active'
    };
    
    return await usersAPI.createUser(newUser);
  },
  
  getCurrentUser: () => {
    // Try to get from localStorage
    const currentUserData = localStorage.getItem('casira-current-user');
    if (currentUserData) {
      try {
        return JSON.parse(currentUserData);
      } catch (e) {
        console.error('Error parsing current user data:', e);
        return null;
      }
    }
    return null;
  },
  
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('casira-current-user', JSON.stringify(user));
      console.log('✅ CASIRA Auth: Current user set:', user.email);
    } else {
      localStorage.removeItem('casira-current-user');
      console.log('🚪 CASIRA Auth: User logged out');
    }
  },
  
  logout: () => {
    localStorage.removeItem('casira-current-user');
    console.log('🚪 CASIRA Auth: User logged out');
    return true;
  },
  
  isLoggedIn: () => {
    return !!authAPI.getCurrentUser();
  }
};

// ============= MIGRATION API =============
export const migrationAPI = {
  migrateLocalStorageToSupabase,
  
  // Manual migration trigger
  async forceMigration() {
    console.log('🔄 CASIRA: Manual migration triggered');
    await migrateLocalStorageToSupabase();
  },

  // Clean migration - clears all Supabase data and re-migrates from localStorage
  async cleanMigration() {
    if (!USE_SUPABASE) {
      console.log('⚠️ CASIRA: Supabase disabled, cannot perform clean migration');
      return;
    }

    try {
      console.log('🧹 CASIRA: Starting clean migration - this will clear existing Supabase data');
      
      // Warning: This is destructive!
      const confirmed = confirm('⚠️ WARNING: This will delete ALL existing data in Supabase and re-migrate from localStorage. Continue?');
      if (!confirmed) {
        console.log('❌ CASIRA: Clean migration cancelled by user');
        return;
      }

      // Clear all activities from Supabase (but keep users for safety)
      try {
        const existingActivities = await supabaseAPI.activities.getAllActivities();
        console.log(`🗑️ CASIRA: Found ${existingActivities.length} activities to clean`);
        
        for (const activity of existingActivities) {
          try {
            await supabaseAPI.activities.deleteActivity(activity.id);
            console.log(`✅ CASIRA: Cleaned activity: ${activity.title}`);
          } catch (error) {
            console.warn(`⚠️ CASIRA: Could not delete activity ${activity.title}:`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️ CASIRA: Error during activity cleanup:', error);
      }

      // Now run the migration
      console.log('🔄 CASIRA: Starting fresh migration...');
      await migrateLocalStorageToSupabase();
      
      // Force refresh the page to reload all data
      console.log('🔄 CASIRA: Migration complete, refreshing page...');
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      console.error('❌ CASIRA: Clean migration failed:', error);
    }
  }
};

// Make migration functions available globally for debugging
window.CASIRA_MIGRATE = migrationAPI.forceMigration;
window.CASIRA_CLEAN_MIGRATE = migrationAPI.cleanMigration;

// Default export
export default {
  dataStore,
  usersAPI,
  activitiesAPI,
  volunteersAPI,
  commentsAPI,
  postsAPI,
  notificationsAPI,
  categoriesAPI,
  photosAPI,
  permissionsAPI,
  statsAPI,
  authAPI,
  migrationAPI,
  storageAPI,
  forceRefreshData
};