// ============= CASIRA Connect - API MEJORADA CON STORAGE AVANZADO =============

import { storageManager } from './storage-manager.js';
import { googleAuth } from './google-auth.js';

// ============= ENHANCED DATA STORE =============
class EnhancedCASIRAAPI {
  constructor() {
    this.storageManager = storageManager;
    this.googleAuth = googleAuth;
    
    // Configurar listeners para sincronización
    this.setupSyncListeners();
    
    console.log('🚀 CASIRA Enhanced API: Inicializada con storage avanzado');
  }

  setupSyncListeners() {
    // Escuchar cambios en el storage para mantener sincronización
    this.storageManager.subscribe((key, value) => {
      console.log(`📡 CASIRA API: Datos actualizados - ${key}:`, Array.isArray(value) ? `${value.length} items` : typeof value);
    });

    // Escuchar cambios de autenticación
    this.googleAuth.addAuthListener((event, userData) => {
      console.log(`🔐 CASIRA API: Evento de autenticación - ${event}:`, userData?.email || 'N/A');
    });
  }

  // ============= USERS API =============
  get usersAPI() {
    return {
      getUserByEmail: async (email) => {
        const users = this.storageManager.get('users') || [];
        return users.find(user => user.email === email);
      },

      getUserById: async (id) => {
        const users = this.storageManager.get('users') || [];
        return users.find(user => user.id == id);
      },

      // Autenticación con Google a través del backend
      authenticateWithGoogle: async (googleUser) => {
        try {
          console.log('🔐 CASIRA API: Autenticando con Google via backend...', googleUser.email);
          
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: googleUser })
          });

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success) {
            console.log('✅ CASIRA API: Autenticación Google exitosa:', result.user.email);
            
            // Actualizar storage local
            this.storageManager.set('currentUser', result.user);
            this.storageManager.set('isAuthenticated', true);
            
            return result.user;
          } else {
            throw new Error(result.message || 'Error en autenticación');
          }
        } catch (error) {
          console.error('❌ CASIRA API: Error en autenticación Google:', error);
          throw error;
        }
      },

      createUser: async (userData) => {
        try {
          const users = this.storageManager.get('users') || [];
          
          // Verificar si el usuario ya existe
          const existingUser = users.find(u => u.email === userData.email);
          if (existingUser) {
            console.log('👤 CASIRA API: Usuario ya existe, actualizando...', userData.email);
            return await this.usersAPI.updateUserProfile(existingUser.id, userData);
          }

          const newUser = {
            id: userData.id || Date.now(),
            ...userData,
            created_at: userData.created_at || new Date().toISOString(),
            status: userData.status || 'active',
            last_login: new Date().toISOString()
          };

          console.log('🆕 CASIRA API: Creando nuevo usuario:', {
            id: newUser.id,
            email: newUser.email,
            provider: newUser.provider,
            role: newUser.role
          });

          // Usar el storage manager para agregar el usuario
          this.storageManager.push('users', newUser);

          // Si es un usuario de Google, asegurar que los datos se persistan
          if (newUser.provider === 'google') {
            console.log('💾 CASIRA API: Persistiendo usuario de Google Auth');
          }

          return newUser;
        } catch (error) {
          console.error('❌ CASIRA API: Error creando usuario:', error);
          throw error;
        }
      },

      updateUserProfile: async (userId, updateData) => {
        try {
          const success = this.storageManager.updateInArray(
            'users',
            user => user.id == userId,
            {
              ...updateData,
              updated_at: new Date().toISOString()
            }
          );

          if (success) {
            const updatedUser = await this.usersAPI.getUserById(userId);
            console.log('✅ CASIRA API: Usuario actualizado:', {
              id: userId,
              email: updatedUser?.email
            });
            return updatedUser;
          } else {
            throw new Error('Usuario no encontrado');
          }
        } catch (error) {
          console.error('❌ CASIRA API: Error actualizando usuario:', error);
          throw error;
        }
      },

      getAllUsers: async () => {
        return this.storageManager.get('users') || [];
      },

      deleteUser: async (userId) => {
        const success = this.storageManager.removeFromArray(
          'users',
          user => user.id == userId
        );
        
        if (success) {
          console.log('🗑️ CASIRA API: Usuario eliminado:', userId);
          return { success: true };
        } else {
          throw new Error('Usuario no encontrado');
        }
      },

      blockUser: async (userId) => {
        return await this.usersAPI.updateUserProfile(userId, { status: 'blocked' });
      },

      unblockUser: async (userId) => {
        return await this.usersAPI.updateUserProfile(userId, { status: 'active' });
      },

      updateUserRole: async (userId, newRole) => {
        return await this.usersAPI.updateUserProfile(userId, { role: newRole });
      },

      // Método específico para manejar autenticación con Google
      authenticateWithGoogle: async () => {
        try {
          console.log('🔐 CASIRA API: Iniciando autenticación con Google...');
          const googleUser = await this.googleAuth.signIn();
          
          // El usuario ya está creado/actualizado en el storage por el GoogleAuthManager
          console.log('✅ CASIRA API: Autenticación Google completada:', googleUser.email);
          return googleUser;
        } catch (error) {
          console.error('❌ CASIRA API: Error en autenticación Google:', error);
          throw error;
        }
      },

      signOutGoogle: async () => {
        try {
          await this.googleAuth.signOut();
          console.log('🚪 CASIRA API: Sesión Google cerrada');
        } catch (error) {
          console.error('❌ CASIRA API: Error cerrando sesión Google:', error);
          throw error;
        }
      },

      getCurrentGoogleUser: () => {
        return this.googleAuth.getCurrentUser();
      },

      isGoogleSignedIn: () => {
        return this.googleAuth.isSignedIn();
      }
    };
  }

  // ============= ACTIVITIES API =============
  get activitiesAPI() {
    return {
      getPublicActivities: async () => {
        const activities = this.storageManager.get('activities') || [];
        return activities.filter(activity => activity.visibility === 'public');
      },

      getFeaturedActivities: async () => {
        const activities = this.storageManager.get('activities') || [];
        return activities.filter(activity => activity.featured && activity.visibility === 'public');
      },

      getActivityById: async (id) => {
        const activities = this.storageManager.get('activities') || [];
        return activities.find(activity => activity.id == id);
      },

      createActivity: async (activityData) => {
        const newActivity = {
          id: Date.now(),
          ...activityData,
          current_volunteers: 0,
          created_at: new Date().toISOString(),
          status: activityData.status || 'active',
          visibility: activityData.visibility || 'public'
        };

        this.storageManager.push('activities', newActivity);
        console.log('📅 CASIRA API: Actividad creada:', newActivity.title);
        return newActivity;
      },

      updateActivity: async (activityId, updateData) => {
        const success = this.storageManager.updateInArray(
          'activities',
          activity => activity.id == activityId,
          {
            ...updateData,
            updated_at: new Date().toISOString()
          }
        );

        if (success) {
          const updatedActivity = await this.activitiesAPI.getActivityById(activityId);
          console.log('✅ CASIRA API: Actividad actualizada:', activityId);
          return updatedActivity;
        } else {
          throw new Error('Actividad no encontrada');
        }
      },

      deleteActivity: async (activityId) => {
        const success = this.storageManager.removeFromArray(
          'activities',
          activity => activity.id == activityId
        );

        if (success) {
          // También eliminar datos relacionados
          this.storageManager.removeFromArray('comments', c => c.activity_id == activityId);
          this.storageManager.removeFromArray('likes', l => l.activity_id == activityId);
          this.storageManager.removeFromArray('volunteers', v => v.activity_id == activityId);
          
          console.log('🗑️ CASIRA API: Actividad eliminada:', activityId);
          return { success: true };
        } else {
          throw new Error('Actividad no encontrada');
        }
      },

      // Sistema de likes
      likeActivity: async (activityId, userId) => {
        const likes = this.storageManager.get('likes') || [];
        const existingLike = likes.find(l => l.activity_id == activityId && l.user_id == userId);

        if (existingLike) {
          // Quitar like
          this.storageManager.removeFromArray(
            'likes',
            l => l.id === existingLike.id
          );
          
          const remainingLikes = (this.storageManager.get('likes') || [])
            .filter(l => l.activity_id == activityId);
            
          return { liked: false, totalLikes: remainingLikes.length };
        } else {
          // Agregar like
          const newLike = {
            id: Date.now(),
            activity_id: activityId,
            user_id: userId,
            created_at: new Date().toISOString()
          };

          this.storageManager.push('likes', newLike);
          
          const totalLikes = (this.storageManager.get('likes') || [])
            .filter(l => l.activity_id == activityId).length;
            
          return { liked: true, totalLikes };
        }
      },

      getActivityLikes: async (activityId) => {
        const likes = this.storageManager.get('likes') || [];
        const users = this.storageManager.get('users') || [];
        
        return likes
          .filter(l => l.activity_id == activityId)
          .map(like => {
            const user = users.find(u => u.id == like.user_id);
            return { 
              ...like, 
              user: user || { first_name: 'Usuario', last_name: 'Desconocido' } 
            };
          });
      },

      hasUserLiked: async (activityId, userId) => {
        if (!userId) return false;
        const likes = this.storageManager.get('likes') || [];
        return likes.some(l => l.activity_id == activityId && l.user_id == userId);
      }
    };
  }

  // ============= VOLUNTEERS API =============
  get volunteersAPI() {
    return {
      registerForActivity: async (userId, activityId, registrationData = {}) => {
        try {
          const volunteers = this.storageManager.get('volunteers') || [];
          
          // Verificar si ya está registrado
          const existingRegistration = volunteers.find(
            v => v.user_id == userId && v.activity_id == activityId
          );

          if (existingRegistration) {
            throw new Error('Ya estás registrado en esta actividad');
          }

          const registration = {
            id: Date.now(),
            user_id: userId,
            activity_id: activityId,
            status: 'pending',
            registration_date: new Date().toISOString(),
            notes: registrationData.notes || '',
            skills_offered: registrationData.skills_offered || []
          };

          this.storageManager.push('volunteers', registration);

          // Crear notificación para admin
          await this.notificationsAPI.createVolunteerNotification(userId, activityId);

          console.log('📝 CASIRA API: Registro de voluntario creado:', {
            userId,
            activityId,
            registrationId: registration.id
          });

          return registration;
        } catch (error) {
          console.error('❌ CASIRA API: Error en registro de voluntario:', error);
          throw error;
        }
      },

      getUserRegistrations: async (userId) => {
        const volunteers = this.storageManager.get('volunteers') || [];
        const activities = this.storageManager.get('activities') || [];
        
        return volunteers
          .filter(v => v.user_id == userId)
          .map(volunteer => {
            const activity = activities.find(a => a.id == volunteer.activity_id);
            return {
              ...volunteer,
              activity: activity || { title: 'Actividad no encontrada' }
            };
          });
      },

      updateRegistrationStatus: async (registrationId, status) => {
        const success = this.storageManager.updateInArray(
          'volunteers',
          v => v.id == registrationId,
          { 
            status,
            updated_at: new Date().toISOString()
          }
        );

        if (success) {
          console.log('✅ CASIRA API: Estado de registro actualizado:', { registrationId, status });
          
          // Si es aprobado, actualizar contador de voluntarios en la actividad
          if (status === 'confirmed') {
            const volunteers = this.storageManager.get('volunteers') || [];
            const registration = volunteers.find(v => v.id == registrationId);
            
            if (registration) {
              this.storageManager.updateInArray(
                'activities',
                a => a.id == registration.activity_id,
                { current_volunteers: (this.storageManager.get('activities') || [])
                    .find(a => a.id == registration.activity_id)?.current_volunteers + 1 || 1 }
              );
            }
          }

          return volunteers.find(v => v.id == registrationId);
        } else {
          throw new Error('Registro no encontrado');
        }
      },

      getAllRegistrations: async () => {
        const volunteers = this.storageManager.get('volunteers') || [];
        const users = this.storageManager.get('users') || [];
        const activities = this.storageManager.get('activities') || [];

        return volunteers.map(volunteer => {
          const user = users.find(u => u.id == volunteer.user_id);
          const activity = activities.find(a => a.id == volunteer.activity_id);
          
          return {
            ...volunteer,
            user: user || { first_name: 'Usuario', last_name: 'Desconocido' },
            activity: activity || { title: 'Actividad no encontrada' }
          };
        });
      }
    };
  }

  // ============= COMMENTS API =============
  get commentsAPI() {
    return {
      addComment: async (activityId, userId, content) => {
        const users = this.storageManager.get('users') || [];
        const user = users.find(u => u.id == userId);
        
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const comment = {
          id: Date.now(),
          activity_id: activityId,
          user_id: userId,
          content: content,
          created_at: new Date().toISOString(),
          likes: 0
        };

        this.storageManager.push('comments', comment);
        
        console.log('💬 CASIRA API: Comentario agregado:', {
          activityId,
          userId,
          commentId: comment.id
        });

        return { ...comment, user };
      },

      getActivityComments: async (activityId) => {
        const comments = this.storageManager.get('comments') || [];
        const users = this.storageManager.get('users') || [];

        return comments
          .filter(c => c.activity_id == activityId)
          .map(comment => {
            const user = users.find(u => u.id == comment.user_id);
            return { 
              ...comment, 
              user: user || { first_name: 'Usuario', last_name: 'Desconocido' } 
            };
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    };
  }

  // ============= NOTIFICATIONS API =============
  get notificationsAPI() {
    return {
      getAdminNotifications: async () => {
        const notifications = this.storageManager.get('notifications') || [];
        return notifications
          .filter(n => n.status === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },

      createVolunteerNotification: async (userId, activityId) => {
        const users = this.storageManager.get('users') || [];
        const activities = this.storageManager.get('activities') || [];
        
        const user = users.find(u => u.id == userId);
        const activity = activities.find(a => a.id == activityId);

        if (user && activity) {
          const notification = {
            id: Date.now(),
            type: 'volunteer_request',
            user_id: userId,
            activity_id: activityId,
            message: `${user.first_name} ${user.last_name} solicita unirse a ${activity.title}`,
            status: 'pending',
            created_at: new Date().toISOString(),
            user_email: user.email,
            user_avatar: user.avatar_url
          };

          this.storageManager.push('notifications', notification);
          
          console.log('🔔 CASIRA API: Notificación creada:', notification.message);
          return notification;
        }
      },

      updateNotificationStatus: async (notificationId, status) => {
        const success = this.storageManager.updateInArray(
          'notifications',
          n => n.id == notificationId,
          { 
            status,
            processed_at: new Date().toISOString()
          }
        );

        if (success) {
          console.log('✅ CASIRA API: Notificación actualizada:', { notificationId, status });
          return true;
        } else {
          throw new Error('Notificación no encontrada');
        }
      },

      approveVolunteerRequest: async (notificationId) => {
        const notifications = this.storageManager.get('notifications') || [];
        const notification = notifications.find(n => n.id == notificationId);
        
        if (notification && notification.type === 'volunteer_request') {
          // Actualizar estado del voluntario
          await this.volunteersAPI.updateRegistrationStatus(
            notification.user_id, 
            'confirmed'
          );
          
          // Marcar notificación como procesada
          await this.notificationsAPI.updateNotificationStatus(notificationId, 'processed');
          
          return { success: true };
        }
        
        throw new Error('Notificación no válida');
      },

      rejectVolunteerRequest: async (notificationId) => {
        const notifications = this.storageManager.get('notifications') || [];
        const notification = notifications.find(n => n.id == notificationId);
        
        if (notification && notification.type === 'volunteer_request') {
          // Actualizar estado del voluntario
          await this.volunteersAPI.updateRegistrationStatus(
            notification.user_id, 
            'rejected'
          );
          
          // Marcar notificación como procesada
          await this.notificationsAPI.updateNotificationStatus(notificationId, 'processed');
          
          return { success: true };
        }
        
        throw new Error('Notificación no válida');
      }
    };
  }

  // ============= STATS API =============
  get statsAPI() {
    return {
      getStats: async () => {
        const users = this.storageManager.get('users') || [];
        const activities = this.storageManager.get('activities') || [];
        const volunteers = this.storageManager.get('volunteers') || [];
        const comments = this.storageManager.get('comments') || [];
        const likes = this.storageManager.get('likes') || [];
        const notifications = this.storageManager.get('notifications') || [];

        return {
          totalUsers: users.length,
          totalActivities: activities.length,
          totalVolunteers: volunteers.filter(v => v.status === 'confirmed').length,
          totalComments: comments.length,
          totalLikes: likes.length,
          totalNotifications: notifications.filter(n => n.status === 'pending').length,
          googleUsers: users.filter(u => u.provider === 'google').length,
          internalUsers: users.filter(u => u.provider !== 'google').length
        };
      }
    };
  }

  // ============= UTILIDADES =============
  
  getStorageInfo() {
    return this.storageManager.getStorageStats();
  }

  getAuthInfo() {
    return this.googleAuth.getAuthStats();
  }

  async exportData() {
    return this.storageManager.exportData();
  }

  async importData(data) {
    return this.storageManager.importData(data);
  }

  forceRefresh() {
    this.storageManager.forceReload();
  }

  clearAllData() {
    this.storageManager.clearAll();
  }
}

// Crear instancia global de la API mejorada
export const enhancedAPI = new EnhancedCASIRAAPI();

// Exports específicos para compatibilidad
export const usersAPI = enhancedAPI.usersAPI;
export const activitiesAPI = enhancedAPI.activitiesAPI;
export const volunteersAPI = enhancedAPI.volunteersAPI;
export const commentsAPI = enhancedAPI.commentsAPI;
export const notificationsAPI = enhancedAPI.notificationsAPI;
export const statsAPI = enhancedAPI.statsAPI;

// Export default
export default enhancedAPI;