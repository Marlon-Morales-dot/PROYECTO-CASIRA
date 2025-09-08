// ============= CASIRA Connect - Unified Authentication System =============
import { supabase, supabaseAuth } from './supabase-singleton.js';

// User roles
export const USER_ROLES = {
  VISITOR: 'visitor',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin'
};

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '967773095495-j2n4prhpmh0dfgcdvtrt1cbqem1bms7g.apps.googleusercontent.com';

export class UnifiedAuth {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initializeAuth();
  }

  async initializeAuth() {
    console.log('🔧 CASIRA Unified Auth: Initializing...');
    
    // Listen to Supabase auth changes
    supabaseAuth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.handleSupabaseSignIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        await this.handleSignOut();
      }
    });

    // Check current session
    const user = await supabaseAuth.getCurrentUser();
    if (user) {
      await this.handleSupabaseSignIn(user);
    }
  }

  async handleSupabaseSignIn(supabaseUser) {
    console.log('🔐 CASIRA: Processing Supabase sign in for:', supabaseUser.email);
    
    try {
      // Create/update user profile in Supabase
      const userProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.given_name || '',
        last_name: supabaseUser.user_metadata?.family_name || '',
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email,
        avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
        role: USER_ROLES.VISITOR, // Default role for Google auth users
        auth_provider: 'google',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upsert user profile
      const { data, error } = await supabase
        .from('users')
        .upsert(userProfile, { onConflict: 'id' })
        .select()
        .single();
        
      if (error) {
        console.error('❌ CASIRA: Error upserting user profile:', error);
      } else {
        console.log('✅ CASIRA: User profile updated:', data.email);
      }

      this.currentUser = {
        ...supabaseUser,
        profile: data || userProfile,
        role: data?.role || USER_ROLES.VISITOR
      };
      
      this.notifyListeners('SIGNED_IN', this.currentUser);
      
    } catch (error) {
      console.error('❌ CASIRA: Error handling sign in:', error);
    }
  }

  async handleSignOut() {
    console.log('👋 CASIRA: User signed out');
    this.currentUser = null;
    this.notifyListeners('SIGNED_OUT', null);
  }

  // Google Sign In (for visitors)
  async signInWithGoogle() {
    console.log('🔐 CASIRA: Starting Google sign in...');
    try {
      return await supabaseAuth.signInWithGoogle();
    } catch (error) {
      console.error('❌ CASIRA: Google sign in failed:', error);
      throw error;
    }
  }

  // Admin can promote visitor to volunteer
  async promoteToVolunteer(userId) {
    if (!this.currentUser || this.currentUser.role !== USER_ROLES.ADMIN) {
      throw new Error('Only admins can promote users to volunteer');
    }

    console.log('📈 CASIRA: Promoting user to volunteer:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: USER_ROLES.VOLUNTEER,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error promoting user:', error);
      throw error;
    }
    
    console.log('✅ CASIRA: User promoted to volunteer:', data.email);
    return data;
  }

  // Admin can demote volunteer to visitor
  async demoteToVisitor(userId) {
    if (!this.currentUser || this.currentUser.role !== USER_ROLES.ADMIN) {
      throw new Error('Only admins can demote users');
    }

    console.log('📉 CASIRA: Demoting user to visitor:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: USER_ROLES.VISITOR,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error demoting user:', error);
      throw error;
    }
    
    console.log('✅ CASIRA: User demoted to visitor:', data.email);
    return data;
  }

  // Get all users with their roles (admin only)
  async getAllUsers() {
    if (!this.currentUser || this.currentUser.role !== USER_ROLES.ADMIN) {
      throw new Error('Only admins can view all users');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ CASIRA: Error fetching users:', error);
      throw error;
    }
    
    return data || [];
  }

  // Sign out
  async signOut() {
    console.log('👋 CASIRA: Signing out...');
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error('❌ CASIRA: Sign out error:', error);
      throw error;
    }
  }

  // Auth state listeners
  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event, user) {
    this.authListeners.forEach(callback => {
      try {
        callback(event, user);
      } catch (error) {
        console.error('❌ CASIRA: Error in auth listener:', error);
      }
    });
  }

  // Utilities
  getCurrentUser() {
    return this.currentUser;
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  hasRole(role) {
    return this.currentUser?.role === role;
  }

  isAdmin() {
    return this.hasRole(USER_ROLES.ADMIN);
  }

  isVolunteer() {
    return this.hasRole(USER_ROLES.VOLUNTEER);
  }

  isVisitor() {
    return this.hasRole(USER_ROLES.VISITOR);
  }

  canManageUsers() {
    return this.isAdmin();
  }

  canCreateActivities() {
    return this.isAdmin() || this.isVolunteer();
  }

  canJoinActivities() {
    return this.isVolunteer() || this.isVisitor();
  }
}

// Export singleton instance
export const unifiedAuth = new UnifiedAuth();

// Convenience functions
export const getCurrentUser = () => unifiedAuth.getCurrentUser();
export const signInWithGoogle = () => unifiedAuth.signInWithGoogle();
export const signOut = () => unifiedAuth.signOut();
export const onAuthStateChange = (callback) => unifiedAuth.onAuthStateChange(callback);

export default unifiedAuth;