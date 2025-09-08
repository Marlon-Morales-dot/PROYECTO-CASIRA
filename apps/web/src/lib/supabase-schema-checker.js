// ============= Supabase Schema Checker =============
import { supabase } from './supabase.js'

export const supabaseSchemaChecker = {
  // Check actual columns in each table
  async checkTableColumns() {
    console.log('🔍 Checking actual table schemas in Supabase...')
    
    const tables = ['users', 'activities', 'posts', 'comments', 'likes', 'notifications', 'user_activities', 'profiles']
    const schemas = {}
    
    for (const tableName of tables) {
      try {
        // Get a sample record to see available columns
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          schemas[tableName] = { exists: false, error: 'Table not found' }
        } else if (error) {
          schemas[tableName] = { exists: false, error: error.message }
        } else {
          const columns = data && data.length > 0 ? Object.keys(data[0]) : []
          schemas[tableName] = { 
            exists: true, 
            columns,
            sampleRecord: data && data.length > 0 ? data[0] : null
          }
          console.log(`✅ ${tableName}: ${columns.join(', ')}`)
        }
      } catch (error) {
        schemas[tableName] = { exists: false, error: error.message }
      }
    }
    
    return schemas
  },

  // Get corrected schemas based on actual table structure
  async getCorrectedSchemas() {
    const actualSchemas = await this.checkTableColumns()
    
    const corrections = {
      posts: {
        hasImageUrl: actualSchemas.posts?.columns?.includes('image_url') || false,
        hasActivityId: actualSchemas.posts?.columns?.includes('activity_id') || false
      },
      notifications: {
        hasActionUrl: actualSchemas.notifications?.columns?.includes('action_url') || false,
        hasRead: actualSchemas.notifications?.columns?.includes('read') || false
      },
      activities: {
        hasDateStart: actualSchemas.activities?.columns?.includes('date_start') || false,
        hasDateEnd: actualSchemas.activities?.columns?.includes('date_end') || false,
        hasBeneficiariesCount: actualSchemas.activities?.columns?.includes('beneficiaries_count') || false
      }
    }

    return { actualSchemas, corrections }
  },

  // Create SQL to add missing columns
  generateMissingColumnSQL() {
    return `
-- Add missing columns to existing tables

-- Add image_url to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add action_url to notifications table  
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Ensure all expected columns exist in activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS date_start DATE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS date_end DATE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS beneficiaries_count INTEGER DEFAULT 0;

-- Ensure read column exists in notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_activity_id ON posts(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `
  }
}