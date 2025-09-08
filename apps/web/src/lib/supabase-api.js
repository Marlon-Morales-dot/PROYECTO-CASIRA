// ============= CASIRA Connect - Supabase API Wrapper =============
import { supabase } from './supabase-singleton.js'

// ============= USERS API =============
export const supabaseUsersAPI = {
  // Get all users
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
  },

  // Create user
  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'visitor',
          bio: userData.bio || '',
          avatar_url: userData.avatar_url || null
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }
}

// ============= POSTS API =============
export const supabasePostsAPI = {
  // Get all posts with author info
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching posts:', error)
      return []
    }
  },

  // Create post
  async createPost(postData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          title: postData.title || '',
          content: postData.content,
          author_id: postData.author_id,
          activity_id: postData.activity_id || null
          // Removed image_url since it doesn't exist in current schema
        }])
        .select(`
          *,
          author:users!posts_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  },

  // Update post likes count
  async updatePostLikes(postId, increment = true) {
    try {
      const { data, error } = await supabase
        .rpc('update_post_likes', {
          post_id: postId,
          increment: increment
        })

      if (error) throw error
      return data
    } catch (error) {
      // Fallback: manual update
      try {
        const { data: post, error: fetchError } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single()

        if (fetchError) throw fetchError

        const newCount = increment 
          ? (post.likes_count || 0) + 1 
          : Math.max((post.likes_count || 0) - 1, 0)

        const { data, error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: newCount })
          .eq('id', postId)
          .select()
          .single()

        if (updateError) throw updateError
        return data
      } catch (fallbackError) {
        console.error('Error updating post likes:', fallbackError)
        throw fallbackError
      }
    }
  }
}

// ============= COMMENTS API =============
export const supabaseCommentsAPI = {
  // Get all comments
  async getAllComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all comments:', error)
      return []
    }
  },

  // Get comments for a post
  async getCommentsByPost(postId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  },

  // Create comment
  async createComment(commentData) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: commentData.post_id,
          author_id: commentData.author_id,
          content: commentData.content
        }])
        .select(`
          *,
          author:users!comments_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .single()

      if (error) throw error

      // Update post comments count
      await this.updatePostCommentsCount(commentData.post_id)

      return data
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  },

  // Update post comments count
  async updatePostCommentsCount(postId) {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', postId)

      if (error) throw error

      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments_count: count })
        .eq('id', postId)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error updating comments count:', error)
    }
  }
}

// ============= ACTIVITIES API =============
export const supabaseActivitiesAPI = {
  // Get all activities
  async getAllActivities() {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          creator:users!activities_created_by_fkey(id, first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching activities:', error)
      return []
    }
  },

  // Create activity
  async createActivity(activityData) {
    try {
      console.log('🎯 CASIRA: Creating activity in Supabase with data:', activityData);
      
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          title: activityData.title,
          description: activityData.description,
          detailed_description: activityData.detailed_description || '',
          status: activityData.status || 'planning',
          priority: activityData.priority || 'medium',
          budget: activityData.budget || 0,
          beneficiaries_count: activityData.beneficiaries_count || 0,
          location: activityData.location || '',
          date_start: activityData.date_start || activityData.start_date || null,
          date_end: activityData.date_end || activityData.end_date || null,
          max_volunteers: activityData.max_volunteers || null,
          image_url: activityData.image_url || null,
          requirements: activityData.requirements || [],
          benefits: activityData.benefits || [],
          visibility: activityData.visibility || 'public',
          featured: activityData.featured || false,
          category_id: activityData.category_id || null,
          created_by: activityData.created_by
        }])
        .select(`
          *,
          creator:users!activities_created_by_fkey(id, first_name, last_name, email, role)
        `)
        .single()

      if (error) {
        console.error('❌ CASIRA: Supabase error creating activity:', error);
        throw error;
      }
      
      console.log('✅ CASIRA: Activity created successfully in Supabase:', data);
      return data
    } catch (error) {
      console.error('❌ CASIRA: Error creating activity:', error)
      throw error
    }
  }
}

// ============= LIKES API =============
export const supabaseLikesAPI = {
  // Toggle like on post
  async togglePostLike(userId, postId) {
    try {
      // Check if like exists
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id)

        if (deleteError) throw deleteError

        // Decrease post likes count
        await supabasePostsAPI.updatePostLikes(postId, false)

        return { liked: false, message: 'Like removed' }
      } else {
        // Add like
        const { data, error: insertError } = await supabase
          .from('likes')
          .insert([{
            user_id: userId,
            post_id: postId
          }])
          .select()
          .single()

        if (insertError) throw insertError

        // Increase post likes count
        await supabasePostsAPI.updatePostLikes(postId, true)

        return { liked: true, message: 'Like added' }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  },

  // Get likes for a post
  async getPostLikes(postId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          user:users!likes_user_id_fkey(id, first_name, last_name)
        `)
        .eq('post_id', postId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching post likes:', error)
      return []
    }
  }
}

// ============= NOTIFICATIONS API =============
export const supabaseNotificationsAPI = {
  // Get notifications for user
  async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  // Create notification
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info'
          // Removed action_url since it doesn't exist in current schema
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }
}

// ============= COMBINED API WRAPPER =============
export const supabaseAPI = {
  users: supabaseUsersAPI,
  posts: supabasePostsAPI,
  comments: supabaseCommentsAPI,
  activities: supabaseActivitiesAPI,
  likes: supabaseLikesAPI,
  notifications: supabaseNotificationsAPI,

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1)

      return { healthy: !error, error: error?.message }
    } catch (error) {
      return { healthy: false, error: error.message }
    }
  }
}