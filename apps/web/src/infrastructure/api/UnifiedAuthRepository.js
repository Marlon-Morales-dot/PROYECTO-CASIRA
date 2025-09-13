/**
 * UnifiedAuthRepository - Adaptador
 * Implementa AuthRepository unificando Google OAuth + CASIRA Auth + Supabase
 * Reemplaza toda la lógica de auth dispersa en App.jsx
 */

import { User } from '../../domain/entities/User.js';
import AuthRepository from '../../application/ports/AuthRepository.js';

export class UnifiedAuthRepository extends AuthRepository {
  constructor(supabaseClient, localStorageAdapter) {
    super();
    this.supabase = supabaseClient;
    this.localStorage = localStorageAdapter;
    this.usersTable = 'users';
    
    // Credenciales hardcodeadas para usuarios CASIRA (como en App.jsx)
    this.casiraCredentials = {
      'admin@casira.org': 'admin123',
      'carlos.martinez@email.com': 'volunteer123',
      'ana.lopez@email.com': 'ana123'
    };

    // Mapeo de emails a roles por defecto
    this.defaultRoles = {
      'admin@casira.org': 'admin',
      'carlos.martinez@email.com': 'volunteer',
      'ana.lopez@email.com': 'visitor'
    };
  }

  /**
   * Autenticar usuario con credenciales CASIRA
   */
  async authenticateWithCasira(email, password) {
    try {
      // Validar credenciales contra nuestro sistema hardcodeado
      const expectedPassword = this.casiraCredentials[email];
      
      if (!expectedPassword || expectedPassword !== password) {
        throw new Error('Credenciales inválidas');
      }

      // Buscar usuario en Supabase
      let user = await this.findUserByEmail(email);
      
      if (!user) {
        // Crear usuario si no existe
        user = await this.createCasiraUser(email);
      }

      // Generar token JWT simulado
      const token = this.generateToken(user);

      // Actualizar último login
      await this.updateLastLogin(user.id);

      return {
        user,
        token
      };

    } catch (error) {
      console.error('Error en autenticación CASIRA:', error);
      throw error;
    }
  }

  /**
   * Autenticar usuario con token de Google
   */
  async authenticateWithGoogle(googleToken) {
    try {
      // Verificar token con Google usando Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleToken
      });

      if (authError) {
        throw new Error('Token de Google inválido');
      }

      const googleUser = authData.user;
      if (!googleUser) {
        throw new Error('No se pudo obtener información del usuario de Google');
      }

      // Buscar o crear usuario en nuestra base de datos
      let user = await this.findUserByEmail(googleUser.email);
      
      if (!user) {
        user = await this.createGoogleUser(googleUser);
      } else {
        // Actualizar información de Google si es necesario
        user = await this.updateGoogleUser(user, googleUser);
      }

      // Generar nuestro propio token JWT
      const token = this.generateToken(user);

      // Actualizar último login
      await this.updateLastLogin(user.id);

