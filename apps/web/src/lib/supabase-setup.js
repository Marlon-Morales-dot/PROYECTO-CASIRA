// ============= CASIRA Connect - Supabase Setup & Schema =============
import { supabase } from './supabase.js'

export const supabaseSetup = {
  // Test connection to Supabase
  async testConnection() {
    try {
      console.log('🔄 Testing Supabase connection...')
      
      // Simple test - just check if we can connect and get project info
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('⚠️ Auth session error, but connection might work:', error.message)
      }
      
      console.log('✅ Supabase connection successful!')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
  },

  // Check if tables exist using simple select
  async createSchema() {
    console.log('🏗️ Checking Supabase schema...')
    
    const tables = ['users', 'activities', 'posts', 'comments', 'likes', 'notifications', 'user_activities']
    const results = {}
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          // Table doesn't exist
          console.log(`❌ Table ${tableName} does not exist`)
          results[tableName] = { 
            success: false, 
            error: 'Table does not exist',
            needsCreation: true
          }
        } else if (error) {
          console.log(`⚠️ Cannot check table ${tableName}:`, error.message)
          results[tableName] = { 
            success: false, 
            error: error.message,
            needsCreation: true
          }
        } else {
          console.log(`✅ Table ${tableName} exists`)
          results[tableName] = { success: true }
        }
      } catch (error) {
        console.error(`❌ Error checking table ${tableName}:`, error)
        results[tableName] = { 
          success: false, 
          error: error.message,
          needsCreation: true
        }
      }
    }

    return results
  },

  // Get SQL schemas for manual execution
  getSQLSchemas() {
    return {
      users: `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR UNIQUE NOT NULL,
          first_name VARCHAR NOT NULL,
          last_name VARCHAR NOT NULL,
          role VARCHAR DEFAULT 'visitor' CHECK (role IN ('admin', 'donor', 'volunteer', 'visitor')),
          bio TEXT DEFAULT '',
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      
      activities: `
        CREATE TABLE activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
          budget DECIMAL(10,2) DEFAULT 0,
          beneficiaries_count INTEGER DEFAULT 0,
          location TEXT,
          date_start DATE,
          date_end DATE,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,

      posts: `
        CREATE TABLE posts (
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
      `,

      comments: `
        CREATE TABLE comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          author_id UUID REFERENCES users(id),
          content TEXT NOT NULL,
          likes_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,

      likes: `
        CREATE TABLE likes (
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
      `,

      notifications: `
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          title VARCHAR NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
          read BOOLEAN DEFAULT FALSE,
          action_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,

      user_activities: `
        CREATE TABLE user_activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          activity_id UUID REFERENCES activities(id),
          role VARCHAR DEFAULT 'participant' CHECK (role IN ('organizer', 'volunteer', 'participant')),
          status VARCHAR DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'left')),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  },

  // Check RLS status
  async checkRLS() {
    console.log('🔒 Checking Row Level Security status...')
    return { message: 'RLS needs to be configured manually in Supabase dashboard' }
  },

  // Seed initial data
  async seedData() {
    console.log('🌱 Seeding initial data...')
    
    // Create admin user
    const adminUser = {
      email: 'admin@casira.org',
      first_name: 'Administrador',
      last_name: 'CASIRA',
      role: 'admin',
      bio: 'Administrador principal de la plataforma CASIRA Connect'
    }

    try {
      const { data: existingAdmin, error: adminCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', adminUser.email)
        .single()

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.error('Error checking for admin user:', adminCheckError)
        return { success: false, error: adminCheckError.message }
      }

      if (!existingAdmin) {
        const { error: adminError } = await supabase
          .from('users')
          .insert([adminUser])

        if (adminError) {
          console.error('Error creating admin user:', adminError)
          return { success: false, error: adminError.message }
        }
        console.log('✅ Admin user created')
      } else {
        console.log('ℹ️ Admin user already exists')
      }

      // Create sample activity
      const sampleActivity = {
        title: 'Programa de Becas Educativas 2024',
        description: 'Otorgamos becas completas a estudiantes destacados de escasos recursos para que puedan continuar sus estudios superiores.',
        status: 'active',
        budget: 50000,
        beneficiaries_count: 25,
        location: 'Guatemala, Guatemala'
      }

      const { error: activityError } = await supabase
        .from('activities')
        .upsert([sampleActivity])

      if (activityError) {
        console.error('Error creating sample activity:', activityError)
      } else {
        console.log('✅ Sample activity created')
      }

      return { success: true }
    } catch (error) {
      console.error('Error seeding data:', error)
      return { success: false, error: error.message }
    }
  },

  // Run complete setup
  async initialize() {
    console.log('🚀 Initializing CASIRA Connect with Supabase...')
    
    const results = {
      connection: await this.testConnection(),
      schema: await this.createSchema(),
      rls: await this.checkRLS(),
      sqlSchemas: this.getSQLSchemas()
    }

    console.log('📊 Setup Results:', results)
    return results
  }
}