// API functions for CASIRA - Simplified version with mock data
// Simplified to avoid database complexity and ensure functionality

// Global state management for mock data
class MockDataStore {
  constructor() {
    this.listeners = [];
    this.activities = [
  {
    id: 1,
    title: "Reforestación Comunitaria",
    description: "Plantación de árboles nativos en zonas deforestadas",
    detailed_description: "Programa de reforestación que busca restaurar ecosistemas degradados mediante la participación activa de la comunidad local.",
    category_id: 1,
    status: "active",
    priority: "high",
    location: "Parque Nacional",
    start_date: "2024-03-01",
    end_date: "2024-12-31",
    max_volunteers: 50,
    current_volunteers: 23,
    budget: 15000,
    image_url: "/grupo-canadienses.jpg",
    visibility: "public",
    featured: true,
    created_at: "2024-01-15",
    activity_categories: { id: 1, name: "Medio Ambiente", color: "green", icon: "🌱" },
    users: { first_name: "Juan", last_name: "Pérez" },
    activity_participants: [{ id: 1, status: "active" }, { id: 2, status: "active" }],
    posts: [{ id: 1, created_at: "2024-02-15" }]
  },
  {
    id: 2,
    title: "Alimentación Comunitaria",
    description: "Distribución de alimentos a familias necesitadas",
    detailed_description: "Programa de asistencia alimentaria para familias en situación de vulnerabilidad.",
    category_id: 2,
    status: "active",
    priority: "high",
    location: "Centro Comunitario",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    max_volunteers: 30,
    current_volunteers: 18,
    budget: 25000,
    image_url: "/grupo-canadienses.jpg",
    visibility: "public",
    featured: true,
    created_at: "2024-01-10",
    activity_categories: { id: 2, name: "Alimentación", color: "orange", icon: "🍞" },
    users: { first_name: "María", last_name: "González" },
    activity_participants: [{ id: 3, status: "active" }],
    posts: [{ id: 2, created_at: "2024-02-10" }]
  },
  {
    id: 3,
    title: "Educación Rural",
    description: "Apoyo educativo en zonas rurales",
    detailed_description: "Programa de refuerzo escolar y alfabetización para comunidades rurales.",
    category_id: 3,
    status: "planning",
    priority: "medium",
    location: "Escuela Rural San José",
    start_date: "2024-04-01",
    end_date: "2024-11-30",
    max_volunteers: 20,
    current_volunteers: 5,
    budget: 8000,
    image_url: "/grupo-canadienses.jpg",
    visibility: "public",
    featured: false,
    created_at: "2024-02-01",
    activity_categories: { id: 3, name: "Educación", color: "blue", icon: "📚" },
    users: { first_name: "Carlos", last_name: "Martínez" },
    activity_participants: [{ id: 4, status: "pending" }],
    posts: []
  }
];

    this.categories = [
  { id: 1, name: "Medio Ambiente", color: "green", icon: "🌱" },
  { id: 2, name: "Alimentación", color: "orange", icon: "🍞" },
  { id: 3, name: "Educación", color: "blue", icon: "📚" },
  { id: 4, name: "Salud", color: "red", icon: "❤️" },
  { id: 5, name: "Vivienda", color: "purple", icon: "🏠" }
];

    this.stats = {
  active_projects: 2,
  completed_projects: 5,
  total_volunteers: 150,
  total_donations: 85000,
  lives_transformed: 225
};

    this.posts = [
  {
    id: 1,
    title: "Gran éxito en la jornada de reforestación",
    content: "Más de 200 árboles plantados en un solo día",
    activity_id: 1,
    author_id: "1",
    visibility: "public",
    created_at: "2024-02-15",
    users: { id: "1", first_name: "Juan", last_name: "Pérez", avatar_url: null },
    activities: { id: 1, title: "Reforestación Comunitaria", status: "active" }
  },
  {
    id: 2,
    title: "Nuevas familias beneficiadas",
    content: "El programa alimentario ha llegado a 50 nuevas familias esta semana",
    activity_id: 2,
    author_id: "2",
    visibility: "public",
    created_at: "2024-02-10",
    users: { id: "2", first_name: "María", last_name: "González", avatar_url: null },
    activities: { id: 2, title: "Alimentación Comunitaria", status: "active" }
  }
];
  }

  // Methods to update stats automatically
  updateStats() {
    const activeActivities = this.activities.filter(a => a.status === 'active').length;
    const completedActivities = this.activities.filter(a => a.status === 'completed').length;
    const totalVolunteers = this.activities.reduce((sum, a) => sum + (a.current_volunteers || 0), 0);
    
    this.stats = {
      active_projects: activeActivities,
      completed_projects: completedActivities,
      total_volunteers: totalVolunteers,
      total_donations: 85000,
      lives_transformed: Math.floor(totalVolunteers * 1.5)
    };
  }

