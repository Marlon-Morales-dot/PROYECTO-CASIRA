// ============= CASIRA Auth Service - Centralized Authentication =============
import apiClient from '../axios-config.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadCurrentUser();
  }

  // ============= LOCAL AUTHENTICATION =============
  
  async login(email, password) {
    try {
      console.log('🔐 AuthService: Attempting login for:', email);

      // For development/demo - use local storage users
      const users = this.getStoredUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('Usuario no encontrado. ¿Necesitas registrarte?');
      }

      // Demo password validation
      const validPasswords = ['admin123', 'demo123', 'casira123', '123'];
      if (!validPasswords.includes(password)) {
        throw new Error('Contraseña incorrecta');
      }

      // Update last login
      user.last_login = new Date().toISOString();
      this.updateStoredUser(user);

      // Set as current user
      this.setCurrentUser(user);

      console.log('✅ AuthService: Login successful for:', user.email);
      return user;

    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      console.log('📝 AuthService: Attempting registration for:', userData.email);

      const users = this.getStoredUsers();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Create new user - ALL new users are visitors by default
      const newUser = {
        id: Date.now(),
        email: userData.email,
        first_name: userData.first_name || 'Usuario',
        last_name: userData.last_name || 'Nuevo',
        role: userData.email === 'admin@casira.org' ? 'admin' : 'visitor',
        provider: 'local',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        status: 'active',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.first_name} ${userData.last_name}`
      };

      // Store new user
      users.push(newUser);
      this.saveUsers(users);

      // Set as current user
      this.setCurrentUser(newUser);

      console.log('✅ AuthService: Registration successful:', newUser.email);
      return newUser;

    } catch (error) {
      console.error('❌ AuthService: Registration error:', error);
      throw error;
    }
  }

  logout() {
    console.log('🚪 AuthService: User logout');
    this.currentUser = null;
    localStorage.removeItem('casira-current-user');
    sessionStorage.removeItem('casira-current-user');
    return true;
  }

  // ============= GOOGLE AUTHENTICATION =============

  async authenticateWithGoogle(googleUserData) {
    try {
      console.log('🔐 AuthService: Google authentication for:', googleUserData.email);

      const users = this.getStoredUsers();
      let user = users.find(u => 
        u.email === googleUserData.email || 
        (u.googleId && u.googleId === googleUserData.id)
      );

      if (user) {
        // Update existing user with Google data
        user = {
          ...user,
          ...googleUserData,
          role: user.role || 'visitor', // Keep existing role or default to visitor
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
      } else {
        // Create new Google user - default to visitor
        user = {
          ...googleUserData,
          id: Date.now(),
          googleId: googleUserData.id,
          role: googleUserData.email === 'admin@casira.org' ? 'admin' : 'visitor',
          provider: 'google',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          status: 'active'
        };
        users.push(user);
      }

      this.updateStoredUser(user);
      this.setCurrentUser(user);

      console.log('✅ AuthService: Google auth successful:', user.email);
      return user;

    } catch (error) {
      console.error('❌ AuthService: Google auth error:', error);
      throw error;
    }
  }

  // ============= USER MANAGEMENT =============

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      const userString = JSON.stringify(user);
      localStorage.setItem('casira-current-user', userString);
      sessionStorage.setItem('casira-current-user', userString);
      console.log('✅ AuthService: Current user set:', user.email);
    } else {
      localStorage.removeItem('casira-current-user');
      sessionStorage.removeItem('casira-current-user');
      console.log('🚪 AuthService: Current user cleared');
    }
  }

  loadCurrentUser() {
    try {
      const userData = localStorage.getItem('casira-current-user') || 
                      sessionStorage.getItem('casira-current-user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        console.log('📦 AuthService: Current user loaded:', this.currentUser.email);
      }
    } catch (error) {
      console.error('❌ AuthService: Error loading current user:', error);
      this.currentUser = null;
    }
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  hasRole(role) {
    return this.currentUser?.role === role;
  }

  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    const rolePermissions = {
      admin: ['all'],
      volunteer: ['view_activities', 'comment', 'join_activities', 'upload_photos'],
      visitor: ['view_activities', 'comment', 'join_activities'], 
      donor: ['view_activities', 'comment', 'view_analytics', 'upload_photos']
    };

    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  // ============= STORAGE HELPERS =============

  getStoredUsers() {
    try {
      const usersData = localStorage.getItem('casira-data');
      if (usersData) {
        const data = JSON.parse(usersData);
        return data.users || this.getDefaultUsers();
      }
      return this.getDefaultUsers();
    } catch (error) {
      console.error('Error getting stored users:', error);
      return this.getDefaultUsers();
    }
  }

  saveUsers(users) {
    try {
      let casiraData = {};
      const existingData = localStorage.getItem('casira-data');
      if (existingData) {
        casiraData = JSON.parse(existingData);
      }
      casiraData.users = users;
      localStorage.setItem('casira-data', JSON.stringify(casiraData));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  updateStoredUser(updatedUser) {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    this.saveUsers(users);
  }

  getDefaultUsers() {
    return [
      {
        id: 1,
        email: "admin@casira.org",
        first_name: "Administrador",
        last_name: "CASIRA", 
        role: "admin",
        provider: "local",
        bio: "Administrador principal de la plataforma CASIRA Connect",
        created_at: "2024-01-01",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Admin CASIRA"
      },
      {
        id: 2,
        email: "donante@ejemplo.com",
        first_name: "María",
        last_name: "González",
        role: "donor", 
        provider: "local",
        bio: "Empresaria comprometida con la educación en Guatemala",
        created_at: "2024-01-15",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Maria Gonzalez"
      },
      {
        id: 3,
        email: "carlos.martinez@email.com",
        first_name: "Carlos",
        last_name: "Martínez",
        role: "volunteer",
        provider: "local", 
        bio: "Ingeniero apasionado por la educación",
        created_at: "2024-02-01",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Carlos Martinez"
      },
      {
        id: 4,
        email: "ana.lopez@email.com", 
        first_name: "Ana",
        last_name: "López",
        role: "visitor",
        provider: "local",
        bio: "Interesada en contribuir a la comunidad",
        location: "Quetzaltenango",
        skills: ["Cocina", "Organización"],
        created_at: "2024-02-15",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Ana Lopez"
      }
    ];
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };