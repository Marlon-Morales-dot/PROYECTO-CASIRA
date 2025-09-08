// ============= Supabase Project Inspector =============
import { supabase } from './supabase.js'

export const supabaseInspector = {
  // Get project information and available tables
  async inspectProject() {
    console.log('🔍 Inspecting current Supabase project...')
    
    try {
      // Try to get available tables by making API calls
      const results = {
        projectUrl: 'https://wlliqmcpiiktcdzwzhdn.supabase.co',
        projectId: 'wlliqmcpiiktcdzwzhdn',
        auth: {},
        tables: {},
        storage: {}
      }

      // Test auth
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession()
        results.auth = {
          available: !authError,
          error: authError?.message || null,
          session: authData?.session ? 'Session exists' : 'No session'
        }
      } catch (error) {
        results.auth = { available: false, error: error.message }
      }

      // Check for existing tables by trying to query them
      const tablesToCheck = [
        'users', 'activities', 'posts', 'comments', 'likes', 
        'notifications', 'user_activities', 'profiles'
      ]

      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          if (error) {
            if (error.code === 'PGRST116') {
              results.tables[table] = { exists: false, error: 'Table not found' }
            } else {
              results.tables[table] = { exists: false, error: error.message }
            }
          } else {
            results.tables[table] = { 
              exists: true, 
              recordCount: data ? data.length : 0,
              sample: data && data.length > 0 ? data[0] : null
            }
          }
        } catch (error) {
          results.tables[table] = { exists: false, error: error.message }
        }
      }

      // Check storage
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
        results.storage = {
          available: !bucketError,
          buckets: buckets || [],
          error: bucketError?.message || null
        }
      } catch (error) {
        results.storage = { available: false, error: error.message }
      }

      return results
    } catch (error) {
      console.error('Error inspecting project:', error)
      return { error: error.message }
    }
  },

  // Get detailed table information
  async getTableInfo(tableName) {
    try {
      console.log(`📋 Getting info for table: ${tableName}`)
      
      // Try to get some sample data and count
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(5)

      if (error) {
        return { exists: false, error: error.message }
      }

      return {
        exists: true,
        totalRecords: count,
        sampleData: data,
        columns: data && data.length > 0 ? Object.keys(data[0]) : []
      }
    } catch (error) {
      return { exists: false, error: error.message }
    }
  },

  // List all available RPC functions
  async listRPCFunctions() {
    try {
      // This is a bit tricky as Supabase doesn't expose this directly
      // We'll try some common function names
      const commonFunctions = ['exec_sql', 'create_user', 'get_user_role']
      const results = {}

      for (const funcName of commonFunctions) {
        try {
          await supabase.rpc(funcName, {})
          results[funcName] = { available: true }
        } catch (error) {
          results[funcName] = { 
            available: false, 
            error: error.message.includes('does not exist') ? 'Function not found' : error.message
          }
        }
      }

      return results
    } catch (error) {
      return { error: error.message }
    }
  }
}