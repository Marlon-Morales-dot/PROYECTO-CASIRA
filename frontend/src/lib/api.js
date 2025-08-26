// API functions for CASIRA database operations
// Todas las operaciones con Supabase centralizadas aquí

import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallbacks and validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============= AUTH FUNCTIONS =============

export const authAPI = {
  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        // Get user profile from our users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        return { ...user, profile };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  // Create or update user profile
  upsertUserProfile: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  },

  // Check if user is admin
  isAdmin: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};

// ============= ACTIVITIES FUNCTIONS =============

export const activitiesAPI = {
  // Get all public activities
  getPublicActivities: async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_categories (id, name, color, icon),
          users!activities_created_by_fkey (first_name, last_name),
          activity_participants (id, status),
          posts (id, created_at)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public activities:', error);
      throw error;
    }
  },

  // Get featured activities
  getFeaturedActivities: async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_categories (id, name, color, icon),
          users!activities_created_by_fkey (first_name, last_name)
        `)
        .eq('visibility', 'public')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      throw error;
    }
  },

  // Get activity by ID
  getActivityById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_categories (id, name, color, icon),
          users!activities_created_by_fkey (id, first_name, last_name, avatar_url),
          activity_participants (
            id, status, role, hours_contributed,
            users (id, first_name, last_name, avatar_url)
          ),
          events (id, title, event_date, max_attendees, current_attendees),
          resources (id, name, quantity_needed, quantity_available, status)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  },

  // Create new activity (admin only)
  createActivity: async (activityData) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // Update activity (admin only)
  updateActivity: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete activity (admin only)
  deleteActivity: async (id) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Join activity as volunteer
  joinActivity: async (activityId, userId, role = 'volunteer') => {
    try {
      const { data, error } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: activityId,
          user_id: userId,
          role: role,
          status: 'registered'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update activity's current_volunteers count
      await supabase.rpc('increment_activity_volunteers', { activity_id: activityId });
      
      return data;
    } catch (error) {
      console.error('Error joining activity:', error);
      throw error;
    }
  }
};

// ============= CATEGORIES FUNCTIONS =============

export const categoriesAPI = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Create category (admin only)
  createCategory: async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
};

// ============= POSTS FUNCTIONS =============

export const postsAPI = {
  // Get posts for an activity
  getActivityPosts: async (activityId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (id, first_name, last_name, avatar_url),
          comments (
            id, content, created_at,
            users!comments_author_id_fkey (first_name, last_name, avatar_url)
          )
        `)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get all public posts for feed
  getPublicPosts: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (id, first_name, last_name, avatar_url),
          activities (id, title, status)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public posts:', error);
      throw error;
    }
  },

  // Create new post
  createPost: async (postData) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
};

// ============= EVENTS FUNCTIONS =============

export const eventsAPI = {
  // Get events for an activity
  getActivityEvents: async (activityId) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants (
            id, status,
            users (id, first_name, last_name, avatar_url)
          )
        `)
        .eq('activity_id', activityId)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Join event
  joinEvent: async (eventId, userId) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'registered'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  }
};

// ============= STATISTICS FUNCTIONS =============

export const statsAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const [activitiesResponse, volunteersResponse, donationsResponse] = await Promise.all([
        supabase.from('activities').select('status', { count: 'exact' }),
        supabase.from('activity_participants').select('id', { count: 'exact' }),
        supabase.from('donations').select('amount').eq('status', 'completed')
      ]);

      const activeActivities = activitiesResponse.data?.filter(a => a.status === 'active').length || 0;
      const completedActivities = activitiesResponse.data?.filter(a => a.status === 'completed').length || 0;
      const totalVolunteers = volunteersResponse.count || 0;
      
      const totalDonations = donationsResponse.data?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0;

      return {
        active_projects: activeActivities,
        completed_projects: completedActivities,
        total_volunteers: totalVolunteers,
        total_donations: totalDonations,
        lives_transformed: Math.floor(totalVolunteers * 1.5) // Estimación
      };
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

// Export default supabase client for direct use
export { supabase };