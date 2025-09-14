// ============= CASIRA Connect - Supabase API Wrapper =============
import { supabase } from './supabase-singleton.js'
import { generateUUID, isUUID, prepareForSupabase } from './uuid-helper.js'

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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        statusCode: error.statusCode
      })
      throw error
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      // Filtrar campos que no existen en la tabla users
      const allowedFields = ['email', 'full_name', 'first_name', 'last_name', 'avatar_url', 'role', 'status'];
      const filteredData = Object.keys(userData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = userData[key];
          return obj;
        }, {});

      const { data, error } = await supabase
        .from('users')
        .update(filteredData)
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

  // Helper method to get a valid creator ID that exists in the users table
  async getValidCreatorId(providedCreatorId) {
    try {
      // First, try to use the provided creator ID if it's valid and exists
      if (providedCreatorId && isUUID(providedCreatorId)) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', providedCreatorId)
          .single();

        if (existingUser) {
          console.log('✅ CASIRA: Using provided valid creator ID:', providedCreatorId);
          return providedCreatorId;
        }
      }

      // Try to use admin ID from window global if available
      if (window.CASIRA_ADMIN_ID && isUUID(window.CASIRA_ADMIN_ID)) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', window.CASIRA_ADMIN_ID)
          .single();

        if (adminUser) {
          console.log('✅ CASIRA: Using admin ID:', window.CASIRA_ADMIN_ID);
          return window.CASIRA_ADMIN_ID;
        }
      }

      // Fall back to finding any existing admin user
      const { data: anyAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (anyAdmin) {
        console.log('✅ CASIRA: Using existing admin user ID:', anyAdmin.id);
        return anyAdmin.id;
      }

      // Fall back to any existing user
      const { data: anyUser } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();

      if (anyUser) {
        console.log('✅ CASIRA: Using existing user ID:', anyUser.id);
        return anyUser.id;
      }

      // If no users exist, we need to create one or throw an error
      throw new Error('No users found in database. Cannot create activity without valid creator.');

    } catch (error) {
      console.error('❌ CASIRA: Error finding valid creator ID:', error);
      throw new Error('Failed to find or create valid user for activity creation');
    }
  },

  // Map numeric category IDs to UUID (for dataStore compatibility)
  async mapCategoryIdToUUID(categoryId) {
    if (!categoryId) return null;
    
    try {
      // Get categories from Supabase to map dynamically
      const { data: categories, error } = await supabase
        .from('activity_categories')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories for mapping:', error);
        return null;
      }
      
      // Create dynamic mapping based on order (matching dataStore order)
      const categoryNames = ['Alimentación', 'Educación', 'Medio Ambiente', 'Salud', 'Vivienda'];
      const categoryMapping = {};
      
      categories.forEach((cat, index) => {
        const matchIndex = categoryNames.findIndex(name => name === cat.name);
        if (matchIndex !== -1) {
          categoryMapping[matchIndex + 1] = cat.id;
        }
      });
      
      // Fallback mapping for known names
      const nameMapping = {
        1: categories.find(c => c.name === 'Medio Ambiente')?.id,
        2: categories.find(c => c.name === 'Alimentación')?.id,
        3: categories.find(c => c.name === 'Educación')?.id,
        4: categories.find(c => c.name === 'Salud')?.id,
        5: categories.find(c => c.name === 'Vivienda')?.id
      };
      
      console.log('🗂️ Dynamic category mapping:', nameMapping);
      return nameMapping[categoryId] || null;
      
    } catch (error) {
      console.error('Error in category mapping:', error);
      return null;
    }
  },

  // Create activity
  async createActivity(activityData) {
    try {
      console.log('🎯 CASIRA: Creating activity in Supabase with data:', activityData);
      
      // Prepare data for Supabase with proper UUIDs
      const supabaseData = {
        id: generateUUID(), // Always generate new UUID for Supabase
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
        category_id: await this.mapCategoryIdToUUID(activityData.category_id),
        created_by: await this.getValidCreatorId(activityData.created_by)
      };
      
      console.log('🔄 CASIRA: Prepared data for Supabase:', supabaseData);
      
      const { data, error } = await supabase
        .from('activities')
        .insert([supabaseData])
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
  },

  // Delete activity
  async deleteActivity(activityId) {
    try {
      console.log('🗑️ CASIRA: Deleting activity from Supabase:', activityId);
      
      // First check if activity exists
      const { data: existingActivity, error: checkError } = await supabase
        .from('activities')
        .select('id')
        .eq('id', activityId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ CASIRA: Error checking activity existence:', checkError);
        throw checkError;
      }

      if (!existingActivity) {
        console.warn('⚠️ CASIRA: Activity not found in Supabase, may already be deleted:', activityId);
        return { id: activityId, status: 'not_found_but_ok' };
      }

      // Delete the activity
      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .select()

      if (error) {
        console.error('❌ CASIRA: Supabase error deleting activity:', error);
        throw error;
      }
      
      const deletedActivity = data?.[0] || { id: activityId, status: 'deleted' };
      console.log('✅ CASIRA: Activity deleted successfully from Supabase:', deletedActivity);
      return deletedActivity;
    } catch (error) {
      console.error('❌ CASIRA: Error deleting activity:', error)
      throw error
    }
  },

  // Update activity
  async updateActivity(activityId, activityData) {
    try {
      console.log('📝 CASIRA: Updating activity in Supabase:', activityId, activityData);
      
      // First check if activity exists
      const { data: existingActivity, error: checkError } = await supabase
        .from('activities')
        .select('id')
        .eq('id', activityId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ CASIRA: Error checking activity for update:', checkError);
        throw checkError;
      }

      if (!existingActivity) {
        console.error('❌ CASIRA: Activity not found for update:', activityId);
        throw new Error(`Activity with ID ${activityId} not found in Supabase`);
      }

      const { data, error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', activityId)
        .select(`
          *,
          creator:users!activities_created_by_fkey(id, first_name, last_name, email, role)
        `)

      if (error) {
        console.error('❌ CASIRA: Supabase error updating activity:', error);
        throw error;
      }
      
      const updatedActivity = data?.[0];
      if (!updatedActivity) {
        console.error('❌ CASIRA: No activity returned from update operation');
        throw new Error('Update operation did not return updated activity');
      }

      console.log('✅ CASIRA: Activity updated successfully in Supabase:', updatedActivity);
      return updatedActivity;
    } catch (error) {
      console.error('❌ CASIRA: Error updating activity:', error)
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