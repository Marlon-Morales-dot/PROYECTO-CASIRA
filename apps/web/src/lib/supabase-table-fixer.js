// ============= Supabase Table Structure Fixer =============
import { supabase } from './supabase.js'

export const supabaseTableFixer = {
  // Check if tables have proper structure by attempting to insert test data
  async verifyTableStructures() {
    console.log('🔧 Verifying and fixing table structures...')
    
    const results = {}

    // Test posts table structure
    try {
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('*')
        .limit(1)

      if (!existingPosts || existingPosts.length === 0) {
        // Try to insert a test post to see what columns exist
        const testUser = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single()

        if (testUser.data) {
          const { data, error } = await supabase
            .from('posts')
            .insert({
              title: 'Test Post - Can be deleted',
              content: 'This is a test post to verify table structure',
              author_id: testUser.data.id
            })
            .select()

          if (error) {
            results.posts = { success: false, error: error.message, missingColumns: [] }
          } else {
            results.posts = { success: true, testRecord: data }
            
            // Delete test record
            if (data && data.length > 0) {
              await supabase.from('posts').delete().eq('id', data[0].id)
            }
          }
        }
      } else {
        results.posts = { success: true, hasData: true }
      }
    } catch (error) {
      results.posts = { success: false, error: error.message }
    }

    // Test comments table
    try {
      const { data: existingComments } = await supabase
        .from('comments')
        .select('*')
        .limit(1)

      if (!existingComments || existingComments.length === 0) {
        // Get a test user and create a test post first
        const testUser = await supabase.from('users').select('id').limit(1).single()
        
        if (testUser.data) {
          // Create a temporary post for testing comments
          const { data: testPost } = await supabase
            .from('posts')
            .insert({
              title: 'Test Post for Comments',
              content: 'Test content',
              author_id: testUser.data.id
            })
            .select()
            .single()

          if (testPost) {
            const { data, error } = await supabase
              .from('comments')
              .insert({
                post_id: testPost.id,
                author_id: testUser.data.id,
                content: 'Test comment'
              })
              .select()

            if (error) {
              results.comments = { success: false, error: error.message }
            } else {
              results.comments = { success: true, testRecord: data }
              
              // Clean up test data
              if (data && data.length > 0) {
                await supabase.from('comments').delete().eq('id', data[0].id)
              }
            }

            // Clean up test post
            await supabase.from('posts').delete().eq('id', testPost.id)
          }
        }
      } else {
        results.comments = { success: true, hasData: true }
      }
    } catch (error) {
      results.comments = { success: false, error: error.message }
    }

    // Test likes table
    try {
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('*')
        .limit(1)

      results.likes = { 
        success: true, 
        hasData: existingLikes && existingLikes.length > 0,
        structure: 'Needs post_id, user_id, comment_id (nullable), created_at'
      }
    } catch (error) {
      results.likes = { success: false, error: error.message }
    }

    // Test notifications table
    try {
      const testUser = await supabase.from('users').select('id').limit(1).single()
      
      if (testUser.data) {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: testUser.data.id,
            title: 'Test Notification',
            message: 'This is a test notification',
            type: 'info'
          })
          .select()

        if (error) {
          results.notifications = { success: false, error: error.message }
        } else {
          results.notifications = { success: true, testRecord: data }
          
          // Clean up test data
          if (data && data.length > 0) {
            await supabase.from('notifications').delete().eq('id', data[0].id)
          }
        }
      }
    } catch (error) {
      results.notifications = { success: false, error: error.message }
    }

    return results
  },

  // Get proper SQL to ensure tables have correct structure
  async generateTableFixSQL() {
    const verification = await this.verifyTableStructures()
    
    let sql = `-- Table Structure Fixes for CASIRA Connect\n\n`

    // Posts table fixes
    if (!verification.posts?.success) {
      sql += `-- Fix posts table structure
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    activity_id UUID REFERENCES activities(id),
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

`
    }

    // Comments table fixes
    if (!verification.comments?.success) {
      sql += `-- Fix comments table structure
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

`
    }

    // Likes table fixes
    sql += `-- Ensure likes table has proper structure
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- User activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    activity_id UUID REFERENCES activities(id),
    role VARCHAR DEFAULT 'participant' CHECK (role IN ('organizer', 'volunteer', 'participant')),
    status VARCHAR DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'left')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    phone VARCHAR,
    address TEXT,
    birth_date DATE,
    interests TEXT[],
    skills TEXT[],
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_activity_id ON posts(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (Note: DROP IF EXISTS first, then CREATE)
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage their likes" ON likes;
CREATE POLICY "Users can manage their likes" ON likes FOR ALL USING (auth.uid() = user_id);
`

    return { sql, verification }
  }
}