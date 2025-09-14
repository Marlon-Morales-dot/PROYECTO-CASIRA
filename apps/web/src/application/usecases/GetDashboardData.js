/**
 * GetDashboardData UseCase
 * Extrae la lógica de carga de datos del dashboard que está en App.jsx
 * Centraliza la obtención de estadísticas, actividades y posts
 */

export class GetDashboardData {
  constructor(activityRepository, postRepository, userRepository) {
    this.activityRepository = activityRepository;
    this.postRepository = postRepository;
    this.userRepository = userRepository;
  }

  /**
   * Obtener datos completos del dashboard para landing page
   * @returns {Promise<{activities: Activity[], posts: Post[], stats: Object, success: boolean}>}
   */
  async executeForLanding() {
    try {
      // Validate dependencies before executing
      if (!this.activityRepository) {
        console.error('❌ GetDashboardData: activityRepository is undefined in executeForLanding');
        return {
          success: false,
          featuredActivities: [],
          activities: [],
          posts: [],
          stats: this.getDefaultStats(),
          message: 'Repositorios no inicializados correctamente'
        };
      }

      // Execute queries with individual error handling
      let featuredActivities = [];
      let publicActivities = { activities: [] };
      let recentPosts = { posts: [] };
      let dashboardStats = this.getDefaultStats();

      try {
        featuredActivities = await this.activityRepository.findFeatured(6);
      } catch (error) {
        console.error('❌ Error loading featured activities:', error);
        // Provide fallback empty array for 401 errors
        if (error.code === 401 || (error.message && error.message.includes('401'))) {
          console.warn('⚠️ Using empty array fallback for featured activities due to auth error');
          featuredActivities = [];
        }
      }

      try {
        publicActivities = await this.activityRepository.findAll(
          { status: 'active', visibility: 'public' },
          { limit: 10 }
        );
      } catch (error) {
        console.error('❌ Error loading public activities:', error);
        // Provide fallback empty result for 401 errors
        if (error.code === 401 || (error.message && error.message.includes('401'))) {
          console.warn('⚠️ Using empty array fallback for public activities due to auth error');
          publicActivities = { activities: [] };
        }
      }

      try {
        if (this.postRepository) {
          recentPosts = await this.postRepository.findAll(
            { visibility: 'public' },
            { limit: 10 }
          );
        }
      } catch (error) {
        console.error('❌ Error loading recent posts:', error);
      }

      try {
        dashboardStats = await this.getDashboardStats();
      } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
      }

      return {
        success: true,
        featuredActivities: featuredActivities || [],
        activities: publicActivities.activities || [],
        posts: recentPosts.posts || [],
        stats: dashboardStats,
        message: 'Datos cargados exitosamente'
      };

    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      return {
        success: false,
        featuredActivities: [],
        activities: [],
        posts: [],
        stats: this.getDefaultStats(),
        message: 'Error al cargar los datos'
      };
    }
  }

  /**
   * Obtener datos del dashboard para usuario autenticado
   * @param {User} user - Usuario autenticado
   * @returns {Promise<{activities: Activity[], posts: Post[], stats: Object, notifications: Object[], success: boolean}>}
   */
  async executeForUser(user) {
    try {
      const [
        userActivities,
        feedPosts,
        userStats,
        notifications
      ] = await Promise.all([
        this.getUserActivities(user),
        this.getUserFeed(user),
        this.getUserStats(user),
        this.getUserNotifications(user)
      ]);

      return {
        success: true,
        activities: userActivities,
        posts: feedPosts,
        stats: userStats,
        notifications,
        message: 'Dashboard cargado exitosamente'
      };

    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return {
        success: false,
        activities: [],
        posts: [],
        stats: this.getDefaultStats(),
        notifications: [],
        message: 'Error al cargar el dashboard'
      };
    }
  }

  /**
   * Obtener datos específicos para admin
   * @param {User} adminUser - Usuario administrador
   * @returns {Promise<{activities: Activity[], users: User[], stats: Object, success: boolean}>}
   */
  async executeForAdmin(adminUser) {
    try {
      if (!adminUser.isAdmin()) {
        throw new Error('Usuario no tiene permisos de administrador');
      }

      const [
        allActivities,
        allUsers,
        adminStats,
        pendingRequests
      ] = await Promise.all([
        this.activityRepository.findAll({}, { limit: 50 }),
        this.userRepository.findAll({}, { limit: 100 }),
        this.getAdminStats(),
        this.getPendingVolunteerRequests()
      ]);

      return {
        success: true,
        activities: allActivities.activities,
        users: allUsers.users,
        stats: adminStats,
        pendingRequests,
        message: 'Panel de admin cargado exitosamente'
      };

    } catch (error) {
      console.error('Error obteniendo datos de admin:', error);
      return {
        success: false,
        activities: [],
        users: [],
        stats: this.getDefaultStats(),
        pendingRequests: [],
        message: 'Error al cargar panel de administración'
      };
    }
  }

  /**
   * Obtener estadísticas generales del dashboard
   * @returns {Promise<Object>} Estadísticas del sistema
   */
  async getDashboardStats() {
    try {
      // Validate dependencies
      if (!this.userRepository) {
        console.error('❌ GetDashboardData: userRepository is undefined');
        return this.getDefaultStats();
      }

      if (!this.activityRepository) {
        console.error('❌ GetDashboardData: activityRepository is undefined');
        return this.getDefaultStats();
      }

      // Get stats with individual error handling
      let activityStats = { active: 0, completed: 0 };
      let userStats = {};
      let postStats = { total: 0, totalLikes: 0, totalComments: 0 };

      try {
        activityStats = await this.activityRepository.getStats() || { active: 0, completed: 0 };
      } catch (error) {
        console.error('❌ Error getting activity stats:', error);
      }

      try {
        userStats = await this.userRepository.countByRole() || {};
        console.log('✅ User stats retrieved:', userStats);
      } catch (error) {
        console.error('❌ Error getting user stats:', error);
        // Provide fallback default stats for 401 errors
        if (error.code === 401 || (error.message && error.message.includes('401'))) {
          console.warn('⚠️ Using default user stats fallback due to auth error');
          userStats = {
            visitor: 0,
            volunteer: 0,
            admin: 0,
            donor: 0
          };
        }
      }

      try {
        postStats = await this.getPostStats() || { total: 0, totalLikes: 0, totalComments: 0 };
      } catch (error) {
        console.error('❌ Error getting post stats:', error);
      }

      const stats = {
        activeProjects: activityStats.active || 0,
        completedProjects: activityStats.completed || 0,
        totalUsers: Object.values(userStats || {}).reduce((sum, count) => sum + count, 0),
        totalVolunteers: userStats?.volunteer || 0,
        totalAdmins: userStats?.admin || 0,
        totalVisitors: userStats?.visitor || 0,
        totalDonors: userStats?.donor || 0,
        totalPosts: postStats.total || 0,
        totalInteractions: (postStats.totalLikes || 0) + (postStats.totalComments || 0),
        livesTransformed: Math.floor((userStats?.volunteer || 0) * 1.5) // Fórmula de impacto
      };

      console.log('✅ Dashboard stats calculated:', stats);
      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Obtener actividades relevantes para el usuario
   * @param {User} user - Usuario
   * @returns {Promise<Activity[]>} Actividades del usuario
   */
  async getUserActivities(user) {
    try {
      if (user.isAdmin()) {
        const result = await this.activityRepository.findAll({}, { limit: 20 });
        return result.activities;
      }

      if (user.isVolunteer()) {
        // Actividades donde participa + actividades disponibles
        const [participatingActivities, availableActivities] = await Promise.all([
          this.getActivitiesWhereUserParticipates(user.id),
          this.activityRepository.findNeedingVolunteers({ limit: 10 })
        ]);
        return [...participatingActivities, ...availableActivities];
      }

      // Para visitantes, mostrar actividades públicas
      const result = await this.activityRepository.findAll(
        { status: 'active', visibility: 'public' }, 
        { limit: 15 }
      );
      return result.activities;

    } catch (error) {
      console.error('Error obteniendo actividades del usuario:', error);
      return [];
    }
  }

  /**
   * Obtener feed personalizado para el usuario
   * @param {User} user - Usuario
   * @returns {Promise<Post[]>} Posts del feed
   */
  async getUserFeed(user) {
    try {
      // Por ahora, feed público para todos
      // En el futuro se puede personalizar por follows, intereses, etc.
      const result = await this.postRepository.findAll(
        { visibility: 'public' }, 
        { limit: 20, offset: 0 },
        { field: 'created_at', direction: 'desc' }
      );
      
      return result.posts;

    } catch (error) {
      console.error('Error obteniendo feed del usuario:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas específicas del usuario
   * @param {User} user - Usuario
   * @returns {Promise<Object>} Estadísticas del usuario
   */
  async getUserStats(user) {
    try {
      // Estadísticas básicas más estadísticas generales
      const [generalStats, userSpecificStats] = await Promise.all([
        this.getDashboardStats(),
        this.getUserSpecificStats(user)
      ]);

      return {
        ...generalStats,
        ...userSpecificStats
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas del usuario:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Obtener estadísticas específicas por tipo de usuario
   * @param {User} user - Usuario
   * @returns {Promise<Object>} Estadísticas específicas
   */
  async getUserSpecificStats(user) {
    // Este método se puede expandir para obtener estadísticas específicas
    // por ejemplo: actividades creadas, posts publicados, likes recibidos, etc.
    return {
      userRole: user.role,
      memberSince: user.createdAt,
      lastActivity: user.lastLogin
    };
  }

  /**
   * Obtener notificaciones del usuario (placeholder)
   * @param {User} user - Usuario
   * @returns {Promise<Array>} Notificaciones
   */
  async getUserNotifications(user) {
    // Placeholder - se implementará cuando tengamos NotificationRepository
    return [];
  }

  /**
   * Obtener estadísticas para admin
   * @returns {Promise<Object>} Estadísticas administrativas
   */
  async getAdminStats() {
    const basicStats = await this.getDashboardStats();
    
    // Agregar estadísticas adicionales para admin
    return {
      ...basicStats,
      // Aquí se pueden agregar más estadísticas específicas de admin
      systemHealth: 'online',
      lastBackup: new Date().toISOString()
    };
  }

  /**
   * Obtener solicitudes pendientes de voluntariado (placeholder)
   * @returns {Promise<Array>} Solicitudes pendientes
   */
  async getPendingVolunteerRequests() {
    // Placeholder - se implementará cuando tengamos VolunteerRequestRepository
    return [];
  }

  /**
   * Obtener actividades donde participa el usuario (placeholder)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Activity[]>} Actividades donde participa
   */
  async getActivitiesWhereUserParticipates(userId) {
    // Placeholder - se implementará cuando tengamos ParticipantRepository
    return [];
  }

  /**
   * Obtener estadísticas de posts (placeholder)
   * @returns {Promise<Object>} Estadísticas de posts
   */
  async getPostStats() {
    // Placeholder - se implementará cuando tengamos PostRepository completo
    return {
      total: 0,
      totalLikes: 0,
      totalComments: 0
    };
  }

  /**
   * Estadísticas por defecto cuando hay error
   * @returns {Object} Estadísticas por defecto
   */
  getDefaultStats() {
    return {
      activeProjects: 0,
      completedProjects: 0,
      totalUsers: 0,
      totalVolunteers: 0,
      totalAdmins: 0,
      totalVisitors: 0,
      totalDonors: 0,
      totalPosts: 0,
      totalInteractions: 0,
      livesTransformed: 0
    };
  }
}

export default GetDashboardData;