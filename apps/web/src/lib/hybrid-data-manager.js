// ============= CASIRA Connect - Hybrid Data Manager =============
// Manages data between localStorage and Supabase for seamless experience

import { supabase } from './supabase-singleton.js';

class HybridDataManager {
  constructor() {
    this.isOnline = true;
    this.supabaseAvailable = true;
    this.syncInProgress = false;
  }

  // Check if Supabase is available
  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      this.supabaseAvailable = !error;
      console.log('🔗 CASIRA: Supabase connection:', this.supabaseAvailable ? '✅ Available' : '❌ Unavailable');
      return this.supabaseAvailable;
    } catch (error) {
      console.warn('⚠️ CASIRA: Supabase unavailable, using localStorage only');
      this.supabaseAvailable = false;
      return false;
    }
  }

  // Get all users (hybrid: localStorage + Supabase)
  async getAllUsers() {
    console.log('👥 CASIRA: Getting all users (hybrid mode)');
    
    const users = new Map(); // Use Map to avoid duplicates
    
    try {
      // Get users from localStorage first
      const localUsers = this.getLocalStorageUsers();
      localUsers.forEach(user => {
        users.set(user.id, {
          ...user,
          source: 'localStorage',
          isLocal: true
        });
      });
      
      console.log(`📦 Found ${localUsers.length} users in localStorage`);
      
      // Try to get users from Supabase
      if (await this.checkSupabaseConnection()) {
        const { data: supabaseUsers, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!error && supabaseUsers) {
          supabaseUsers.forEach(user => {
            // If user exists in localStorage, merge data
            const existing = users.get(user.id);
            if (existing) {
              users.set(user.id, {
                ...existing,
                ...user,
                source: 'both',
                supabaseData: user,
                localData: existing
              });
            } else {
              // New user from Supabase only
              users.set(user.id, {
                ...user,
                source: 'supabase',
                isSupabase: true
              });
            }
          });
          
          console.log(`🗃️ Found ${supabaseUsers.length} users in Supabase`);
        }
      }
      
      const allUsers = Array.from(users.values());
      console.log(`✅ Total users found: ${allUsers.length}`);
      
      return allUsers;
      
    } catch (error) {
      console.error('❌ CASIRA: Error getting users:', error);
      // Fallback to localStorage only
      return this.getLocalStorageUsers().map(user => ({
        ...user,
        source: 'localStorage'
      }));
    }
  }

  // Get users from localStorage
  getLocalStorageUsers() {
    try {
      const users = JSON.parse(localStorage.getItem('casira-users') || '[]');
      const googleUsers = JSON.parse(localStorage.getItem('casira-google-users') || '[]');
      
      // Combine regular users and Google users
      const allLocalUsers = [];
      
      // Add regular users
      users.forEach(user => {
        allLocalUsers.push({
          ...user,
          auth_provider: user.auth_provider || 'internal',
          role: user.role || 'visitor'
        });
      });
      
      // Add Google users
      googleUsers.forEach(googleUser => {
        // Check if already exists
        const exists = allLocalUsers.find(u => u.id === googleUser.id || u.email === googleUser.email);
        if (!exists) {
          allLocalUsers.push({
            id: googleUser.id || `google_${Date.now()}_${Math.random()}`,
            email: googleUser.email,
            first_name: googleUser.given_name || googleUser.first_name || '',
            last_name: googleUser.family_name || googleUser.last_name || '',
            full_name: googleUser.name || googleUser.full_name || googleUser.email,
            avatar_url: googleUser.picture || googleUser.avatar_url,
            auth_provider: 'google',
            role: 'visitor',
            created_at: googleUser.created_at || new Date().toISOString(),
            source: 'localStorage_google'
          });
        }
      });
      
      return allLocalUsers;
    } catch (error) {
      console.error('❌ CASIRA: Error reading localStorage users:', error);
      return [];
    }
  }

  // Sync localStorage users to Supabase
  async syncUsersToSupabase() {
    if (this.syncInProgress) {
      console.log('🔄 CASIRA: Sync already in progress');
      return;
    }
    
    this.syncInProgress = true;
    console.log('🔄 CASIRA: Starting user sync to Supabase');
    
    try {
      if (!await this.checkSupabaseConnection()) {
        console.warn('⚠️ CASIRA: Supabase unavailable, skipping sync');
        return;
      }
      
      const localUsers = this.getLocalStorageUsers();
      const synced = [];
      const errors = [];
      
      for (const user of localUsers) {
        try {
          // Prepare user data for Supabase
          const userData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            full_name: user.full_name || user.email,
            avatar_url: user.avatar_url,
            role: user.role || 'visitor',
            auth_provider: user.auth_provider || 'internal',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Upsert user
          const { data, error } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' })
            .select()
            .single();
            
          if (error) {
            console.error(`❌ CASIRA: Error syncing user ${user.email}:`, error);
            errors.push({ user: user.email, error: error.message });
          } else {
            console.log(`✅ CASIRA: Synced user ${user.email}`);
            synced.push(data);
          }
          
        } catch (userError) {
          console.error(`❌ CASIRA: Exception syncing user ${user.email}:`, userError);
          errors.push({ user: user.email, error: userError.message });
        }
      }
      
      console.log(`🎉 CASIRA: Sync completed - ${synced.length} synced, ${errors.length} errors`);
      
      return {
        synced: synced.length,
        errors: errors.length,
        syncedUsers: synced,
        errorDetails: errors
      };
      
    } catch (error) {
      console.error('❌ CASIRA: Error during sync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get all activities (hybrid mode)
  async getAllActivities() {
    console.log('🎯 CASIRA: Getting all activities (hybrid mode)');
    
    try {
      // Try Supabase first
      if (await this.checkSupabaseConnection()) {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            *,
            creator:users!activities_created_by_fkey(
              id,
              first_name,
              last_name,
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });
          
        if (!error && data && data.length > 0) {
          console.log(`🗃️ Found ${data.length} activities in Supabase`);
          return data;
        }
      }
      
      // Fallback to localStorage
      const localActivities = JSON.parse(localStorage.getItem('casira-activities') || '[]');
      console.log(`📦 Found ${localActivities.length} activities in localStorage`);
      
      return localActivities.map(activity => ({
        ...activity,
        source: 'localStorage'
      }));
      
    } catch (error) {
      console.error('❌ CASIRA: Error getting activities:', error);
      return [];
    }
  }

  // Update user role (works with both localStorage and Supabase)
  async updateUserRole(userId, newRole) {
    console.log(`👤 CASIRA: Updating user ${userId} role to ${newRole}`);
    
    try {
      // Update in Supabase if available
      if (await this.checkSupabaseConnection()) {
        const { data, error } = await supabase
          .from('users')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
          
        if (!error) {
          console.log(`✅ CASIRA: Updated user role in Supabase`);
        }
      }
      
      // Update in localStorage
      const users = JSON.parse(localStorage.getItem('casira-users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].role = newRole;
        users[userIndex].updated_at = new Date().toISOString();
        localStorage.setItem('casira-users', JSON.stringify(users));
        console.log(`✅ CASIRA: Updated user role in localStorage`);
      }
      
      // Also check Google users
      const googleUsers = JSON.parse(localStorage.getItem('casira-google-users') || '[]');
      const googleUserIndex = googleUsers.findIndex(u => u.id === userId);
      if (googleUserIndex !== -1) {
        googleUsers[googleUserIndex].role = newRole;
        localStorage.setItem('casira-google-users', JSON.stringify(googleUsers));
        console.log(`✅ CASIRA: Updated Google user role in localStorage`);
      }
      
      return { success: true, role: newRole };
      
    } catch (error) {
      console.error('❌ CASIRA: Error updating user role:', error);
      throw error;
    }
  }

  // Get user by ID (hybrid mode)
  async getUserById(userId) {
    console.log(`👤 CASIRA: Getting user ${userId}`);
    
    try {
      // Try Supabase first
      if (await this.checkSupabaseConnection()) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!error && data) {
          console.log(`✅ CASIRA: Found user in Supabase`);
          return { ...data, source: 'supabase' };
        }
      }
      
      // Fallback to localStorage
      const localUsers = this.getLocalStorageUsers();
      const user = localUsers.find(u => u.id === userId);
      if (user) {
        console.log(`✅ CASIRA: Found user in localStorage`);
        return { ...user, source: 'localStorage' };
      }
      
      console.log(`❌ CASIRA: User ${userId} not found`);
      return null;
      
    } catch (error) {
      console.error('❌ CASIRA: Error getting user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const hybridDataManager = new HybridDataManager();

// Convenience functions
export const getAllUsers = () => hybridDataManager.getAllUsers();
export const syncUsersToSupabase = () => hybridDataManager.syncUsersToSupabase();
export const updateUserRole = (userId, role) => hybridDataManager.updateUserRole(userId, role);
export const getUserById = (userId) => hybridDataManager.getUserById(userId);

export default hybridDataManager;