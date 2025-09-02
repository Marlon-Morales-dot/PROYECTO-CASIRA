// API functions for CASIRA - Connected to Render backend  
// Backend URL configuration
const BACKEND_URL = 'https://proyecto-casira.onrender.com';

// Global state management for mock data with localStorage persistence
class MockDataStore {
  constructor() {
    this.listeners = [];
    this.storageKey = 'casira-data';
    
    // Initialize core arrays to prevent undefined errors
    this.notifications = [];
    this.volunteers = [];
    this.comments = [];
    this.photos = [];
    this.likes = [];
    
    // Load data from localStorage or use defaults
    this.loadFromStorage();
  }

  // Default data
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
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 1234-5678",
          location: "Guatemala City, Guatemala",
          skills: ["Gestión de proyectos", "Liderazgo", "Administración"],
          experience: "5+ años en gestión comunitaria",
          created_at: "2024-01-01",
          activities_joined: [],
          total_hours: 0
        },
        {
          id: 2,
          email: "donante@ejemplo.com", 
          first_name: "María",
          last_name: "González",
          role: "donor",
          bio: "Empresaria comprometida con la educación en Guatemala",
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 9876-5432",
          location: "Antigua Guatemala",
          skills: ["Financiamiento", "Networking", "Gestión empresarial"],
          experience: "10+ años en sector privado",
          created_at: "2024-01-02",
          activities_joined: [],
          total_hours: 0
        },
        {
          id: 3,
          email: "carlos.martinez@email.com", 
          first_name: "Carlos",
          last_name: "Martínez",
          role: "volunteer",
          bio: "Estudiante universitario apasionado por ayudar a su comunidad",
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 5555-1234",
          location: "Guatemala City",
          skills: ["Educación", "Inglés", "Computación"],
          experience: "2 años como tutor voluntario",
          created_at: "2024-01-15",
          activities_joined: [],
          total_hours: 0
        },
        {
          id: 4,
          email: "ana.lopez@email.com", 
          first_name: "Ana",
          last_name: "López",
          role: "visitor",
          bio: "Interesada en conocer más sobre voluntariado",
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 7777-9999",
          location: "Quetzaltenango",
          skills: ["Cocina", "Organización"],
          experience: "Primera vez como voluntaria",
          created_at: "2024-02-20",
          activities_joined: [],
          total_hours: 0
        },
        {
          id: 5,
          email: "jose.garcia@email.com", 
          first_name: "José",
          last_name: "García",
          role: "visitor",
          bio: "Visitante interesado en las actividades de la organización",
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 2222-3333",
          location: "Huehuetenango",
          skills: ["Fotografía", "Redes sociales"],
          experience: "Nuevo en voluntariado",
          created_at: "2024-02-25",
          activities_joined: [],
          total_hours: 0
        },
        {
          id: 6,
          email: "lucia.morales@email.com", 
          first_name: "Lucía",
          last_name: "Morales",
          role: "visitor",
          bio: "Estudiante que quiere aprender sobre trabajo comunitario",
          avatar_url: "/grupo-canadienses.jpg",
          phone: "+502 8888-1111",
          location: "Antigua Guatemala",
          skills: ["Diseño", "Comunicación"],
          experience: "Sin experiencia previa",
          created_at: "2024-03-01",
          activities_joined: [],
          total_hours: 0
        }
      ],
      volunteers: [
        {
          id: 1,
          user_id: 2,
          activity_id: 1,
          status: "registered", // registered, confirmed, completed, cancelled
          role: "volunteer",
          registration_date: "2024-02-01",
          hours_contributed: 8,
          notes: "Muy entusiasmada por participar",
          skills_offered: ["Plantación", "Organización"]
        },
        {
          id: 2,
          user_id: 3,
          activity_id: 2,
          status: "registered",
          role: "volunteer",
          registration_date: "2024-02-10",
          hours_contributed: 0,
          notes: "Quiero ayudar en el programa alimentario",
          skills_offered: ["Organización", "Trabajo en equipo"]
        },
        {
          id: 3,
          user_id: 4,
          activity_id: 3,
          status: "pending",
          role: "volunteer",
          registration_date: "2024-02-25",
          hours_contributed: 0,
          notes: "Me interesa mucho la educación rural",
          skills_offered: ["Enseñanza", "Paciencia"]
        }
      ],
      comments: [
        {
          id: 1,
          activity_id: 1,
          user_id: 2,
          content: "¡Qué emocionante proyecto! Espero poder contribuir plantando muchos árboles.",
          created_at: "2024-02-15T10:30:00Z",
          likes: 5,
          replies: []
        },
        {
          id: 2,
          activity_id: 2,
          user_id: 1,
          content: "Estamos muy contentos de ver tanto interés en esta actividad. ¡Juntos lograremos grandes cosas!",
          created_at: "2024-02-16T14:20:00Z",
          likes: 8,
          replies: [
            {
              id: 3,
              user_id: 2,
              content: "¡Gracias por organizar esto!",
              created_at: "2024-02-16T15:00:00Z",
              likes: 2
            }
          ]
        }
      ],
      photos: [
        {
          id: 1,
          activity_id: 1,
          user_id: 2,
          url: "/grupo-canadienses.jpg",
          caption: "Primera jornada de reforestación - ¡Plantamos 50 árboles!",
          created_at: "2024-02-20T16:45:00Z",
          likes: 15
        },
        {
          id: 2,
          activity_id: 2,
          user_id: 1,
          url: "/grupo-canadienses.jpg",
          caption: "Distribución de alimentos a 30 familias",
          created_at: "2024-02-22T11:30:00Z",
          likes: 22
        }
      ],
      notifications: [
        // Start with empty notifications - they will be created dynamically
        // when users actually request to join activities
      ],
      activities: [
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
],
      categories: [
        { id: 1, name: "Medio Ambiente", color: "green", icon: "🌱" },
        { id: 2, name: "Alimentación", color: "orange", icon: "🍞" },
        { id: 3, name: "Educación", color: "blue", icon: "📚" },
        { id: 4, name: "Salud", color: "red", icon: "❤️" },
        { id: 5, name: "Vivienda", color: "purple", icon: "🏠" }
      ],
      stats: {
        active_projects: 2,
        completed_projects: 5,
        total_volunteers: 150,
        total_donations: 85000,
        lives_transformed: 225
      },
      posts: [
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
      ]
    };
  }

  // Load data from localStorage or use defaults
  loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') {
        console.log('localStorage not available, using default data');
        const defaultData = this.getDefaultData();
        this.activities = defaultData.activities;
        this.categories = defaultData.categories;
        this.stats = defaultData.stats;
        this.posts = defaultData.posts;
        return;
      }
      
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('DataStore: Loading from localStorage, activities found:', parsedData.activities?.length || 0);
        this.users = parsedData.users && parsedData.users.length > 0 ? parsedData.users : this.getDefaultData().users;
        this.volunteers = parsedData.volunteers || [];
        this.comments = parsedData.comments || [];
        this.photos = parsedData.photos || [];
        this.likes = parsedData.likes || [];
        
        // Handle notifications specially - don't fallback to defaults if they exist in storage
        if (parsedData.notifications !== undefined) {
          this.notifications = parsedData.notifications;
          console.log('DataStore: Loaded notifications from localStorage:', this.notifications.length);
        } else {
          this.notifications = this.getDefaultData().notifications;
          console.log('DataStore: No notifications in localStorage, using defaults');
        }
        this.activities = parsedData.activities && parsedData.activities.length > 0 ? parsedData.activities : this.getDefaultData().activities;
        this.categories = parsedData.categories && parsedData.categories.length > 0 ? parsedData.categories : this.getDefaultData().categories;
        this.stats = parsedData.stats || this.getDefaultData().stats;
        this.posts = parsedData.posts || this.getDefaultData().posts;
        console.log('DataStore: Final activities loaded:', this.activities.length);
      } else {
        // First time, use default data
        const defaultData = this.getDefaultData();
        this.users = defaultData.users;
        this.volunteers = defaultData.volunteers;
        this.comments = defaultData.comments;
        this.photos = defaultData.photos;
        this.likes = [];
        this.notifications = defaultData.notifications;
        this.activities = defaultData.activities;
        this.categories = defaultData.categories;
        this.stats = defaultData.stats;
        this.posts = defaultData.posts;
        this.saveToStorage(); // Save default data
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Fallback to default data
      const defaultData = this.getDefaultData();
      this.activities = defaultData.activities;
      this.categories = defaultData.categories;
      this.stats = defaultData.stats;
      this.posts = defaultData.posts;
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') {
        console.log('localStorage not available (Node.js environment)');
        return;
      }
      
      const dataToSave = {
        users: this.users,
        volunteers: this.volunteers,
        comments: this.comments,
        photos: this.photos,
        likes: this.likes || [],
        activities: this.activities,
        categories: this.categories,
        stats: this.stats,
        posts: this.posts,
        notifications: this.notifications || [],
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
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

  // Enhanced methods that notify changes and persist data
  addActivity(activity) {
    console.log('DataStore: Adding new activity:', activity.title, 'with visibility:', activity.visibility);
    this.activities.push(activity);
    console.log('DataStore: Total activities after adding:', this.activities.length);
    this.updateStats();
    this.saveToStorage();
    this.notify();
    
    // Auto-sync with backend if possible
    this.syncToBackend();
    
    return activity;
  }

  // Force data refresh (useful for debugging) - preserves notifications
  forceRefresh() {
    console.log('DataStore: Forcing refresh of all data (preserving notifications)');
    const defaultData = this.getDefaultData();
    
    // Preserve existing notifications to avoid losing admin decisions
    const existingNotifications = this.notifications || [];
    console.log('DataStore: Preserving', existingNotifications.length, 'existing notifications');
    
    this.users = [...defaultData.users];
    this.volunteers = [...defaultData.volunteers];
    this.activities = [...defaultData.activities];
    this.categories = [...defaultData.categories];
    
    // Only restore default notifications if we have none
    if (!this.notifications || this.notifications.length === 0) {
      this.notifications = [...defaultData.notifications];
      console.log('DataStore: No notifications exist, loading defaults');
    } else {
      console.log('DataStore: Keeping existing notifications, skipping defaults');
    }
    
    this.updateStats();
    this.saveToStorage();
    this.notify();
    console.log('DataStore: Refresh complete. Notifications preserved:', this.notifications.length);
  }

  updateActivity(id, updates) {
    const index = this.activities.findIndex(activity => activity.id == id);
    if (index !== -1) {
      this.activities[index] = { ...this.activities[index], ...updates };
      this.updateStats();
      this.saveToStorage();
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
      this.saveToStorage();
      this.notify();
      return true;
    }
    throw new Error('Activity not found');
  }

  // Method to add posts with persistence
  addPost(post) {
    this.posts.push(post);
    this.saveToStorage();
    this.notify();
    return post;
  }

  // Method to add categories with persistence
  addCategory(category) {
    this.categories.push(category);
    this.saveToStorage();
    this.notify();
    return category;
  }

  // Method to reset data to defaults (useful for testing)
  resetToDefaults() {
    const defaultData = this.getDefaultData();
    this.users = defaultData.users;
    this.volunteers = defaultData.volunteers;
    this.comments = defaultData.comments;
    this.photos = defaultData.photos;
    this.activities = defaultData.activities;
    this.categories = defaultData.categories;
    this.stats = defaultData.stats;
    this.posts = defaultData.posts;
    this.notifications = defaultData.notifications; // Reset notifications too
    this.updateStats();
    this.saveToStorage();
    this.notify();
  }

  // Clean existing localStorage and restart fresh
  cleanStorage() {
    console.log('DataStore: Cleaning localStorage and restarting fresh');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    
    // Load defaults fresh
    const defaultData = this.getDefaultData();
    this.users = defaultData.users;
    this.volunteers = defaultData.volunteers;
    this.comments = defaultData.comments;
    this.photos = defaultData.photos;
    this.activities = defaultData.activities;
    this.categories = defaultData.categories;
    this.stats = defaultData.stats;
    this.posts = defaultData.posts;
    this.notifications = defaultData.notifications;
    
    this.updateStats();
    this.saveToStorage();
    this.notify();
    console.log('DataStore: Clean restart complete');
  }

  // Sync data to backend (background operation)
  async syncToBackend() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Only sync if we have a valid token
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        console.log('DataStore: Backend available, data synced');
      }
    } catch (error) {
      console.log('DataStore: Backend not available, using local data only');
    }
  }
}

