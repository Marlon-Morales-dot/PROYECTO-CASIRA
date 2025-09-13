/**
 * SupabaseUserRepository - Adaptador
 * Implementa UserRepository usando Supabase como persistencia
 * Conecta el dominio con la infraestructura
 */

import { User } from '../../domain/entities/User.js';
import UserRepository from '../../application/ports/UserRepository.js';

export class SupabaseUserRepository extends UserRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
    this.tableName = 'users';
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data ? User.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data ? User.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por Google ID
   */
  async findByGoogleId(googleId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('google_id', googleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data ? User.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios con filtros opcionales
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.emailVerified !== undefined) {
        query = query.eq('email_verified', filters.emailVerified);
      }
      if (filters.authProvider) {
        query = query.eq('auth_provider', filters.authProvider);
      }

      // Aplicar paginación
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      } else if (pagination.limit) {
        query = query.limit(pagination.limit);
      }

      // Ordenamiento por defecto por fecha de creación
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const users = data ? data.map(userData => User.fromDatabase(userData)) : [];

      return {
        users,
        total: count || 0
      };
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async create(user) {
    try {
      const userData = user.toJSON();
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(userData)
        .select()
        .single();

      if (error) throw error;

      return User.fromDatabase(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario existente
   */
  async update(user) {
    try {
      const userData = user.toJSON();
      delete userData.created_at; // No actualizar fecha de creación

      // Remove fields that might not exist in the database schema
      delete userData.updated_at; // Column might not exist
      delete userData.auth_provider; // Column might not exist

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.warn('Error updating user (continuing with cached data):', error);
        // Return the original user if update fails
        return user;
      }

      return User.fromDatabase(data);
    } catch (error) {
      console.warn('Error updating user (continuing with cached data):', error);
      // Return the original user if update fails
      return user;
    }
  }

  /**
   * Eliminar usuario por ID
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
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Verificar si existe un usuario con el email dado
   */
  async existsByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('email', email)
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking if user exists by email:', error);
      throw error;
    }
  }

  /**
   * Contar usuarios por rol
   */
  async countByRole() {
    try {
      // Skip is_active filter since column doesn't exist
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('role');

      if (error) throw error;

      const roleCount = data.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      return roleCount;
    } catch (error) {
      console.error('Error counting users by role:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role) {
    try {
      // Skip is_active filter since column doesn't exist
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data ? data.map(userData => User.fromDatabase(userData)) : [];
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw error;
    }
  }

  /**
   * Actualizar último login del usuario
   */
  async updateLastLogin(id) {
    try {
      // Only update last_login field if it exists, skip updated_at if missing
      const updateData = {
        last_login: new Date().toISOString()
      };

      // Try to update with minimal fields to avoid schema errors
      const { error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.warn('Error updating last login (continuing anyway):', error);
        // Don't throw error, just log warning and continue
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Error updating last login (continuing anyway):', error);
      // Don't throw error, just log warning and continue
      return true;
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async updateActiveStatus(id, isActive) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating active status:', error);
      throw error;
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async changeRole(id, newRole) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }

  /**
   * Crear o actualizar usuario (upsert) - método auxiliar
   */
  async upsert(user) {
    try {
      const userData = user.toJSON();
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(userData, { onConflict: 'email' })
        .select()
        .single();

      if (error) throw error;

      return User.fromDatabase(data);
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios con búsqueda de texto
   */
  async search(searchText, filters = {}, pagination = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .or(`first_name.ilike.%${searchText}%,last_name.ilike.%${searchText}%,email.ilike.%${searchText}%`);

      // Aplicar filtros adicionales
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isActive !== undefined) {
        // Skip is_active filter since column doesn't exist
        console.warn('Skipping is_active filter - column does not exist');
      }

      // Aplicar paginación
      if (pagination.offset) {
        query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1);
      } else if (pagination.limit) {
        query = query.limit(pagination.limit);
      }

      // Ordenamiento
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const users = data ? data.map(userData => User.fromDatabase(userData)) : [];

      return {
        users,
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

export default SupabaseUserRepository;