// ============= CASIRA Connect - Supabase Client =============
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============= REAL-TIME SUBSCRIPTIONS =============
export const subscribeToTable = (table, callback, filters = null) => {
  console.log(`🔔 CASIRA: Setting up real-time subscription to ${table}`);
  
  let channel = supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: table,
      ...(filters && { filter: filters })
    }, (payload) => {
      console.log(`📡 CASIRA: Real-time update on ${table}:`, payload);
      callback(payload);
    })
    .subscribe();
    
  return () => {
    console.log(`🔕 CASIRA: Unsubscribing from ${table}`);
    supabase.removeChannel(channel);
  };
};

// ============= SUPABASE API FUNCTIONS =============

// Posts API with Supabase
export const supabasePosts = {
  // Get all posts with author info and stats
  getAllPosts: async (limit = 20) => {
    console.log(`🔍 CASIRA: Fetching ${limit} posts from Supabase`);
    
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
    
    console.log(`✅ CASIRA: Retrieved ${data?.length || 0} posts`);
    return data || [];
  },

  // Create new post
  createPost: async (postData) => {
    console.log('📝 CASIRA: Creating new post:', postData);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        activity_id: postData.activity_id || null,
        author_id: postData.author_id,
        title: postData.title || '',
        content: postData.content,
        post_type: postData.post_type || 'update',
        images: postData.images || null,
        visibility: postData.visibility || 'public'
      }])
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
    
    console.log('✅ CASIRA: Post created successfully:', data);
    return data;
  },

  // Like/Unlike a post
  toggleLike: async (postId, userId) => {
    console.log(`👍 CASIRA: Toggling like for post ${postId} by user ${userId}`);
    
    // Check if user already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
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
      
      // Decrease likes count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes_count: supabase.rpc('decrement_likes', { row_id: postId }) })
        .eq('id', postId);
        
      console.log('👎 CASIRA: Like removed');
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
      
      // Increase likes count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes_count: supabase.rpc('increment_likes', { row_id: postId }) })
        .eq('id', postId);
        
      console.log('👍 CASIRA: Like added');
      return { liked: true };
    }
  },

  // Get post likes with user info
  getPostLikes: async (postId) => {
    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId);
      
    if (error) {
      console.error('❌ CASIRA: Error fetching post likes:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Comments API with Supabase
export const supabaseComments = {
  // Get comments for a post
  getPostComments: async (postId) => {
    console.log(`💬 CASIRA: Fetching comments for post ${postId}`);
    
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
    
    console.log(`✅ CASIRA: Retrieved ${data?.length || 0} comments`);
    return data || [];
  },

  // Add comment to post
  addComment: async (postId, userId, content, parentId = null) => {
    console.log(`💬 CASIRA: Adding comment to post ${postId}`);
    
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
    
    // Update post comments count
    await supabase
      .from('posts')
      .update({ comments_count: supabase.rpc('increment_comments', { row_id: postId }) })
      .eq('id', postId);
    
    console.log('✅ CASIRA: Comment added successfully');
    return data;
  },

  // Like a comment
  toggleCommentLike: async (commentId, userId) => {
    console.log(`👍 CASIRA: Toggling like for comment ${commentId}`);
    
    // Check existing like
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    if (existingLike) {
      // Remove like
      await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);
        
      await supabase
        .from('comments')
        .update({ likes_count: supabase.rpc('decrement_likes', { row_id: commentId }) })
        .eq('id', commentId);
        
      return { liked: false };
    } else {
      // Add like
      await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }]);
        
      await supabase
        .from('comments')
        .update({ likes_count: supabase.rpc('increment_likes', { row_id: commentId }) })
        .eq('id', commentId);
        
      return { liked: true };
    }
  }
};

// Activities API with Supabase
export const supabaseActivities = {
  // Get all public activities
  getPublicActivities: async () => {
    console.log('🎯 CASIRA: Fetching public activities from Supabase');
    
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        category:activity_categories(
          id,
          name,
          color,
          icon
        ),
        creator:users!activities_created_by_fkey(
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ CASIRA: Error fetching activities:', error);
      throw error;
    }
    
    console.log(`✅ CASIRA: Retrieved ${data?.length || 0} activities`);
    return data || [];
  },

  // Join activity as volunteer
  joinActivity: async (activityId, userId, message = '') => {
    console.log(`🙋 CASIRA: User ${userId} joining activity ${activityId}`);
    
    // Create volunteer request
    const { data, error } = await supabase
      .from('volunteer_requests')
      .insert([{
        user_id: userId,
        activity_id: activityId,
        message: message,
        status: 'pending'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error creating volunteer request:', error);
      throw error;
    }
    
    // Create notification for activity creator
    const { data: activity } = await supabase
      .from('activities')
      .select('created_by, title')
      .eq('id', activityId)
      .single();
      
    if (activity) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: activity.created_by,
          activity_id: activityId,
          type: 'volunteer_request',
          title: 'Nueva solicitud de voluntario',
          message: `Un usuario quiere unirse a ${activity.title}`,
          data: { volunteer_request_id: data.id }
        }]);
    }
    
    console.log('✅ CASIRA: Volunteer request created');
    return data;
  }
};

// Users API with Supabase
export const supabaseUsers = {
  // Get user by ID
  getUserById: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error fetching user:', error);
      throw error;
    }
    
    return data;
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    console.log(`👤 CASIRA: Updating profile for user ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ CASIRA: Error updating profile:', error);
      throw error;
    }
    
    console.log('✅ CASIRA: Profile updated successfully');
    return data;
  }
};

// Storage API for images
export const supabaseStorage = {
  // Upload image to storage
  uploadImage: async (file, userId, folder = 'general') => {
    console.log(`📷 CASIRA: Uploading image to ${folder}`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(filePath, file);
      
    if (error) {
      console.error('❌ CASIRA: Error uploading image:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);
    
    console.log('✅ CASIRA: Image uploaded successfully');
    return {
      path: data.path,
      url: urlData.publicUrl
    };
  },

  // Delete image from storage
  deleteImage: async (filePath) => {
    const { error } = await supabase.storage
      .from('project-images')
      .remove([filePath]);
      
    if (error) {
      console.error('❌ CASIRA: Error deleting image:', error);
      throw error;
    }
    
    console.log('✅ CASIRA: Image deleted successfully');
  }
};

// Notifications API
export const supabaseNotifications = {
  // Get user notifications
  getUserNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ CASIRA: Error fetching notifications:', error);
      throw error;
    }
    
    return data || [];
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
      
    if (error) {
      console.error('❌ CASIRA: Error marking notification as read:', error);
      throw error;
    }
  }
};

export default supabase;