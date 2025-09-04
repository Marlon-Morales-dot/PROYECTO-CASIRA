// 🔍 Debug script para verificar conexión Vercel → Render
console.log('🔍 === CASIRA CONNECTION DEBUG ===');

// 1. Verificar variables de entorno
console.log('📊 Environment Variables:');
console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('- MODE:', import.meta.env.MODE);
console.log('- DEV:', import.meta.env.DEV);
console.log('- PROD:', import.meta.env.PROD);

// 2. Probar conexión directa
async function testConnection() {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';
  
  console.log('🌐 Testing connection to:', API_URL);
  
  try {
    // Test 1: Health check
    console.log('🏥 Testing /api/health...');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    console.log('Health Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Response:', healthData);
    } else {
      console.error('❌ Health check failed:', healthResponse.statusText);
    }
    
    // Test 2: Projects endpoint (correct endpoint name)
    console.log('📋 Testing /api/projects...');
    const projectsResponse = await fetch(`${API_URL}/api/projects`);
    console.log('Projects Status:', projectsResponse.status);
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('✅ Projects Response:', projectsData);
      
      // Check if projects have images
      if (projectsData.projects && projectsData.projects.length > 0) {
        const firstProject = projectsData.projects[0];
        console.log('🖼️ First project image_url:', firstProject.image_url);
      }
    } else {
      console.error('❌ Projects request failed:', projectsResponse.statusText);
    }
    
  } catch (error) {
    console.error('💥 Connection Error:', error);
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// 3. Verificar desde qué fuente se cargan los datos
console.log('📦 Checking data source...');
try {
  const localData = localStorage.getItem('casira-data-v2');
  if (localData) {
    const parsed = JSON.parse(localData);
    console.log('💾 Local storage data found:', {
      users: parsed.users?.length || 0,
      activities: parsed.activities?.length || 0
    });
    
    if (parsed.activities && parsed.activities[0]) {
      console.log('🖼️ Local activity image_url:', parsed.activities[0].image_url);
    }
  } else {
    console.log('📭 No local storage data found');
  }
} catch (error) {
  console.error('❌ Error reading localStorage:', error);
}

// Ejecutar test
testConnection();

export default testConnection;