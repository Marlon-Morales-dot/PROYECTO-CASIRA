// ============= CASIRA Connect - API SIMPLIFICADA Y LIMPIA =============
// Backend URL configuration
const BACKEND_URL = 'https://proyecto-casira.onrender.com';

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
          image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
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
      if (typeof localStorage === 'undefined') {
        this.initializeWithDefaults();
        return;
      }
      
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Load with fallbacks to defaults
        this.users = parsedData.users && parsedData.users.length > 0 ? parsedData.users : this.getDefaultData().users;
        this.activities = parsedData.activities && parsedData.activities.length > 0 ? parsedData.activities : this.getDefaultData().activities;
        this.categories = parsedData.categories && parsedData.categories.length > 0 ? parsedData.categories : this.getDefaultData().categories;
        this.posts = parsedData.posts || this.getDefaultData().posts;
        this.volunteers = parsedData.volunteers || [];
        this.comments = parsedData.comments || [];
        this.photos = parsedData.photos || [];
        this.likes = parsedData.likes || [];
        this.notifications = parsedData.notifications || [];
        this.stats = parsedData.stats || this.getDefaultData().stats;
        
        console.log('CASIRA: Data loaded from localStorage');
      } else {
        this.initializeWithDefaults();
      }
    } catch (error) {
      console.error('CASIRA: Error loading from localStorage:', error);
      this.initializeWithDefaults();
    }
  }

  initializeWithDefaults() {
    const defaultData = this.getDefaultData();
    Object.assign(this, defaultData);
    this.saveToStorage();
    console.log('CASIRA: Initialized with default data');
  }

  saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const dataToSave = {
        users: this.users,
        activities: this.activities,
        categories: this.categories,
        posts: this.posts,
        volunteers: this.volunteers,
        comments: this.comments,
        photos: this.photos,
        likes: this.likes,
        notifications: this.notifications,
        stats: this.stats
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('CASIRA: Error saving to localStorage:', error);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
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
    return dataStore.users.find(user => user.email === email);
  },

  getUserById: async (id) => {
    return dataStore.getUserById(id);
  },

  createUser: async (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      created_at: new Date().toISOString()
    };
    dataStore.users.push(newUser);
    dataStore.saveToStorage();
    dataStore.notify();
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
    return dataStore.users;
  },

  blockUser: async (userId) => {
    const userIndex = dataStore.users.findIndex(user => user.id == userId);
    if (userIndex !== -1) {
      dataStore.users[userIndex].status = 'blocked';
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.users[userIndex];
    }
    throw new Error('Usuario no encontrado');
  },

  unblockUser: async (userId) => {
    const userIndex = dataStore.users.findIndex(user => user.id == userId);
    if (userIndex !== -1) {
      dataStore.users[userIndex].status = 'active';
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.users[userIndex];
    }
    throw new Error('Usuario no encontrado');
  }
};

// Activities API
export const activitiesAPI = {
  getPublicActivities: async () => {
    return dataStore.activities.filter(activity => activity.visibility === 'public');
  },

  getFeaturedActivities: async () => {
    return dataStore.activities.filter(activity => activity.featured && activity.visibility === 'public');
  },

  createActivity: async (activityData) => {
    const newActivity = {
      id: Date.now(),
      ...activityData,
      current_volunteers: 0,
      created_at: new Date().toISOString()
    };
    dataStore.activities.push(newActivity);
    dataStore.saveToStorage();
    dataStore.notify();
    return newActivity;
  },

  updateActivity: async (activityId, updateData) => {
    const activityIndex = dataStore.activities.findIndex(activity => activity.id == activityId);
    if (activityIndex !== -1) {
      dataStore.activities[activityIndex] = { ...dataStore.activities[activityIndex], ...updateData };
      dataStore.saveToStorage();
      dataStore.notify();
      return dataStore.activities[activityIndex];
    }
    throw new Error('Actividad no encontrada');
  },

  deleteActivity: async (activityId) => {
    const activityIndex = dataStore.activities.findIndex(activity => activity.id == activityId);
    if (activityIndex !== -1) {
      const deletedActivity = dataStore.activities[activityIndex];
      dataStore.activities.splice(activityIndex, 1);
      
      // También eliminar comentarios y likes relacionados
      dataStore.comments = dataStore.comments.filter(c => c.activity_id != activityId);
      dataStore.likes = dataStore.likes.filter(l => l.activity_id != activityId);
      dataStore.volunteers = dataStore.volunteers.filter(v => v.activity_id != activityId);
      
      dataStore.saveToStorage();
      dataStore.notify();
      return deletedActivity;
    }
    throw new Error('Actividad no encontrada');
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
    const user = dataStore.getUserById(userId);
    const activity = dataStore.getActivityById(activityId);
    
    if (user && activity) {
      const notification = {
        id: Date.now() + 1,
        type: 'volunteer_request',
        user_id: userId,
        activity_id: activityId,
        message: `${user.first_name} ${user.last_name} solicita unirse a ${activity.title}`,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      dataStore.notifications.push(notification);
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
  addComment: async (activityId, userId, content) => {
    const user = dataStore.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const comment = {
      id: Date.now(),
      activity_id: activityId,
      user_id: userId,
      content: content,
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
  }
};

// Posts API
export const postsAPI = {
  getPublicPosts: async (limit = 10) => {
    return dataStore.posts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
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

// Photos API (simplified)
export const photosAPI = {
  getActivityPhotos: async (activityId) => {
    return dataStore.photos.filter(p => p.activity_id == activityId);
  },

  uploadPhoto: async (activityId, userId, photoData) => {
    const user = dataStore.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const photo = {
      id: Date.now(),
      activity_id: activityId,
      user_id: userId,
      url: photoData.url,
      caption: photoData.caption || '',
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
  dataStore.initializeWithDefaults();
  console.log('CASIRA: Data forcefully refreshed');
};

export const resetDataToDefaults = () => {
  dataStore.initializeWithDefaults();
  console.log('CASIRA: Data reset to defaults');
};

export const cleanStorageData = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('casira-data');
      console.log('CASIRA: Storage data cleaned');
    }
    dataStore.initializeWithDefaults();
  } catch (error) {
    console.error('CASIRA: Error cleaning storage:', error);
  }
};

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
  forceRefreshData
};