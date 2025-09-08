// ============= CASIRA Connect - Data Migration from localStorage to Supabase =============
import { supabaseAPI } from './supabase-api.js'
import { dataStore } from './api.js' // Current localStorage system

export const supabaseMigration = {
  // Migrate all data from localStorage to Supabase
  async migrateAllData() {
    console.log('🚀 Starting data migration from localStorage to Supabase...')
    
    const results = {
      users: { migrated: 0, errors: [] },
      activities: { migrated: 0, errors: [] },
      posts: { migrated: 0, errors: [] },
      comments: { migrated: 0, errors: [] },
      notifications: { migrated: 0, errors: [] }
    }

    try {
      // 1. Migrate Users
      console.log('👥 Migrating users...')
      const localUsers = dataStore.users || []
      for (const user of localUsers) {
        try {
          // Check if user already exists in Supabase
          const existingUser = await supabaseAPI.users.getUserByEmail(user.email)
          
          if (!existingUser) {
            await supabaseAPI.users.createUser({
              email: user.email,
              first_name: user.first_name || user.firstName || 'Usuario',
              last_name: user.last_name || user.lastName || '',
              role: user.role || 'visitor',
              bio: user.bio || '',
              avatar_url: user.avatar_url || user.avatarUrl || null
            })
            results.users.migrated++
            console.log(`✅ User migrated: ${user.email}`)
          } else {
            console.log(`ℹ️ User already exists: ${user.email}`)
          }
        } catch (error) {
          console.error(`❌ Error migrating user ${user.email}:`, error)
          results.users.errors.push({ user: user.email, error: error.message })
        }
      }

      // 2. Get Supabase users for reference
      const supabaseUsers = await supabaseAPI.users.getAllUsers()
      const userEmailToId = {}
      supabaseUsers.forEach(user => {
        userEmailToId[user.email] = user.id
      })

      // 3. Migrate Activities
      console.log('🏃‍♂️ Migrating activities...')
      const localActivities = dataStore.activities || []
      const activityIdMap = {} // old ID -> new ID mapping
      
      // Get existing activities to avoid duplicates
      const existingActivities = await supabaseAPI.activities.getAllActivities()
      const existingActivityTitles = new Set(existingActivities.map(a => a.title))
      
      for (const activity of localActivities) {
        try {
          // Skip if activity with same title already exists
          if (existingActivityTitles.has(activity.title)) {
            console.log(`ℹ️ Activity already exists: ${activity.title}`)
            // Find the existing activity to map ID
            const existingActivity = existingActivities.find(a => a.title === activity.title)
            if (existingActivity) {
              activityIdMap[activity.id] = existingActivity.id
            }
            continue
          }

          // Find creator in Supabase users
          const creatorId = userEmailToId['admin@casira.org'] || supabaseUsers[0]?.id
          
          if (!creatorId) {
            throw new Error('No creator user found')
          }
          
          const newActivity = await supabaseAPI.activities.createActivity({
            title: activity.title || 'Sin título',
            description: activity.description || 'Sin descripción',
            status: activity.status || 'active',
            budget: parseFloat(activity.budget) || 0,
            beneficiaries_count: parseInt(activity.beneficiaries_count || activity.beneficiariesCount) || 0,
            location: activity.location || '',
            date_start: activity.date_start || activity.dateStart || null,
            date_end: activity.date_end || activity.dateEnd || null,
            created_by: creatorId
          })
          
          activityIdMap[activity.id] = newActivity.id
          results.activities.migrated++
          console.log(`✅ Activity migrated: ${activity.title}`)
        } catch (error) {
          console.error(`❌ Error migrating activity ${activity.title || 'Unknown'}:`, error)
          results.activities.errors.push({ 
            activity: activity.title || 'Unknown', 
            error: error.message 
          })
        }
      }

      // 4. Migrate Posts
      console.log('📝 Migrating posts...')
      const localPosts = dataStore.posts || []
      const postIdMap = {} // old ID -> new ID mapping
      
      // Get existing posts to avoid duplicates
      const existingPosts = await supabaseAPI.posts.getAllPosts()
      const existingPostContents = new Set(existingPosts.map(p => p.content))
      const existingPostTitles = new Set(existingPosts.map(p => p.title))
      
      for (const post of localPosts) {
        try {
          // Check if post already exists (by content or title)
          const isDuplicate = existingPostContents.has(post.content) || 
                             (post.title && existingPostTitles.has(post.title))
          
          if (isDuplicate) {
            console.log(`ℹ️ Post already exists: ${post.title || 'Untitled'}`)
            // Find the existing post to map ID for comments
            const existingPost = existingPosts.find(p => 
              p.content === post.content || p.title === post.title
            )
            if (existingPost) {
              postIdMap[post.id] = existingPost.id
            }
            continue
          }
          
          // Find author in Supabase users
          let authorId = userEmailToId[post.author_email] || userEmailToId['admin@casira.org'] || supabaseUsers[0]?.id
          
          // Map activity ID if exists
          const activityId = post.activity_id ? activityIdMap[post.activity_id] : null
          
          const newPost = await supabaseAPI.posts.createPost({
            title: post.title || '',
            content: post.content,
            author_id: authorId,
            activity_id: activityId
            // Removed image_url since it doesn't exist in current schema
          })
          
          postIdMap[post.id] = newPost.id
          results.posts.migrated++
          console.log(`✅ Post migrated: ${post.title || 'Untitled'}`)
        } catch (error) {
          console.error(`❌ Error migrating post:`, error)
          results.posts.errors.push({ post: post.title || 'Untitled', error: error.message })
        }
      }

      // 5. Migrate Comments
      console.log('💬 Migrating comments...')
      const localComments = dataStore.comments || []
      
      // Get existing comments to avoid duplicates
      const existingComments = await supabaseAPI.comments.getAllComments()
      const existingCommentContents = new Set(existingComments.map(c => c.content))
      
      for (const comment of localComments) {
        try {
          // Check if comment already exists
          if (existingCommentContents.has(comment.content)) {
            console.log(`ℹ️ Comment already exists: ${comment.content.substring(0, 50)}...`)
            continue
          }
          
          // Find author and map post ID
          let authorId = userEmailToId[comment.author_email] || userEmailToId['admin@casira.org'] || supabaseUsers[0]?.id
          const postId = postIdMap[comment.post_id]
          
          if (postId) {
            await supabaseAPI.comments.createComment({
              post_id: postId,
              author_id: authorId,
              content: comment.content
            })
            results.comments.migrated++
            console.log(`✅ Comment migrated`)
          } else {
            console.log(`⚠️ Comment skipped: No corresponding post found`)
          }
        } catch (error) {
          console.error(`❌ Error migrating comment:`, error)
          results.comments.errors.push({ error: error.message })
        }
      }

      // 6. Create welcome notification for admin
      try {
        const adminId = userEmailToId['admin@casira.org']
        if (adminId) {
          await supabaseAPI.notifications.createNotification({
            user_id: adminId,
            title: '🎉 Migración Completada',
            message: 'Todos los datos han sido migrados exitosamente a Supabase',
            type: 'success'
          })
          results.notifications.migrated++
        }
      } catch (error) {
        console.error('❌ Error creating welcome notification:', error)
      }

      console.log('✅ Migration completed successfully!')
      return results
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return { error: error.message, results }
    }
  },

  // Check migration status with conflict detection
  async checkMigrationStatus() {
    try {
      const supabaseData = {
        users: await supabaseAPI.users.getAllUsers(),
        activities: await supabaseAPI.activities.getAllActivities(),
        posts: await supabaseAPI.posts.getAllPosts(),
        comments: await supabaseAPI.comments.getAllComments(),
        notifications: await supabaseAPI.notifications.getUserNotifications(
          (await supabaseAPI.users.getAllUsers())[0]?.id
        )
      }

      const localData = {
        users: dataStore.users || [],
        activities: dataStore.activities || [],
        posts: dataStore.posts || [],
        comments: dataStore.comments || []
      }

      // Detect potential conflicts
      const conflicts = {
        posts: {
          existingInSupabase: supabaseData.posts.length,
          pendingFromLocal: localData.posts.length,
          potentialDuplicates: 0
        },
        activities: {
          existingInSupabase: supabaseData.activities.length,
          pendingFromLocal: localData.activities.length,
          potentialDuplicates: 0
        }
      }

      // Check for post duplicates
      const supabasePostTitles = new Set(supabaseData.posts.map(p => p.title))
      const supabasePostContents = new Set(supabaseData.posts.map(p => p.content))
      conflicts.posts.potentialDuplicates = localData.posts.filter(p => 
        supabasePostTitles.has(p.title) || supabasePostContents.has(p.content)
      ).length

      // Check for activity duplicates
      const supabaseActivityTitles = new Set(supabaseData.activities.map(a => a.title))
      conflicts.activities.potentialDuplicates = localData.activities.filter(a => 
        supabaseActivityTitles.has(a.title)
      ).length

      return {
        supabase: {
          users: supabaseData.users.length,
          activities: supabaseData.activities.length,
          posts: supabaseData.posts.length,
          comments: supabaseData.comments.length,
          notifications: supabaseData.notifications.length
        },
        localStorage: {
          users: localData.users.length,
          activities: localData.activities.length,
          posts: localData.posts.length,
          comments: localData.comments.length
        },
        conflicts
      }
    } catch (error) {
      console.error('Error checking migration status:', error)
      return { error: error.message }
    }
  },

  // Clear localStorage after successful migration (optional)
  async clearLocalStorage() {
    try {
      const backupData = {
        users: dataStore.users || [],
        activities: dataStore.activities || [],
        posts: dataStore.posts || [],
        comments: dataStore.comments || [],
        timestamp: new Date().toISOString()
      }

      // Save backup
      localStorage.setItem('casira-backup', JSON.stringify(backupData))
      
      // Clear main data
      localStorage.removeItem('casira-data')
      
      console.log('✅ localStorage cleared, backup saved as casira-backup')
      return true
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error)
      return false
    }
  },

  // Restore from backup if needed
  async restoreFromBackup() {
    try {
      const backup = localStorage.getItem('casira-backup')
      if (backup) {
        localStorage.setItem('casira-data', backup)
        console.log('✅ Data restored from backup')
        return true
      } else {
        console.log('⚠️ No backup found')
        return false
      }
    } catch (error) {
      console.error('❌ Error restoring from backup:', error)
      return false
    }
  }
}