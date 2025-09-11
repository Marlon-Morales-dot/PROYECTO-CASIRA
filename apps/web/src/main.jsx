import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import emergency fixes for production issues
// import './lib/csp-fix.js' // ❌ TEMPORALMENTE DESHABILITADO - Conflicto con Google Auth
import './lib/comments-api-fix.js'
import './lib/image-manager.js'
// import './lib/admin-google-fix.js' // ❌ DISABLED - Mensajes de migración
import './lib/image-debug-fix.js'
// Import force migration tool for debugging
// import './lib/force-migration.js' // ❌ DISABLED - No auto-migration
// Import admin user creation
import './lib/ensure-admin.js'
// Create test volunteer request - executed once, now disabled
// import './lib/create-test-volunteer-request.js'
// Debug volunteer requests - temporarily disabled
// import './debug-volunteers.js'
// import AppSupabase from './AppSupabase.jsx'
// import { setupDemoData } from './lib/setup-demo-data.js'

// Setup demo data on first load - commented out for now
/*
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing CASIRA Connect with Supabase...');
    const result = await setupDemoData();
    console.log('✅ Demo data setup result:', result);
  } catch (error) {
    console.warn('⚠️ Demo data setup failed (this is normal if data already exists):', error);
  }
};

// Initialize app
initializeApp();
*/

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
