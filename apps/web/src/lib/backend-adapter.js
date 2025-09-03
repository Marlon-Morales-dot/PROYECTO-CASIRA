// Backend Adapter - Conecta frontend con backend Render
import { keepAlive } from './keep-alive.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';

class BackendAdapter {
  constructor() {
    this.fallbackMode = false;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos cache
    
    // Iniciar keep-alive
    keepAlive.start();
    
    console.log('🔌 Backend Adapter initialized with API:', API_BASE_URL);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Check cache first for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`💾 Using cached data for ${endpoint}`);
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      this.fallbackMode = false;
      return data;

    } catch (error) {
      console.error(`❌ Backend request failed for ${endpoint}:`, error.message);
      this.fallbackMode = true;
      
      // Intentar despertar el servicio con ping
      keepAlive.pingServer();
      
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    try {
      const data = await this.makeRequest('/api/health');
      return data;
    } catch (error) {
      return null;
    }
  }

  // Projects/Activities
  async getFeaturedProjects() {
    try {
      console.log('🔍 Fetching featured projects from backend...');
      const data = await this.makeRequest('/api/projects/featured');
      console.log('✅ Featured projects loaded:', data.projects?.length || 0);
      return data.projects || [];
    } catch (error) {
      console.log('⚠️ Falling back to local data for featured projects');
      return this.getLocalFeaturedProjects();
    }
  }

  async getAllProjects() {
    try {
      const data = await this.makeRequest('/api/projects');
      return data.projects || [];
    } catch (error) {
      console.log('⚠️ Falling back to local data for projects');
      return this.getLocalProjects();
    }
  }

  async getProjectStats() {
    try {
      const data = await this.makeRequest('/api/projects/stats');
      return data;
    } catch (error) {
      console.log('⚠️ Falling back to local data for stats');
      return this.getLocalStats();
    }
  }

  // Posts
  async getPosts() {
    try {
      const data = await this.makeRequest('/api/posts');
      return data.posts || [];
    } catch (error) {
      console.log('⚠️ Falling back to local data for posts');
      return this.getLocalPosts();
    }
  }

  // Auth
  async loginUser(email, password) {
    try {
      const data = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      return data;
    } catch (error) {
      console.log('⚠️ Backend login failed, trying local fallback');
      throw error;
    }
  }

  async registerUser(userData) {
    try {
      const data = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return data;
    } catch (error) {
      console.log('⚠️ Backend registration failed');
      throw error;
    }
  }

  async googleAuth(token) {
    try {
      const data = await this.makeRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      return data;
    } catch (error) {
      console.log('⚠️ Backend Google auth failed');
      throw error;
    }
  }

  // Fallback methods with local data
  getLocalFeaturedProjects() {
    return [
      {
        id: 1,
        title: "Programa de Becas Educativas 2024",
        description: "Otorgamos becas completas a estudiantes destacados de escasos recursos",
        status: "active",
        budget: 50000,
        beneficiaries_count: 25,
        created_at: "2024-01-15",
        image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
      }
    ];
  }

  getLocalProjects() {
    return [
      {
        id: 1,
        title: "Programa de Becas Educativas 2024",
        description: "Otorgamos becas completas a estudiantes destacados de escasos recursos",
        status: "active",
        budget: 50000,
        beneficiaries_count: 25,
        created_at: "2024-01-15"
      },
      {
        id: 2,
        title: "Centro Comunitario Digital",
        description: "Establecimiento de centro con acceso a internet y capacitación tecnológica",
        status: "in_progress",
        budget: 30000,
        beneficiaries_count: 150,
        created_at: "2024-02-01"
      }
    ];
  }

  getLocalStats() {
    return {
      total_projects: 2,
      total_budget: 80000,
      total_beneficiaries: 175,
      active_projects: 1
    };
  }

  getLocalPosts() {
    return [
      {
        id: 1,
        title: "¡Nuevas becas disponibles!",
        content: "Hemos abierto la convocatoria para 20 nuevas becas educativas. Aplica ya!",
        author: "Administrador CASIRA",
        created_at: "2024-11-15",
        likes: 15,
        comments: []
      }
    ];
  }

  // Status check
  isBackendAvailable() {
    return !this.fallbackMode;
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Backend cache cleared');
  }
}

// Crear instancia global
export const backendAdapter = new BackendAdapter();

export default backendAdapter;