// ============= CASIRA Connect - Supabase Client =============
import { supabase } from './supabase-singleton.js';

// Re-export the Supabase client and utilities
export { supabase };
export { getSupabaseClient, supabaseAuth, commentsAPI, postsAPI, storageAPI } from './supabase-singleton.js';

// Default export
export default supabase;