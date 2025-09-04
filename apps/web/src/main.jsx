import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
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