  // Event system for real-time updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notify() {
    this.listeners.forEach(callback => callback());
  }

  // Enhanced methods that notify changes
  addActivity(activity) {
    this.activities.push(activity);
    this.updateStats();
    this.notify();
    return activity;
  }

  updateActivity(id, updates) {
    const index = this.activities.findIndex(activity => activity.id == id);
    if (index !== -1) {
      this.activities[index] = { ...this.activities[index], ...updates };
      this.updateStats();
      this.notify();
      return this.activities[index];
    }
    throw new Error('Activity not found');
  }

  deleteActivity(id) {
    const index = this.activities.findIndex(activity => activity.id == id);
    if (index !== -1) {
      this.activities.splice(index, 1);
      this.updateStats();
      this.notify();
      return true;
    }
    throw new Error('Activity not found');
  }
}

// Create global instance
const dataStore = new MockDataStore();

// ============= AUTH FUNCTIONS =============

export const authAPI = {
  // Get current user - simplified
  getCurrentUser: async () => {
    try {
      // Return null for now - no authentication needed
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Create or update user profile - simplified
  upsertUserProfile: async (userData) => {
    try {
      // Mock successful response
      return {
        id: 'mock-user-id',
        first_name: userData.first_name || 'Usuario',
        last_name: userData.last_name || 'Anónimo',
        email: userData.email || 'user@example.com',
        role: 'volunteer'
      };
    } catch (error) {
      console.error('Error upserting user profile:', error);
      return {
        id: 'mock-user-id',
        first_name: 'Usuario',
        last_name: 'Anónimo',
        email: 'user@example.com',
        role: 'volunteer'
      };
    }
  },

  // Check if user is admin - simplified
  isAdmin: async (userId) => {
    try {
      // Return false for now - no admin functionality
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};

// ============= ACTIVITIES FUNCTIONS =============

export const activitiesAPI = {
  // Get all public activities - using mock data
  getPublicActivities: async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return dataStore.activities.filter(activity => activity.visibility === 'public');
    } catch (error) {
      console.error('Error fetching public activities:', error);
      return [];
    }
  },

  // Get featured activities - using mock data
  getFeaturedActivities: async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return dataStore.activities.filter(activity => activity.visibility === 'public' && activity.featured).slice(0, 6);
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      return [];
    }
  },

  // Get activity by ID - using mock data
  getActivityById: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.activities.find(activity => activity.id == id) || null;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  },

  // Create new activity - simplified
  createActivity: async (activityData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: Date.now(), // Simple ID generation
        ...activityData,
        created_at: new Date().toISOString(),
        current_volunteers: 0,
        activity_participants: [],
        posts: []
      };
      return dataStore.addActivity(newActivity);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // Update activity - simplified
  updateActivity: async (id, updates) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return dataStore.updateActivity(id, updates);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete activity - simplified
  deleteActivity: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return dataStore.deleteActivity(id);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Join activity as volunteer - simplified
  joinActivity: async (activityId, userId, role = 'volunteer') => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock successful join
      return {
        id: Date.now(),
        activity_id: activityId,
        user_id: userId,
        role: role,
        status: 'registered'
      };
    } catch (error) {
      console.error('Error joining activity:', error);
      throw error;
    }
  }
};

// ============= CATEGORIES FUNCTIONS =============

export const categoriesAPI = {
  // Get all categories - using mock data
  getAllCategories: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Create category - simplified
  createCategory: async (categoryData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newCategory = {
        id: Date.now(),
        ...categoryData
      };
      dataStore.categories.push(newCategory);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
};

// ============= POSTS FUNCTIONS =============

export const postsAPI = {
  // Get posts for an activity - using mock data
  getActivityPosts: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.posts.filter(post => post.activity_id == activityId);
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  // Get all public posts for feed - using mock data
  getPublicPosts: async (limit = 10) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return dataStore.posts.filter(post => post.visibility === 'public').slice(0, limit);
    } catch (error) {
      console.error('Error fetching public posts:', error);
      return [];
    }
  },

  // Create new post - simplified
  createPost: async (postData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newPost = {
        id: Date.now(),
        ...postData,
        created_at: new Date().toISOString()
      };
      dataStore.posts.push(newPost);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
};

// ============= EVENTS FUNCTIONS =============

export const eventsAPI = {
  // Get events for an activity - simplified
  getActivityEvents: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      // Return empty array for now - no events in mock data
      return [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Create new event - simplified
  createEvent: async (eventData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock successful creation
      return {
        id: Date.now(),
        ...eventData,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Join event - simplified
  joinEvent: async (eventId, userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock successful join
      return {
        id: Date.now(),
        event_id: eventId,
        user_id: userId,
        status: 'registered'
      };
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  }
};

// ============= STATISTICS FUNCTIONS =============

export const statsAPI = {
  // Get dashboard statistics - using mock data
  getDashboardStats: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      dataStore.updateStats();
      return dataStore.stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        active_projects: 0,
        completed_projects: 0,
        total_volunteers: 0,
        total_donations: 0,
        lives_transformed: 0
      };
    }
  }
};

// Export dataStore for subscriptions
export { dataStore };

// Export mock supabase object for compatibility
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOAuth: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null })
  }
};