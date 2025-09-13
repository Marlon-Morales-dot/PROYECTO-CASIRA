// ============= CASIRA Connect - Supabase Health Check =============
import { createClient } from '@supabase/supabase-js';

// Test Supabase connection
export const testSupabaseConnection = async () => {
  console.log('🔍 CASIRA: Starting Supabase health check...');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

  console.log('📊 Environment variables:');
  console.log('  - URL:', supabaseUrl);
  console.log('  - Key present:', !!supabaseAnonKey);
  console.log('  - Key length:', supabaseAnonKey?.length);

  try {
    // Create a test client
    const testClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');

    // Test basic connectivity with a simple query
    console.log('🔌 Testing basic connectivity...');

    // Try to get the current time from Supabase (this is a simple test)
    const { data, error } = await testClient
      .from('users')
      .select('count(*)', { count: 'exact' })
      .limit(0);

    if (error) {
      console.error('❌ Health check failed:', error);

      // Check if it's an HTML response
      if (error.message && error.message.includes('<!doctype')) {
        console.error('⚠️  Received HTML response instead of JSON');
        console.error('   This indicates:');
        console.error('   1. Supabase URL might be incorrect');
        console.error('   2. CORS configuration issues');
        console.error('   3. Network or DNS problems');
        return { healthy: false, error: 'HTML_RESPONSE', details: error.message };
      }

      return { healthy: false, error: error.code, details: error.message };
    }

    console.log('✅ Health check passed!', data);
    return { healthy: true, data };

  } catch (error) {
    console.error('❌ Health check exception:', error);

    if (error.message && error.message.includes('<!doctype')) {
      console.error('⚠️  Exception contains HTML response');
      return { healthy: false, error: 'HTML_RESPONSE_EXCEPTION', details: error.message };
    }

    return { healthy: false, error: 'EXCEPTION', details: error.message };
  }
};

// Auto-run health check when imported
if (typeof window !== 'undefined') {
  testSupabaseConnection().then(result => {
    console.log('🏥 CASIRA Health Check Result:', result);
  });
}