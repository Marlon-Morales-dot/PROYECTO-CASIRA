// ============= CASIRA Connect - Ensure Admin User =============
// Ensures admin user exists in Supabase for creating activities

console.log('👑 CASIRA: Loading Admin User Ensure Tool');

import { supabaseAPI } from './supabase-api.js';

export async function ensureAdminUserExists() {
  try {
    console.log('🔍 CASIRA: Checking if admin user exists in Supabase...');
    
    const adminUser = await supabaseAPI.users.getUserByEmail('admin@casira.org');
    
    if (adminUser) {
      console.log('✅ CASIRA: Admin user already exists:', adminUser);
      return adminUser;
    }
    
    console.log('🔧 CASIRA: Creating admin user in Supabase...');
    
    const newAdminUser = await supabaseAPI.users.createUser({
      email: 'admin@casira.org',
      first_name: 'Administrador',
      last_name: 'CASIRA',
      role: 'admin',
      bio: 'Administrador principal de la plataforma CASIRA Connect',
      avatar_url: null
    });
    
    console.log('🎉 CASIRA: Admin user created successfully:', newAdminUser);
    
    // Store admin ID globally for easy access
    window.CASIRA_ADMIN_ID = newAdminUser.id;
    
    return newAdminUser;
    
  } catch (error) {
    console.error('❌ CASIRA: Failed to ensure admin user exists:', error);
    throw error;
  }
}

// Auto-run on load
ensureAdminUserExists().catch(error => {
  console.error('❌ CASIRA: Auto admin creation failed:', error);
});

console.log('✅ CASIRA: Admin User Ensure Tool Ready');