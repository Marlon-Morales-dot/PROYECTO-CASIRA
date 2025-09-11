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
      console.log('🔐 AuthService: Attempting unified login for:', email);

      // STEP 1: Try Supabase authentication first
      try {
        const { supabaseAPI } = await import('../supabase-api.js');
        const supabaseUser = await supabaseAPI.users.getUserByEmail(email);
        
        if (supabaseUser) {
          console.log('👤 Found user in Supabase, validating password...');
          
          // Real password validation for specific users
          const isValidPassword = this.validatePassword(email, password);
          if (!isValidPassword) {
            throw new Error('Contraseña incorrecta');
          }

          // Skip updating last_login in Supabase to avoid field errors
          console.log('⚠️ Skipping last_login update in Supabase (field may not exist)');

          // Convert Supabase user format to local format
          const unifiedUser = this.convertSupabaseToLocalUser(supabaseUser);
          this.setCurrentUser(unifiedUser);
          
          console.log('✅ AuthService: Supabase login successful for:', unifiedUser.email);
          return unifiedUser;
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase auth failed, trying local fallback:', supabaseError.message);
      }

      // STEP 2: Fallback to local storage users
      const users = this.getStoredUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('Usuario no encontrado. ¿Necesitas registrarte?');
      }

      // Real password validation
      const isValidPassword = this.validatePassword(email, password);
      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Update last login
      user.last_login = new Date().toISOString();
      this.updateStoredUser(user);

      // Try to sync to Supabase with detailed logging
      try {
        console.log('🔌 CASIRA: Testing Supabase connection...');
        const { supabaseAPI } = await import('../supabase-api.js');
        console.log('✅ CASIRA: Supabase API imported successfully');
        console.log('🔄 CASIRA: Attempting to sync user to Supabase:', user.email);
        
        // First check if user exists in Supabase
        const existingUser = await supabaseAPI.users.getUserByEmail(user.email);
        
        if (existingUser) {
          console.log('👤 CASIRA: User already exists in Supabase, updating last_login');
          // User exists, update last login
          const result = await supabaseAPI.users.updateUser(existingUser.id, {
            last_login: new Date().toISOString()
          });
          console.log('✅ CASIRA: User updated in Supabase:', result);
        } else {
          console.log('➕ CASIRA: Creating new user in Supabase');
          console.log('🔍 CASIRA: User data for Supabase sync:', {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            bio: user.bio,
            avatar_url: user.avatar_url
          });
          
          const result = await supabaseAPI.users.createUser(user);
          console.log('✅ CASIRA: New user created in Supabase:', result);
        }
      } catch (syncError) {
        console.error('❌ CASIRA: Could not sync user to Supabase:', syncError);
        console.error('❌ CASIRA: Sync error details:', {
          message: syncError.message,
          code: syncError.code,
          details: syncError.details,
          hint: syncError.hint
        });
      }

      // Set as current user
      this.setCurrentUser(user);

      console.log('✅ AuthService: Local login successful for:', user.email);
      return user;

    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      throw error;
    }
  }

  validatePassword(email, password) {
    // Define real passwords for each user - SOLO 3 ROLES: visitor, volunteer, admin
    const userPasswords = {
      'admin@casira.org': 'admin123',
      'carlos.martinez@email.com': 'carlos123', // volunteer
      'ana.lopez@email.com': 'ana123' // visitor
    };

    // Check if user has a specific password
    if (userPasswords[email]) {
      return userPasswords[email] === password;
    }

    // Default passwords for new users or demo
    const defaultPasswords = ['demo123', 'casira123'];
    return defaultPasswords.includes(password);
  }

  convertSupabaseToLocalUser(supabaseUser) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      first_name: supabaseUser.first_name,
      last_name: supabaseUser.last_name,
      role: supabaseUser.role,
      bio: supabaseUser.bio || '',
      avatar_url: supabaseUser.avatar_url,
      provider: 'supabase',
      created_at: supabaseUser.created_at,
      last_login: new Date().toISOString(),
      status: 'active',
      supabase_id: supabaseUser.id
    };
  }

  async register(userData) {
    try {
      console.log('📝 AuthService: Attempting registration for:', userData.email);

      const users = this.getStoredUsers();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Create new user - ALL new users are visitors by default (SOLO 3 ROLES)
      const newUser = {
        id: Date.now(),
        email: userData.email,
        first_name: userData.first_name || 'Usuario',
        last_name: userData.last_name || 'Nuevo',
        role: this.determineUserRole(userData.email, null),
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
      console.log('🔐 AuthService: Unified Google authentication for:', googleUserData.email);

      // STEP 1: Try to find/create user in Supabase first
      try {
        const { supabaseAPI } = await import('../supabase-api.js');
        let supabaseUser = await supabaseAPI.users.getUserByEmail(googleUserData.email);
        
        if (supabaseUser) {
          console.log('👤 Found existing user in Supabase, updating with Google data...');
          // Update existing Supabase user with latest Google info
          supabaseUser = await supabaseAPI.users.updateUser(supabaseUser.id, {
            avatar_url: googleUserData.avatar_url || googleUserData.picture,
            last_login: new Date().toISOString(),
            provider: 'google'
          });
        } else {
          console.log('👤 Creating new Google user in Supabase...');
          // Create new user in Supabase
          supabaseUser = await supabaseAPI.users.createUser({
            email: googleUserData.email,
            first_name: googleUserData.first_name || googleUserData.given_name,
            last_name: googleUserData.last_name || googleUserData.family_name,
            role: this.determineUserRole(googleUserData.email, googleUserData.id), // SOLO 3 ROLES
            bio: `Usuario registrado vía Google Auth`,
            avatar_url: googleUserData.avatar_url || googleUserData.picture,
            provider: 'google'
          });
        }

        // Convert to unified format and set as current user
        const unifiedUser = this.convertSupabaseToLocalUser(supabaseUser);
        unifiedUser.provider = 'google';
        unifiedUser.google_id = googleUserData.id;
        
        this.setCurrentUser(unifiedUser);
        
        // Also save to local storage for offline access
        this.updateStoredUser(unifiedUser);
        
        console.log('✅ AuthService: Google + Supabase auth successful:', unifiedUser.email);
        return unifiedUser;
        
      } catch (supabaseError) {
        console.log('⚠️ Supabase Google auth failed, using local fallback:', supabaseError.message);
      }

      // STEP 2: Fallback to local storage
      const users = this.getStoredUsers();
      let user = users.find(u => 
        u.email === googleUserData.email || 
        (u.google_id && u.google_id === googleUserData.id)
      );

      if (user) {
        // Update existing user with Google data
        user = {
          ...user,
          ...googleUserData,
          google_id: googleUserData.id,
          role: user.role || (googleUserData.email === 'admin@casira.org' ? 'admin' : 'visitor'),
          provider: 'google',
          last_login: new Date().toISOString()
        };
      } else {
        // Create new Google user
        user = {
          id: Date.now(),
          email: googleUserData.email,
          first_name: googleUserData.first_name || googleUserData.given_name,
          last_name: googleUserData.last_name || googleUserData.family_name,
          full_name: googleUserData.name,
          avatar_url: googleUserData.avatar_url || googleUserData.picture,
          google_id: googleUserData.id,
          role: this.determineUserRole(googleUserData.email, googleUserData.id), // SOLO 3 ROLES - Google users son visitors por defecto
          provider: 'google',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          status: 'active',
          bio: 'Usuario registrado vía Google Auth'
        };
        users.push(user);
      }

      this.updateStoredUser(user);
      this.setCurrentUser(user);

      console.log('✅ AuthService: Google local auth successful:', user.email);
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
    
    // SOLO 3 ROLES: visitor, volunteer, admin
    const rolePermissions = {
      admin: ['all'], // Admins pueden hacer todo
      volunteer: ['view_activities', 'comment', 'join_activities', 'upload_photos'],
      visitor: ['view_activities', 'comment', 'join_activities'] // Permisos básicos
    };

    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  determineUserRole(email, userId = null) {
    // SOLO 3 ROLES: visitor (default), volunteer, admin
    if (email === 'admin@casira.org') return 'admin';
    if (email === 'mmoralesc54@miumg.edu.gt') return 'admin'; // Admin por email
    if (userId === '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6') return 'admin'; // Admin por ID
    if (userId === '112338454180458924045') return 'admin'; // Admin por Google ID
    if (email === 'carlos.martinez@email.com') return 'volunteer';
    // Todos los demás (incluidos Google users) son visitors por defecto
    return 'visitor';
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
    // SOLO 3 ROLES: visitor, volunteer, admin
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
        email: "carlos.martinez@email.com",
        first_name: "Carlos",
        last_name: "Martínez",
        role: "volunteer",
        provider: "local", 
        bio: "Voluntario comprometido con la comunidad",
        created_at: "2024-02-01",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Carlos Martinez"
      },
      {
        id: 3,
        email: "ana.lopez@email.com", 
        first_name: "Ana",
        last_name: "López",
        role: "visitor",
        provider: "local",
        bio: "Visitante interesada en conocer las actividades",
        location: "Quetzaltenango",
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