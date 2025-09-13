// ============= CASIRA Connect - Supabase Singleton =============
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CASIRA: Missing Supabase environment variables');
}

// Singleton pattern - solo una instancia de Supabase
let supabaseInstance = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🚀 CASIRA: Creating Supabase client instance');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'casira-supabase-auth',
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    });
  }
  return supabaseInstance;
};

// Export default instance
export const supabase = getSupabaseClient();

// Auth helpers
export const supabaseAuth = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ CASIRA Auth: Error getting current user:', error);
      return null;
    }
    return user;
  },

  signInWithGoogle: async () => {
    console.log('🔐 CASIRA Auth: Signing in with Google');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/visitor`
      }
    });
    
    if (error) {
      console.error('❌ CASIRA Auth: Google sign in error:', error);
      throw error;
    }
    
    return data;
  },

  signOut: async () => {
    console.log('👋 CASIRA Auth: Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ CASIRA Auth: Sign out error:', error);
      throw error;
    }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('📊 CASIRA Auth: State change:', event, session?.user?.email || 'no user');
      callback(event, session);
    });
  }
};

// Comments API con Supabase
export const commentsAPI = {
  addComment: async (postId, userId, content, parentId = null) => {
    console.log('💬 CASIRA: Adding comment to post', postId);
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        author_id: userId,
        content: content,
        parent_id: parentId
      }])
      .select(`
        *,
        author:users!comments_author_id_fkey(
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error adding comment:', error);
      throw error;
    }
    
    console.log('✅ CASIRA: Comment added successfully');
    return data;
  },

  getPostComments: async (postId) => {
    console.log('📖 CASIRA: Fetching comments for post', postId);
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('❌ CASIRA: Error fetching comments:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Posts API con Supabase
export const postsAPI = {
  getAllPosts: async (limit = 20) => {
    console.log('📝 CASIRA: Fetching posts');
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        ),
        activity:activities!posts_activity_id_fkey(
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('❌ CASIRA: Error fetching posts:', error);
      throw error;
    }
    
    return data || [];
  },

  createPost: async (postData) => {
    console.log('📝 CASIRA: Creating new post');
    
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select(`
        *,
        author:users!posts_author_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error creating post:', error);
      throw error;
    }
    
    return data;
  }
};

// Storage API
export const storageAPI = {
  uploadFile: async (bucket, path, file) => {
    console.log('📁 CASIRA: Uploading file to storage');

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      console.error('❌ CASIRA: Error uploading file:', error);
      throw error;
    }

    return data;
  },

  uploadImage: async (file, folder = 'activity-images') => {
    try {
      console.log('🖼️ CASIRA: Uploading image to storage');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (error) {
        console.error('❌ CASIRA: Error uploading image:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('✅ CASIRA: Image uploaded successfully:', urlData.publicUrl);
      return {
        url: urlData.publicUrl,
        path: filePath,
        data: data
      };
    } catch (error) {
      console.error('❌ CASIRA: Error in uploadImage:', error);
      throw error;
    }
  },

  getWorkingImageUrl: async (imageUrl) => {
    try {
      // If it's already a valid URL, return it
      if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
        return imageUrl;
      }

      // If it's a file path, get the public URL
      if (imageUrl && imageUrl.includes('/')) {
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(imageUrl);
        return data.publicUrl;
      }

      // Return fallback if nothing works
      return imageUrl || null;
    } catch (error) {
      console.error('❌ CASIRA: Error getting working image URL:', error);
      return imageUrl || null;
    }
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
};

export default supabase;