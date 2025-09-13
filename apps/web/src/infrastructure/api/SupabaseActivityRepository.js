/**
 * SupabaseActivityRepository - Adaptador
 * Implementa ActivityRepository usando Supabase como persistencia
 * Conecta el dominio con la infraestructura
 */

import { Activity } from '../../domain/entities/Activity.js';
import ActivityRepository from '../../application/ports/ActivityRepository.js';

export class SupabaseActivityRepository extends ActivityRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
    this.tableName = 'activities';
  }

  /**
   * Buscar actividad por ID
   */
  async findById(id) {
    try {
      // Temporarily simplified query to avoid foreign key issues
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data ? Activity.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error finding activity by ID:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las actividades con filtros opcionales
   */
  async findAll(filters = {}, pagination = {}, sorting = {}) {
    try {
      // Temporarily simplified query to avoid foreign key issues
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.creatorId) {
        query = query.eq('creator_id', filters.creatorId);
      }
      if (filters.isFeatured !== undefined) {
        // Skip is_featured filter since column doesn't exist
        console.warn('Skipping is_featured filter - column does not exist in database');
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Filtros de fecha
      if (filters.startDateFrom) {
        query = query.gte('start_date', filters.startDateFrom);
      }
      if (filters.startDateTo) {
        query = query.lte('start_date', filters.startDateTo);
      }

      // Aplicar ordenamiento
      const sortField = sorting.field || 'created_at';
      const sortDirection = sorting.direction === 'asc' ? true : false;
      query = query.order(sortField, { ascending: sortDirection });

      // Aplicar paginación
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      } else if (pagination.limit) {
        query = query.limit(pagination.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const activities = data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];

      return {
        activities,
        total: count || 0
      };
    } catch (error) {
      console.error('Error finding all activities:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades destacadas
   */
  async findFeatured(limit = 10) {
    try {
      // Skip is_featured column completely since it doesn't exist
      // Just get active activities as featured activities
      console.log('Getting active activities as featured (is_featured column not available)');

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding active activities:', error);
        return [];
      }

      return data ? data
        .filter(activityData => activityData.created_by || activityData.creator_id)
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding featured activities:', error);
      return [];
    }
  }

  /**
   * Obtener actividades por estado
   */
  async findByStatus(status, pagination = {}) {
    try {
      // Temporarily simplified query to avoid foreign key issues
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      // Aplicar paginación
      if (pagination.limit) {
        query = query.limit(pagination.limit);
      }
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding activities by status:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades por categoría
   */
  async findByCategory(categoryId, pagination = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      // Aplicar paginación
      if (pagination.limit) {
        query = query.limit(pagination.limit);
      }
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding activities by category:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades por creador
   */
  async findByCreator(creatorId, pagination = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Aplicar paginación
      if (pagination.limit) {
        query = query.limit(pagination.limit);
      }
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding activities by creator:', error);
      throw error;
    }
  }

  /**
   * Buscar actividades por texto
   */
  async search(searchText, filters = {}, pagination = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%,location.ilike.%${searchText}%`);

      // Aplicar filtros adicionales
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Aplicar paginación
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      } else if (pagination.limit) {
        query = query.limit(pagination.limit);
      }

      // Ordenamiento por relevancia (por ahora por fecha)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const activities = data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];

      return {
        activities,
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }

  /**
   * Crear nueva actividad
   */
  async create(activity) {
    try {
      const activityData = activity.toJSON();
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(activityData)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      return Activity.fromDatabase(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Actualizar actividad existente
   */
  async update(activity) {
    try {
      const activityData = activity.toJSON();
      delete activityData.created_at; // No actualizar fecha de creación
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(activityData)
        .eq('id', activity.id)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      return Activity.fromDatabase(data);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  /**
   * Eliminar actividad por ID
   */
  async delete(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  /**
   * Incrementar número de voluntarios
   */
  async incrementVolunteers(id) {
    try {
      const { error } = await this.supabase.rpc('increment_activity_volunteers', {
        activity_id: id
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing volunteers:', error);
      throw error;
    }
  }

  /**
   * Decrementar número de voluntarios
   */
  async decrementVolunteers(id) {
    try {
      const { error } = await this.supabase.rpc('decrement_activity_volunteers', {
        activity_id: id
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error decrementing volunteers:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de visualizaciones
   */
  async incrementViews(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          views_count: this.supabase.sql`views_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de likes
   */
  async incrementLikes(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          likes_count: this.supabase.sql`likes_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error incrementing likes:', error);
      throw error;
    }
  }

  /**
   * Decrementar contador de likes
   */
  async decrementLikes(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          likes_count: this.supabase.sql`GREATEST(likes_count - 1, 0)`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error decrementing likes:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de destacado
   */
  async updateFeaturedStatus(id, featured) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          is_featured: featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating featured status:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de la actividad
   */
  async updateStatus(id, status) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de actividades
   */
  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('status');

      if (error) throw error;

      const stats = data.reduce((acc, activity) => {
        acc[activity.status] = (acc[activity.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {});

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        completed: stats.completed || 0,
        draft: stats.draft || 0,
        cancelled: stats.cancelled || 0
      };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades próximas a vencer
   */
  async findUpcoming(days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString())
        .lte('start_date', futureDate.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      return data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding upcoming activities:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades que necesitan voluntarios
   */
  async findNeedingVolunteers(filters = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          activity_categories (
            id,
            name,
            color,
            icon
          ),
          users!activities_creator_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .or('max_volunteers.is.null,current_volunteers.lt.max_volunteers')
        .order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data ? data
        .filter(activityData => activityData.creator_id) // Filter out activities without creator_id
        .map(activityData => Activity.fromDatabase(activityData)) : [];
    } catch (error) {
      console.error('Error finding activities needing volunteers:', error);
      throw error;
    }
  }
}

export default SupabaseActivityRepository;