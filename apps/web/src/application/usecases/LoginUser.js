/**
 * LoginUser UseCase
 * Extrae la lógica de autenticación que está dispersa en App.jsx
 * Maneja tanto login CASIRA como Google de forma unificada
 */

import { User } from '../../domain/entities/User.js';

export class LoginUser {
  constructor(authRepository, userRepository) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
  }

  /**
   * Ejecutar login con credenciales CASIRA
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<{success: boolean, user: User, token: string, message: string}>}
   */
  async executeWithCasira(email, password) {
    try {
      // Validar entrada
      if (!email || !password) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Email y contraseña son requeridos'
        };
      }

      // Autenticar con repositorio
      const authResult = await this.authRepository.authenticateWithCasira(email, password);
      
      if (!authResult.user || !authResult.token) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Credenciales inválidas'
        };
      }

      // Actualizar último login
      const user = authResult.user.updateLastLogin();
      await this.userRepository.update(user);

      // Determinar mensaje de bienvenida basado en rol
      const welcomeMessage = this.getWelcomeMessage(user);

      return {
        success: true,
        user: user,
        token: authResult.token,
        message: welcomeMessage
      };

    } catch (error) {
      console.error('Error en login CASIRA:', error);
      return {
        success: false,
        user: null,
        token: null,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Ejecutar login con token de Google
   * @param {string} googleToken - Token de Google
   * @returns {Promise<{success: boolean, user: User, token: string, message: string}>}
   */
  async executeWithGoogle(googleToken) {
    try {
      // Validar entrada
      if (!googleToken) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Token de Google es requerido'
        };
      }

      // Autenticar con Google
      const authResult = await this.authRepository.authenticateWithGoogle(googleToken);
      
      if (!authResult.user || !authResult.token) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Token de Google inválido'
        };
      }

      let user = authResult.user;

      // Si es la primera vez, buscar o crear usuario
      let existingUser = await this.userRepository.findByEmail(user.email);
      
      if (!existingUser) {
        // Crear nuevo usuario con rol por defecto
        user = new User({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: 'visitor', // Rol por defecto para nuevos usuarios de Google
          authProvider: 'google',
          googleId: user.googleId || user.id,
          emailVerified: true,
          isActive: true
        });
        
        existingUser = await this.userRepository.create(user);
      } else {
        // Actualizar usuario existente
        existingUser.updateLastLogin();
        if (user.googleId) {
          existingUser.googleId = user.googleId;
        }
        existingUser = await this.userRepository.update(existingUser);
      }

      // Determinar mensaje de bienvenida
      const welcomeMessage = this.getWelcomeMessage(existingUser);

      return {
        success: true,
        user: existingUser,
        token: authResult.token,
        message: welcomeMessage
      };

    } catch (error) {
      console.error('Error en login Google:', error);
      return {
        success: false,
        user: null,
        token: null,
        message: 'Error al autenticar con Google'
      };
    }
  }

  /**
   * Verificar token existente (para sesiones persistentes)
   * @param {string} token - Token JWT existente
   * @returns {Promise<{success: boolean, user: User, token: string, message: string}>}
   */
  async verifyExistingToken(token) {
    try {
      if (!token) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Token no proporcionado'
        };
      }

      // Verificar token con repositorio
      const authResult = await this.authRepository.verifyToken(token);
      
      if (!authResult.user) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Token inválido o expirado'
        };
      }

      return {
        success: true,
        user: authResult.user,
        token: authResult.token,
        message: 'Sesión válida'
      };

    } catch (error) {
      console.error('Error verificando token:', error);
      return {
        success: false,
        user: null,
        token: null,
        message: 'Error al verificar sesión'
      };
    }
  }

  /**
   * Obtener ruta de redirección basada en el rol del usuario
   * @param {User} user - Usuario autenticado
   * @returns {string} Ruta de redirección
   */
  getRedirectRoute(user) {
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'volunteer':
        return '/volunteer/dashboard';
      case 'visitor':
        return '/visitor/dashboard';
      default:
        return '/dashboard';
    }
  }

  /**
   * Generar mensaje de bienvenida personalizado
   * @param {User} user - Usuario autenticado
   * @returns {string} Mensaje de bienvenida
   */
  getWelcomeMessage(user) {
    const timeOfDay = this.getTimeOfDay();
    
    switch (user.role) {
      case 'admin':
        return `🎉 ¡${timeOfDay}, ${user.firstName}! Bienvenido al panel de administración de CASIRA Connect.`;
      case 'volunteer':
        return `🌟 ¡${timeOfDay}, ${user.firstName}! Listo para hacer la diferencia hoy.`;
      case 'visitor':
        return `🤝 ¡${timeOfDay}, ${user.firstName}! Explora las actividades y únete a nuestra comunidad.`;
      default:
        return `👋 ¡${timeOfDay}, ${user.firstName}! Bienvenido a CASIRA Connect.`;
    }
  }

  /**
   * Determinar saludo basado en la hora del día
   * @returns {string} Saludo apropiado
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Buenos días';
    } else if (hour < 18) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  }

  /**
   * Determinar si es una nueva sesión (para mostrar mensajes de bienvenida)
   * @param {User} user - Usuario
   * @param {number} timeThresholdMinutes - Umbral en minutos para considerar nueva sesión
   * @returns {boolean} True si es nueva sesión
   */
  isNewSession(user, timeThresholdMinutes = 5) {
    if (!user.lastLogin) return true;
    
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const diffMinutes = (now - lastLogin) / (1000 * 60);
    
    return diffMinutes > timeThresholdMinutes;
  }
}

export default LoginUser;