// Create global instance
const dataStore = new MockDataStore();

// ============= USER FUNCTIONS =============

export const usersAPI = {
  // Get user by ID
  getUserById: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.users.find(user => user.id == userId) || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Get user by email
  getUserByEmail: async (email) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = dataStore.users.findIndex(user => user.id == userId);
      if (index !== -1) {
        dataStore.users[index] = { ...dataStore.users[index], ...updates };
        dataStore.saveToStorage();
        dataStore.notify();
        return dataStore.users[index];
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newUser = {
        id: Date.now(),
        ...userData,
        created_at: new Date().toISOString(),
        activities_joined: [],
        total_hours: 0,
        avatar_url: userData.avatar_url || '/grupo-canadienses.jpg'
      };
      dataStore.users.push(newUser);
      dataStore.saveToStorage();
      dataStore.notify();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Block user
  blockUser: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = dataStore.users.find(u => u.id == userId);
      if (user) {
        user.status = 'blocked';
        user.blocked_at = new Date().toISOString();
        dataStore.saveToStorage();
        dataStore.notify();
        return user;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = dataStore.users.find(u => u.id == userId);
      if (user) {
        user.status = 'active';
        delete user.blocked_at;
        dataStore.saveToStorage();
        dataStore.notify();
        return user;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }
};

// ============= VOLUNTEER FUNCTIONS =============

export const volunteersAPI = {
  // Register for activity
  registerForActivity: async (userId, activityId, data = {}) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if already registered
      const existing = dataStore.volunteers.find(v => 
        v.user_id == userId && v.activity_id == activityId
      );
      
      if (existing) {
        throw new Error('Ya estás registrado en esta actividad');
      }

      // Get user role to determine initial status
      const user = dataStore.users.find(u => u.id == userId);
      const initialStatus = (user && user.role === 'visitor') ? 'pending' : 'registered';
      
      const registration = {
        id: Date.now(),
        user_id: userId,
        activity_id: activityId,
        status: initialStatus, // pending for visitors, registered for volunteers
        role: user?.role || 'volunteer',
        registration_date: new Date().toISOString(),
        hours_contributed: 0,
        notes: data.notes || '',
        skills_offered: data.skills_offered || []
      };
      
      console.log(`Creating registration for user ${user?.first_name} (${user?.role}) with status: ${initialStatus}`);

      dataStore.volunteers.push(registration);
      
      // Create notification for admin
      const activity = dataStore.activities.find(a => a.id == activityId);
      
      if (user && activity) {
        const notification = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'volunteer_request',
          user_id: userId,
          activity_id: activityId,
          message: `${user.first_name} ${user.last_name} solicita unirse a ${activity.title}`,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        
        dataStore.notifications.push(notification);
        console.log('Created notification for admin:', notification);
      }
      
      // Update activity participant count
      if (activity) {
        activity.current_volunteers = (activity.current_volunteers || 0) + 1;
      }
      
      dataStore.saveToStorage();
      dataStore.notify();
      
      console.log('Registration saved:', registration);
      console.log('Total volunteers now:', dataStore.volunteers.length);
      console.log('Total notifications now:', dataStore.notifications.length);
      
      return registration;
    } catch (error) {
      console.error('Error registering for activity:', error);
      throw error;
    }
  },

  // Get user's registrations
  getUserRegistrations: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const userRegistrations = dataStore.volunteers.filter(v => v.user_id == userId);
      console.log('API: Found', userRegistrations.length, 'registrations for user', userId);
      console.log('API: Registration statuses:', userRegistrations.map(r => ({activity_id: r.activity_id, status: r.status})));
      return userRegistrations;
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      return [];
    }
  },

  // Get activity volunteers
  getActivityVolunteers: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const volunteers = dataStore.volunteers.filter(v => v.activity_id == activityId);
      
      // Populate with user data
      return volunteers.map(volunteer => {
        const user = dataStore.users.find(u => u.id == volunteer.user_id);
        return {
          ...volunteer,
          user: user || null
        };
      });
    } catch (error) {
      console.error('Error fetching activity volunteers:', error);
      return [];
    }
  },

  // Update registration status
  updateRegistrationStatus: async (registrationId, status) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = dataStore.volunteers.findIndex(v => v.id == registrationId);
      if (index !== -1) {
        dataStore.volunteers[index].status = status;
        dataStore.saveToStorage();
        dataStore.notify();
        return dataStore.volunteers[index];
      }
      throw new Error('Registration not found');
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw error;
    }
  },

  // Get all registrations (for admin panel)
  getAllRegistrations: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.volunteers || [];
    } catch (error) {
      console.error('Error fetching all registrations:', error);
      return [];
    }
  },

  // Remove user from activity
  removeFromActivity: async (registrationId, activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove registration
      dataStore.volunteers = dataStore.volunteers.filter(v => v.id != registrationId);
      
      // Update activity participant count
      const activity = dataStore.activities.find(a => a.id == activityId);
      if (activity) {
        activity.current_volunteers = Math.max(0, (activity.current_volunteers || 0) - 1);
      }
      
      dataStore.saveToStorage();
      dataStore.notify();
      return true;
    } catch (error) {
      console.error('Error removing from activity:', error);
      throw error;
    }
  }
};

