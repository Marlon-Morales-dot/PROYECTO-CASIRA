// ============= CASIRA Axios Configuration - Best Practices =============
import axios from 'axios';

// Environment configuration
const isDevelopment = import.meta.env.MODE === 'development';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';

// For development, prefer localhost if backend is running locally
const FINAL_API_URL = isDevelopment && import.meta.env.VITE_USE_LOCAL_API 
  ? 'http://localhost:5000'
  : API_BASE_URL;

console.log('🔧 Axios configured for:', { 
  mode: import.meta.env.MODE,
  baseURL: FINAL_API_URL,
  isDevelopment,
  usingLocalAPI: isDevelopment && import.meta.env.VITE_USE_LOCAL_API
});

// Create main Axios instance
const apiClient = axios.create({
  baseURL: FINAL_API_URL,
  timeout: isDevelopment ? 10000 : 30000, // 10s dev, 30s prod
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Info': 'CASIRA-Frontend/1.0.0',
  }
});

// Request interceptor - Para agregar auth tokens, logs, etc
apiClient.interceptors.request.use(
  (config) => {
    // Log requests en desarrollo
    if (isDevelopment) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }

    // Agregar token de autorización si existe
    const currentUser = getCurrentUser();
    if (currentUser?.access_token) {
      config.headers.Authorization = `Bearer ${currentUser.access_token}`;
    }

    // Agregar timestamp para cache busting si es necesario
    if (config.method === 'get' && config.bustCache) {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Para manejar errores, tokens, etc
apiClient.interceptors.response.use(
  (response) => {
    // Log responses en desarrollo
    if (isDevelopment) {
      console.log(`📥 API Response: ${response.status}`, {
        url: response.config.url,
        data: response.data
      });
    }

    // Manejar tokens de respuesta si los hay
    const newToken = response.headers.authorization;
    if (newToken) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        currentUser.access_token = newToken.replace('Bearer ', '');
        saveCurrentUser(currentUser);
      }
    }

    return response;
  },
  (error) => {
    const { response, request, config } = error;

    // Log errors
    console.error('❌ API Error:', {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      message: error.message
    });

    // Manejar diferentes tipos de errores
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          console.warn('🔐 Unauthorized - redirecting to login');
          handleUnauthorized();
          break;
        case 403:
          console.warn('🚫 Forbidden - insufficient permissions');
          break;
        case 404:
          console.warn('📭 Resource not found');
          break;
        case 429:
          console.warn('⏰ Rate limited - too many requests');
          break;
        case 500:
          console.error('💥 Server error');
          break;
        default:
          console.error(`❌ HTTP Error ${status}:`, data?.message || error.message);
      }

      // Return structured error
      return Promise.reject({
        status,
        message: data?.message || getErrorMessage(status),
        data: data,
        originalError: error
      });
    } else if (request) {
      // Network error
      console.error('🌐 Network Error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Error de conexión. Verifica tu internet.',
        networkError: true,
        originalError: error
      });
    } else {
      // Request setup error
      console.error('⚙️ Request Setup Error:', error.message);
      return Promise.reject({
        status: -1,
        message: 'Error configurando la petición',
        configError: true,
        originalError: error
      });
    }
  }
);

// Helper functions
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('casira-current-user') || 
                    sessionStorage.getItem('casira-current-user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function saveCurrentUser(user) {
  try {
    const userString = JSON.stringify(user);
    localStorage.setItem('casira-current-user', userString);
    sessionStorage.setItem('casira-current-user', userString);
  } catch (error) {
    console.error('Error saving current user:', error);
  }
}

function handleUnauthorized() {
  // Clear user data
  localStorage.removeItem('casira-current-user');
  sessionStorage.removeItem('casira-current-user');
  
  // Redirect to login if we're not already there
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function getErrorMessage(status) {
  const messages = {
    400: 'Petición inválida',
    401: 'No autorizado',
    403: 'Acceso denegado', 
    404: 'Recurso no encontrado',
    429: 'Demasiadas peticiones',
    500: 'Error del servidor',
    502: 'Error de gateway',
    503: 'Servicio no disponible',
    504: 'Timeout del gateway'
  };
  return messages[status] || `Error HTTP ${status}`;
}

// Create specialized instances for different APIs
export const backendAPI = apiClient;

// Google APIs instance (different base URL and headers)
export const googleAPI = axios.create({
  baseURL: 'https://www.googleapis.com',
  timeout: 15000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// External APIs instance (for third-party integrations)
export const externalAPI = axios.create({
  timeout: 20000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Info': 'CASIRA-Frontend/1.0.0'
  }
});

// Default export is the main backend API
export default apiClient;