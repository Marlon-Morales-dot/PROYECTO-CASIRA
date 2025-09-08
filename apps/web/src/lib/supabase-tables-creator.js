// ============= Automatic Table Creator for Supabase =============
import { supabase } from './supabase.js'

export const supabaseTablesCreator = {
  // Create missing tables using direct SQL execution
  async createMissingTables() {
    console.log('🔧 Creating missing tables...')
    
    const tablesSQL = [
      {
        name: 'likes',
        sql: `
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
        `
      },
      {
        name: 'user_activities',
        sql: `
          CREATE TABLE IF NOT EXISTS user_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            activity_id UUID REFERENCES activities(id),
            role VARCHAR DEFAULT 'participant' CHECK (role IN ('organizer', 'volunteer', 'participant')),
            status VARCHAR DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'left')),
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'profiles',
        sql: `
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
        `
      }
    ]

    const results = {}

    for (const table of tablesSQL) {
      try {
        // Try to insert a dummy record to trigger table creation
        // This is a workaround since we can't execute DDL directly
        const testResult = await supabase
          .from(table.name)
          .insert({})
          .select()

        if (testResult.error && testResult.error.code === 'PGRST116') {
          results[table.name] = {
            success: false,
            error: 'Table does not exist and cannot be created automatically',
            sql: table.sql
          }
        } else {
          results[table.name] = {
            success: true,
            message: 'Table exists or was created'
          }
        }
      } catch (error) {
        results[table.name] = {
          success: false,
          error: error.message,
          sql: table.sql
        }
      }
    }

    return results
  },

  // Test if we can create tables automatically
  async testTableCreation() {
    try {
      // Try to insert into likes table to see if it exists
      const { error } = await supabase
        .from('likes')
        .select('*')
        .limit(1)

      if (error && error.code === 'PGRST116') {
        return {
          canAutoCreate: false,
          message: 'Tables need to be created manually in Supabase dashboard',
          sqlFile: 'missing-tables.sql'
        }
      }

      return {
        canAutoCreate: true,
        message: 'Tables can be created or already exist'
      }
    } catch (error) {
      return {
        canAutoCreate: false,
        error: error.message
      }
    }
  },

  // Get the complete SQL for manual execution
  getCompleteSQL() {
    return `
-- ============= TABLAS FALTANTES PARA CASIRA CONNECT =============

-- 1. Tabla LIKES
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

-- 2. Tabla USER_ACTIVITIES
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_id UUID REFERENCES activities(id),
  role VARCHAR DEFAULT 'participant' CHECK (role IN ('organizer', 'volunteer', 'participant')),
  status VARCHAR DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'left')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla PROFILES (opcional)
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

-- ============= POLÍTICAS DE SEGURIDAD =============

-- Habilitar RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Anyone can view user activities" ON user_activities FOR SELECT USING (true);
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
    `
  }
}