// ============= COMMENTS FUNCTIONS =============

export const commentsAPI = {
  // Get activity comments
  getActivityComments: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const comments = dataStore.comments.filter(c => c.activity_id == activityId);
      
      // Populate with user data
      return comments.map(comment => {
        const user = dataStore.users.find(u => u.id == comment.user_id);
        return {
          ...comment,
          user: user || { first_name: 'Usuario', last_name: 'Desconocido' }
        };
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  // Add comment
  addComment: async (activityId, userId, content) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newComment = {
        id: Date.now(),
        activity_id: activityId,
        user_id: userId,
        content: content,
        created_at: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      
      dataStore.comments.push(newComment);
      dataStore.saveToStorage();
      dataStore.notify();
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Like comment
  likeComment: async (commentId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const comment = dataStore.comments.find(c => c.id == commentId);
      if (comment) {
        comment.likes = (comment.likes || 0) + 1;
        dataStore.saveToStorage();
        dataStore.notify();
        return comment;
      }
      throw new Error('Comment not found');
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }
};

// ============= PHOTOS FUNCTIONS =============

export const photosAPI = {
  // Get activity photos
  getActivityPhotos: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const photos = dataStore.photos.filter(p => p.activity_id == activityId);
      
      // Populate with user data
      return photos.map(photo => {
        const user = dataStore.users.find(u => u.id == photo.user_id);
        return {
          ...photo,
          user: user || { first_name: 'Usuario', last_name: 'Desconocido' }
        };
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  },

  // Upload photo
  uploadPhoto: async (activityId, userId, photoData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newPhoto = {
        id: Date.now(),
        activity_id: activityId,
        user_id: userId,
        url: photoData.url,
        caption: photoData.caption || '',
        created_at: new Date().toISOString(),
        likes: 0
      };
      
      dataStore.photos.push(newPhoto);
      dataStore.saveToStorage();
      dataStore.notify();
      return newPhoto;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  // Like photo
  likePhoto: async (photoId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const photo = dataStore.photos.find(p => p.id == photoId);
      if (photo) {
        photo.likes = (photo.likes || 0) + 1;
        dataStore.saveToStorage();
        dataStore.notify();
        return photo;
      }
      throw new Error('Photo not found');
    } catch (error) {
      console.error('Error liking photo:', error);
      throw error;
    }
  }
};

// ============= NOTIFICATIONS FUNCTIONS =============

export const notificationsAPI = {
  // Get admin notifications (only pending ones)
  getAdminNotifications: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('API: Getting admin notifications, total:', dataStore.notifications?.length || 0);
      
      // Only return pending notifications
      const pendingNotifications = (dataStore.notifications || []).filter(n => n.status === 'pending');
      console.log('API: Pending notifications found:', pendingNotifications.length);
      console.log('API: Pending notification statuses:', pendingNotifications.map(n => ({id: n.id, status: n.status, message: n.message})));
      
      return pendingNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Create notification
  createNotification: async (notificationData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newNotification = {
        id: Date.now(),
        ...notificationData,
        created_at: new Date().toISOString()
      };
      
      if (!dataStore.notifications) {
        dataStore.notifications = [];
      }
      
      dataStore.notifications.push(newNotification);
      dataStore.saveToStorage();
      dataStore.notify();
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Update notification status
  updateNotificationStatus: async (notificationId, status) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const notification = dataStore.notifications?.find(n => n.id == notificationId);
      if (notification) {
        notification.status = status;
        dataStore.saveToStorage();
        dataStore.notify();
        return notification;
      }
      throw new Error('Notification not found');
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  // Approve volunteer request
  approveVolunteerRequest: async (notificationId) => {
    try {
      console.log('API: Approving volunteer request:', notificationId);
      
      const notification = dataStore.notifications?.find(n => n.id == notificationId);
      if (!notification) throw new Error('Notification not found');

      console.log('API: Found notification:', notification);

      // Update volunteer status
      const volunteer = dataStore.volunteers.find(v => 
        v.user_id == notification.user_id && v.activity_id == notification.activity_id
      );
      
      if (volunteer) {
        volunteer.status = 'confirmed'; // confirmed means approved by admin
        console.log('API: Updated volunteer status to confirmed:', volunteer);
      } else {
        console.log('API: Warning - No volunteer registration found for notification');
      }

      // Update notification status to approved (so it won't appear in pending list)
      notification.status = 'approved';
      console.log('API: Updated notification status to approved');
      
      dataStore.saveToStorage();
      dataStore.notify();
      
      console.log('API: Volunteer approval completed and saved');
      return { success: true, message: 'Voluntario aprobado exitosamente' };
    } catch (error) {
      console.error('Error approving volunteer:', error);
      throw error;
    }
  },

  // Reject volunteer request
  rejectVolunteerRequest: async (notificationId, reason = '') => {
    try {
      console.log('API: Rejecting volunteer request:', notificationId, 'with reason:', reason);
      
      const notification = dataStore.notifications?.find(n => n.id == notificationId);
      if (!notification) throw new Error('Notification not found');

      console.log('API: Found notification to reject:', notification);

      // Remove volunteer registration completely
      const beforeCount = dataStore.volunteers.length;
      dataStore.volunteers = dataStore.volunteers.filter(v => 
        !(v.user_id == notification.user_id && v.activity_id == notification.activity_id)
      );
      console.log('API: Removed volunteer registration. Before:', beforeCount, 'After:', dataStore.volunteers.length);

      // Update notification status to rejected (so it won't appear in pending list)
      notification.status = 'rejected';
      notification.rejection_reason = reason;
      console.log('API: Updated notification status to rejected');
      
      dataStore.saveToStorage();
      dataStore.notify();
      
      console.log('API: Volunteer rejection completed and saved');
      return { success: true, message: 'Solicitud rechazada' };
    } catch (error) {
      console.error('Error rejecting volunteer:', error);
      throw error;
    }
  }
};

// ============= PERMISSIONS FUNCTIONS =============

export const permissionsAPI = {
  // Check if user can perform action
  canUserPerform: (user, action, resource = null) => {
    if (!user) return false;
    
    const permissions = {
      // Admin permissions
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
      // Volunteer permissions (confirmed volunteers)
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
      // Visitor permissions (can interact but limited)
      visitor: {
        create_activity: false,
        edit_activity: false,
        delete_activity: false,
        manage_users: false,
        approve_volunteers: false,
        view_analytics: false,
        moderate_comments: false,
        upload_photos: false, // Visitors cannot upload photos
        comment: true, // Visitors CAN comment and interact
        like_posts: true, // Visitors CAN like posts and activities
        join_activities: true // And can request to join activities
      },
      // Donor permissions
      donor: {
        create_activity: false,
        edit_activity: false,
        delete_activity: false,
        manage_users: false,
        approve_volunteers: false,
        view_analytics: true, // Donors can see impact
        moderate_comments: false,
        upload_photos: true,
        comment: true,
        like_posts: true,
        join_activities: true
      }
    };
    
    return permissions[user.role]?.[action] || false;
  },

  // Get user role display
  getRoleDisplay: (role) => {
    const roles = {
      admin: { name: 'Administrador', color: 'purple', icon: '👑' },
      volunteer: { name: 'Voluntario', color: 'green', icon: '🤝' },
      visitor: { name: 'Visitante', color: 'blue', icon: '👀' },
      donor: { name: 'Donante', color: 'yellow', icon: '💝' }
    };
    
    return roles[role] || { name: 'Usuario', color: 'gray', icon: '👤' };
  },

  // Check activity participation limits
  canJoinActivity: (user, activity) => {
    if (!user || !activity) return { can: false, reason: 'Datos inválidos' };
    
    // Check if activity is full
    if (activity.max_volunteers && activity.current_volunteers >= activity.max_volunteers) {
      return { can: false, reason: 'Actividad llena' };
    }
    
    // Check if user is already registered
    const existingRegistration = dataStore.volunteers?.find(v => 
      v.user_id === user.id && v.activity_id === activity.id
    );
    
    if (existingRegistration) {
      return { can: false, reason: 'Ya estás registrado' };
    }
    
    // Visitors have limitations
    if (user.role === 'visitor') {
      const userRegistrations = dataStore.volunteers?.filter(v => v.user_id === user.id) || [];
      if (userRegistrations.length >= 2) { // Visitors can only join 2 activities
        return { can: false, reason: 'Los visitantes solo pueden unirse a 2 actividades. Crea una cuenta completa para más acceso.' };
      }
    }
    
    return { can: true, reason: 'Puede unirse' };
  }
};

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
  },

  // Get all users (for admin panel)
  getAllUsers: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return dataStore.users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  // Block user
  blockUser: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = dataStore.users.find(u => u.id == userId);
      if (user) {
        user.status = 'blocked';
        user.blocked_at = new Date().toISOString();
        dataStore.saveToStorage();
        dataStore.notify();
        return user;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = dataStore.users.find(u => u.id == userId);
      if (user) {
        user.status = 'active';
        delete user.blocked_at;
        dataStore.saveToStorage();
        dataStore.notify();
        return user;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }
};

// ============= ACTIVITIES FUNCTIONS =============

export const activitiesAPI = {
  // Get all public activities - hybrid approach (backend + fallback)
  getPublicActivities: async () => {
    console.log('API: getPublicActivities called');
    console.log('API: DataStore activities available:', dataStore.activities.length);
    
    // First ensure we have activities in dataStore
    if (!dataStore.activities || dataStore.activities.length === 0) {
      console.log('API: No activities in dataStore, forcing reload...');
      dataStore.forceRefresh();
    }
    
    try {
      // Try backend first with shorter timeout
      console.log('API: Attempting backend connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const backendData = await response.json();
        // Check if backendData is actually an array and has data
        if (Array.isArray(backendData) && backendData.length > 0) {
          console.log('API: Using backend data, found', backendData.length, 'activities');
          return backendData;
        } else {
          console.log('API: Backend returned empty or invalid data, falling back to mock');
          throw new Error('Backend data is invalid');
        }
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error) {
      // Fallback to mock data IMMEDIATELY
      console.log('API: Backend failed, using mock data. Error:', error.message);
      console.log('API: DataStore activities now:', dataStore.activities.length);
      
      // Ensure we have activities
      if (!dataStore.activities || dataStore.activities.length === 0) {
        console.log('API: DataStore still empty, forcing default data...');
        const defaultData = dataStore.getDefaultData();
        dataStore.activities = defaultData.activities;
        dataStore.saveToStorage();
      }
      
      // Return all activities (they're all public in our mock data)
      const publicActivities = dataStore.activities.filter(activity => 
        !activity.visibility || activity.visibility === 'public'
      );
      
      console.log('API: Returning', publicActivities.length, 'mock activities');
      console.log('API: Sample activity:', publicActivities[0]?.title);
      
      return publicActivities;
    }
  },

  // Get featured activities - using mock data
  getFeaturedActivities: async () => {
    try {
      console.log('API: getFeaturedActivities called');
      console.log('API: DataStore activities available:', dataStore.activities.length);
      
      // Ensure we have activities
      if (!dataStore.activities || dataStore.activities.length === 0) {
        console.log('API: No activities in dataStore for featured, forcing reload...');
        const defaultData = dataStore.getDefaultData();
        dataStore.activities = defaultData.activities;
        dataStore.saveToStorage();
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('API: Looking for featured activities in', dataStore.activities.length, 'total activities');
      
      // First try to get activities marked as featured
      let featuredActivities = dataStore.activities.filter(activity => activity.featured === true);
      
      // If no featured activities, return first 3 activities
      if (featuredActivities.length === 0) {
        featuredActivities = dataStore.activities.slice(0, 3);
        console.log('API: No featured activities found, returning first 3');
      }
      
      console.log('API: Returning', featuredActivities.length, 'featured activities');
      console.log('API: Featured titles:', featuredActivities.map(a => a.title));
      return featuredActivities.slice(0, 6);
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

  // Create new activity - hybrid approach
  createActivity: async (activityData) => {
    try {
      // Try backend first
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (response.ok) {
        const backendData = await response.json();
        console.log('API: Activity created on backend');
        return backendData;
      } else {
        throw new Error('Backend creation failed');
      }
    } catch (error) {
      // Fallback to mock data
      console.log('API: Backend failed, creating mock activity');
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: Date.now(),
        ...activityData,
        created_at: new Date().toISOString(),
        current_volunteers: 0,
        activity_participants: [],
        posts: []
      };
      return dataStore.addActivity(newActivity);
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
  },

  // Like activity
  likeActivity: async (activityId, userId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Initialize likes array if it doesn't exist
      if (!dataStore.likes) {
        dataStore.likes = [];
      }
      
      // Check if user already liked this activity
      const existingLike = dataStore.likes.find(l => 
        l.activity_id == activityId && l.user_id == userId
      );
      
      if (existingLike) {
        // Remove like (unlike)
        dataStore.likes = dataStore.likes.filter(l => l.id !== existingLike.id);
        dataStore.saveToStorage();
        dataStore.notify();
        return { liked: false, totalLikes: dataStore.likes.filter(l => l.activity_id == activityId).length };
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
        return { liked: true, totalLikes: dataStore.likes.filter(l => l.activity_id == activityId).length };
      }
    } catch (error) {
      console.error('Error liking activity:', error);
      throw error;
    }
  },

  // Get activity likes with user information
  getActivityLikes: async (activityId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!dataStore.likes) {
        dataStore.likes = [];
      }
      
      const activityLikes = dataStore.likes.filter(l => l.activity_id == activityId);
      
      // Populate with user data
      return activityLikes.map(like => {
        const user = dataStore.users.find(u => u.id == like.user_id);
        return {
          ...like,
          user: user || { first_name: 'Usuario', last_name: 'Desconocido' }
        };
      });
    } catch (error) {
      console.error('Error fetching activity likes:', error);
      return [];
    }
  },

  // Check if user liked activity
  hasUserLiked: async (activityId, userId) => {
    try {
      if (!dataStore.likes || !userId) {
        return false;
      }
      
      return dataStore.likes.some(l => l.activity_id == activityId && l.user_id == userId);
    } catch (error) {
      console.error('Error checking if user liked:', error);
      return false;
    }
  },

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
      return dataStore.addCategory(newCategory);
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
      return dataStore.addPost(newPost);
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

// Utility function to reset data (for development/testing)
export const resetDataToDefaults = () => {
  dataStore.resetToDefaults();
};

// Utility function to force refresh data (for debugging)
export const forceRefreshData = () => {
  dataStore.forceRefresh();
};

// Utility function to clean localStorage completely
export const cleanStorageData = () => {
  dataStore.cleanStorage();
};

// Export mock supabase object for compatibility
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOAuth: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null })
  }
};