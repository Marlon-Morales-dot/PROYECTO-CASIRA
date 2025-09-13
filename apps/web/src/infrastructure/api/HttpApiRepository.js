/**
 * HttpApiRepository - Adaptador HTTP para API Flask
 * Maneja comunicación con el backend de Flask en Render.com
 * Integra con la arquitectura hexagonal y el sistema de configuración
 */

import { configManager } from '../../shared/utils/ConfigManager.js';

export class HttpApiRepository {
  constructor() {
    this.baseUrl = configManager.get('api.baseUrl');
    this.timeout = configManager.get('api.timeout', 30000);
    this.retryAttempts = configManager.get('api.retryAttempts', 3);
    this.retryDelay = configManager.get('api.retryDelay', 1000);
  }

  /**
   * Realizar petición HTTP con reintentos automáticos
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`[HttpApiRepository] Attempt ${attempt}/${this.retryAttempts}: ${config.method} ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`[HttpApiRepository] ✅ Success: ${config.method} ${url}`, 
          data ? `(${JSON.stringify(data).length} chars)` : '(no data)');
        
        return data;
        
      } catch (error) {
        lastError = error;
        console.error(`[HttpApiRepository] ❌ Attempt ${attempt} failed:`, error.message);
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Backoff exponencial
        }
      }
    }
    
    throw new Error(`Request failed after ${this.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * GET request
   */
  async get(endpoint, params = null) {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value);
        }
      });
      url += `?${searchParams.toString()}`;
    }
    
    return this.makeRequest(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = null) {
    const options = {
      method: 'POST',
      body: data ? JSON.stringify(data) : null
    };
    
    return this.makeRequest(endpoint, options);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = null) {
    const options = {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null
    };
    
    return this.makeRequest(endpoint, options);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check del API
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return {
        isHealthy: response.status === 'healthy',
        ...response
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }

  /**
   * Delay utility para reintentos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * PostsApiRepository - Manejo de posts a través de HTTP
 */
export class PostsApiRepository extends HttpApiRepository {
  
  /**
   * Obtener posts públicos
   */
  async getPublicPosts(limit = 10) {
    try {
      const response = await this.get('/posts', { limit });
      return response.posts || [];
    } catch (error) {
      console.warn('[PostsApiRepository] Falling back to local data:', error);
      return this.getFallbackPosts();
    }
  }

  /**
   * Crear nuevo post
   */
  async createPost(postData) {
    try {
      const response = await this.post('/posts', postData);
      return response.post;
    } catch (error) {
      console.error('[PostsApiRepository] Error creating post:', error);
      throw error;
    }
  }

  /**
   * Toggle like en post
   */
  async togglePostLike(postId, userId) {
    try {
      const response = await this.post(`/posts/${postId}/like`, { user_id: userId });
      return response;
    } catch (error) {
      console.error('[PostsApiRepository] Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de post
   */
  async getPostComments(postId) {
    try {
      const response = await this.get(`/posts/${postId}/comments`);
      return response.comments || [];
    } catch (error) {
      console.error('[PostsApiRepository] Error getting comments:', error);
      return [];
    }
  }

  /**
   * Agregar comentario a post
   */
  async addPostComment(postId, commentData) {
    try {
      const response = await this.post(`/posts/${postId}/comments`, commentData);
      return response.comment;
    } catch (error) {
      console.error('[PostsApiRepository] Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Posts de fallback cuando el API no está disponible
   */
  getFallbackPosts() {
    return [
      {
        id: 1,
        content: "¡Inauguramos la nueva biblioteca en San Juan! 300 niños ahora tienen acceso a libros y tecnología moderna. Un sueño hecho realidad gracias a todos los constructores que hicieron esto posible.",
        image_url: "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/006.jpg",
        author: {
          first_name: "María",
          last_name: "González"
        },
        created_at: "2024-03-15T10:30:00Z",
        likes_count: 24,
        comments_count: 8,
        shares_count: 5
      },
      {
        id: 2,
        content: "El nuevo laboratorio de ciencias del Liceo San Francisco está transformando la educación. Los estudiantes pueden hacer experimentos que antes solo veían en libros.",
        image_url: "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/L20-1024x752-1.png",
        author: {
          first_name: "Carlos",
          last_name: "Méndez"
        },
        created_at: "2024-03-10T14:20:00Z",
        likes_count: 18,
        comments_count: 12,
        shares_count: 3
      },
      {
        id: 3,
        content: "El centro comunitario ya está sirviendo a más de 1,200 familias. Ayer se realizó el primer taller de capacitación laboral con gran éxito.",
        image_url: "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg",
        author: {
          first_name: "Ana",
          last_name: "Rodríguez"
        },
        created_at: "2024-03-08T16:45:00Z",
        likes_count: 31,
        comments_count: 15,
        shares_count: 7
      }
    ];
  }
}

/**
 * ProjectsApiRepository - Manejo de proyectos a través de HTTP
 */
export class ProjectsApiRepository extends HttpApiRepository {
  
  /**
   * Obtener todos los proyectos
   */
  async getAllProjects() {
    try {
      const response = await this.get('/projects');
      return response.projects || [];
    } catch (error) {
      console.warn('[ProjectsApiRepository] Falling back to local data:', error);
      return [];
    }
  }

  /**
   * Obtener proyectos destacados
   */
  async getFeaturedProjects() {
    try {
      const response = await this.get('/projects/featured');
      return response.projects || [];
    } catch (error) {
      console.warn('[ProjectsApiRepository] Falling back to local data:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de proyectos
   */
  async getProjectStats() {
    try {
      const response = await this.get('/projects/stats');
      return response;
    } catch (error) {
      console.warn('[ProjectsApiRepository] Using fallback stats:', error);
      return {
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
        total_budget: 0,
        total_beneficiaries: 0
      };
    }
  }
}

/**
 * AuthApiRepository - Autenticación a través del API HTTP
 */
export class AuthApiRepository extends HttpApiRepository {
  
  /**
   * Login con credenciales CASIRA
   */
  async loginWithCredentials(email, password) {
    try {
      const response = await this.post('/auth/login', { email, password });
      return response;
    } catch (error) {
      console.error('[AuthApiRepository] Login failed:', error);
      throw error;
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async registerUser(userData) {
    try {
      const response = await this.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('[AuthApiRepository] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Autenticación con Google
   */
  async authenticateWithGoogle(googleToken) {
    try {
      const response = await this.post('/auth/google', { token: googleToken });
      return response;
    } catch (error) {
      console.error('[AuthApiRepository] Google auth failed:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateUserProfile(profileData) {
    try {
      const response = await this.post('/users/profile', profileData);
      return response;
    } catch (error) {
      console.error('[AuthApiRepository] Profile update failed:', error);
      throw error;
    }
  }
}

// Instancias singleton para usar en la aplicación
export const postsAPI = new PostsApiRepository();
export const projectsAPI = new ProjectsApiRepository();
export const authAPI = new AuthApiRepository();

export default HttpApiRepository;