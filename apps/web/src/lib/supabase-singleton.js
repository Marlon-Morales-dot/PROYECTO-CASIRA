// ============= CASIRA Connect - Supabase Singleton =============
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CASIRA: Missing Supabase environment variables');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ CASIRA: Invalid Supabase URL format:', supabaseUrl);
}

// Log configuration for debugging
console.log('🔧 CASIRA: Supabase Configuration:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseAnonKey ? 'Present' : 'Missing');

// Singleton pattern - solo una instancia de Supabase
let supabaseInstance = null;

// Error handler for HTML responses
const handleSupabaseError = (error) => {
  if (error.message && error.message.includes('<!doctype')) {
    console.error('❌ CASIRA: Received HTML instead of JSON. This usually indicates:');
    console.error('   1. Environment variables not set in deployment (Vercel/Render)');
    console.error('   2. Supabase URL or API key incorrect');
    console.error('   3. CORS issues with Supabase');
    console.error('   4. Network connectivity problems');
    console.error('   5. Supabase project not accessible');

    // Check current environment variables
    console.error('🔧 Current config:');
    console.error('   - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
    console.error('   - VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

    return new Error('Supabase connection error: Received HTML instead of JSON response. Check environment variables in deployment.');
  }
  return error;
};

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🚀 CASIRA: Creating Supabase client instance');

    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storageKey: 'casira-supabase-auth',
          storage: window?.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 2
          }
        },
        global: {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        }
      });

      console.log('✅ CASIRA: Supabase client created successfully');
    } catch (error) {
      console.error('❌ CASIRA: Failed to create Supabase client:', error);
      throw handleSupabaseError(error);
    }
  }
  return supabaseInstance;
};

// Export default instance
export const supabase = getSupabaseClient();

// API wrapper with error handling
const withErrorHandling = async (operation, operationName) => {
  try {
    const result = await operation();
    if (result.error) {
      const handledError = handleSupabaseError(result.error);
      console.error(`❌ CASIRA ${operationName}:`, handledError);
      throw handledError;
    }
    return result;
  } catch (error) {
    const handledError = handleSupabaseError(error);
    console.error(`❌ CASIRA ${operationName}:`, handledError);
    throw handledError;
  }
};

// Auth helpers
export const supabaseAuth = {
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await withErrorHandling(
        () => supabase.auth.getUser(),
        'getCurrentUser'
      );
      return user;
    } catch (error) {
      console.error('❌ CASIRA Auth: Error getting current user:', error);
      return null;
    }
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
  },

  deleteComment: async (commentId, userId) => {
    console.log('🗑️ CASIRA: Deleting comment', commentId);

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', userId);

    if (error) {
      console.error('❌ CASIRA: Error deleting comment:', error);
      throw error;
    }

    return true;
  },

  getCommentCount: async (postId) => {
    console.log('📊 CASIRA: Getting comment count for post', postId);

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('❌ CASIRA: Error getting comment count:', error);
      return 0;
    }

    return count || 0;
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
  },

  toggleLike: async (postId, userId) => {
    console.log('👍 CASIRA: Toggling like for post', postId);

    // Check if user already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ CASIRA: Error checking existing like:', checkError);
      throw checkError;
    }

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('❌ CASIRA: Error removing like:', deleteError);
        throw deleteError;
      }

      return { liked: false };
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }]);

      if (insertError) {
        console.error('❌ CASIRA: Error adding like:', insertError);
        throw insertError;
      }

      return { liked: true };
    }
  },

  getPostLikes: async (postId) => {
    console.log('📊 CASIRA: Getting likes for post', postId);

    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        id,
        user:users!post_likes_user_id_fkey(
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId);

    if (error) {
      console.error('❌ CASIRA: Error getting post likes:', error);
      throw error;
    }

    return data || [];
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

      // Upload to Supabase storage - try activity-images bucket first
      let data, error;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('activity-images')
          .upload(filePath, file);
        data = uploadData;
        error = uploadError;
      } catch (bucketError) {
        console.warn('⚠️ CASIRA: activity-images bucket not found, trying images bucket');
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('images')
          .upload(filePath, file);
        data = fallbackData;
        error = fallbackError;
      }

      if (error) {
        console.error('❌ CASIRA: Error uploading image:', error);
        throw error;
      }

      // Get public URL from correct bucket
      const bucketName = data && data.path && data.path.includes('activity-images') ? 'activity-images' : 'images';
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data?.path || filePath);

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