      return {
        user,
        token
      };

    } catch (error) {
      console.error('Error en autenticación Google:', error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario con credenciales CASIRA
   */
  async registerWithCasira(userData) {
    try {
      const { email, password, firstName, lastName, role = 'visitor' } = userData;

      // Verificar que el usuario no exista
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Crear nuevo usuario
      const newUser = new User({
        email,
        firstName,
        lastName,
        role,
        authProvider: 'casira',
        emailVerified: false,
        isActive: true
      });

      // Guardar en Supabase
      const { data, error } = await this.supabase
        .from(this.usersTable)
        .insert(newUser.toJSON())
        .select()
        .single();

      if (error) throw error;

      const user = User.fromDatabase(data);
      const token = this.generateToken(user);

      // Agregar credenciales al sistema (en memoria, en producción sería hash)
      this.casiraCredentials[email] = password;

      return {
        user,
        token
      };

    } catch (error) {
      console.error('Error en registro CASIRA:', error);
      throw error;
    }
  }

  /**
   * Verificar y refrescar token JWT
   */
  async verifyToken(token) {
    try {
      if (!token || !token.startsWith('casira-jwt-')) {
        throw new Error('Token inválido');
      }

      // Extraer user ID del token (implementación simple)
      const userId = this.extractUserIdFromToken(token);
      
      if (!userId) {
        throw new Error('Token malformado');
      }

      // Buscar usuario en base de datos
      const user = await this.findUserById(userId);
      
      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      // Generar nuevo token (refresh)
      const newToken = this.generateToken(user);

      return {
        user,
        token: newToken
      };

    } catch (error) {
      console.error('Error verificando token:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión del usuario
   */
  async logout(token) {
    try {
      // Limpiar localStorage
      this.localStorage.removeItem('casira-current-user');
      this.localStorage.removeItem('casira-token');
      this.localStorage.removeItem('user');
      this.localStorage.removeItem('token');

      // Si hay sesión de Supabase, cerrarla también
      await this.supabase.auth.signOut();

      return true;

    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario (solo para usuarios CASIRA)
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.authProvider !== 'casira') {
        throw new Error('Cambio de contraseña solo disponible para usuarios CASIRA');
      }

      // Verificar contraseña actual
      const currentPassword = this.casiraCredentials[user.email];
      if (currentPassword !== oldPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Actualizar contraseña (en memoria, en producción sería hash)
      this.casiraCredentials[user.email] = newPassword;

      return true;

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  async requestPasswordReset(email) {
    try {
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.authProvider !== 'casira') {
        throw new Error('Restablecimiento solo disponible para usuarios CASIRA');
      }

      // En una implementación real, aquí se enviaría un email
      console.log(`Email de restablecimiento enviado a: ${email}`);
      
      return true;

    } catch (error) {
      console.error('Error solicitando restablecimiento:', error);
      throw error;
    }
  }

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Implementación placeholder
      // En producción verificaría el resetToken y actualizaría la contraseña
      throw new Error('Funcionalidad no implementada');
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      throw error;
    }
  }

  /**
   * Verificar email del usuario
   */
  async verifyEmail(verificationToken) {
    try {
      // Implementación placeholder
      // En producción verificaría el token y marcaría el email como verificado
      throw new Error('Funcionalidad no implementada');
    } catch (error) {
      console.error('Error verificando email:', error);
      throw error;
    }
  }

  /**
   * Reenviar email de verificación
   */
  async resendVerificationEmail(email) {
    try {
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.emailVerified) {
        throw new Error('Email ya está verificado');
      }

      // En una implementación real, aquí se reenviaría el email
      console.log(`Email de verificación reenviado a: ${email}`);
      
      return true;

    } catch (error) {
      console.error('Error reenviando verificación:', error);
      throw error;
    }
  }

  // ===============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ===============================================================================

  /**
   * Buscar usuario por email en Supabase
   */
  async findUserByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from(this.usersTable)
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? User.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      return null;
    }
  }

  /**
   * Buscar usuario por ID en Supabase
   */
  async findUserById(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.usersTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? User.fromDatabase(data) : null;
    } catch (error) {
      console.error('Error buscando usuario por ID:', error);
      return null;
    }
  }

  /**
   * Crear usuario CASIRA en Supabase
   */
  async createCasiraUser(email) {
    try {
      const [firstName, lastName] = this.extractNameFromEmail(email);
      const role = this.defaultRoles[email] || 'visitor';

      const newUser = new User({
        email,
        firstName,
        lastName,
        role,
        authProvider: 'casira',
        emailVerified: true,
        isActive: true
      });

      const { data, error } = await this.supabase
        .from(this.usersTable)
        .insert(newUser.toJSON())
        .select()
        .single();

      if (error) throw error;

      return User.fromDatabase(data);
    } catch (error) {
      console.error('Error creando usuario CASIRA:', error);
      throw error;
    }
  }

  /**
   * Crear usuario Google en Supabase
   */
  async createGoogleUser(googleUser) {
    try {
      const newUser = new User({
        email: googleUser.email,
        firstName: googleUser.user_metadata?.first_name || googleUser.user_metadata?.name?.split(' ')[0] || 'Usuario',
        lastName: googleUser.user_metadata?.last_name || googleUser.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Google',
        role: 'visitor', // Rol por defecto para usuarios de Google
        authProvider: 'google',
        googleId: googleUser.id,
        avatarUrl: googleUser.user_metadata?.avatar_url,
        emailVerified: true,
        isActive: true
      });

      const { data, error } = await this.supabase
        .from(this.usersTable)
        .insert(newUser.toJSON())
        .select()
        .single();

      if (error) throw error;

      return User.fromDatabase(data);
    } catch (error) {
      console.error('Error creando usuario Google:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario Google existente
   */
  async updateGoogleUser(user, googleUser) {
    try {
      // Actualizar información si es necesario
      user.googleId = googleUser.id;
      user.avatarUrl = googleUser.user_metadata?.avatar_url || user.avatarUrl;
      user.updateLastLogin();

      const { data, error } = await this.supabase
        .from(this.usersTable)
        .update(user.toJSON())
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return User.fromDatabase(data);
    } catch (error) {
      console.error('Error actualizando usuario Google:', error);
      throw error;
    }
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(userId) {
    try {
      const { error } = await this.supabase
        .from(this.usersTable)
        .update({
          last_login: new Date().toISOString()
          // Remove updated_at to avoid schema error
        })
        .eq('id', userId);

      if (error) {
        console.warn('Error actualizando último login (continuando):', error);
      }
    } catch (error) {
      console.warn('Error actualizando último login (continuando):', error);
    }
  }

  /**
   * Generar token JWT simple (en producción usar librería JWT real)
   */
  generateToken(user) {
    const tokenData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    };
    
    // Token simple para desarrollo (en producción usar JWT real)
    return `casira-jwt-${btoa(JSON.stringify(tokenData))}`;
  }

  /**
   * Extraer user ID del token
   */
  extractUserIdFromToken(token) {
    try {
      const tokenData = token.replace('casira-jwt-', '');
      const decoded = JSON.parse(atob(tokenData));
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extraer nombre del email para usuarios por defecto
   */
  extractNameFromEmail(email) {
    const emailMap = {
      'admin@casira.org': ['Administrador', 'CASIRA'],
      'carlos.martinez@email.com': ['Carlos', 'Martínez'],
      'ana.lopez@email.com': ['Ana', 'López']
    };

    return emailMap[email] || ['Usuario', 'CASIRA'];
  }
}

export default UnifiedAuthRepository;