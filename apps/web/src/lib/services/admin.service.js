import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class AdminService {

  // ============= USUARIOS =============
  
  async getAllUsers() {
    try {
      console.log('📊 AdminService: Obteniendo todos los usuarios (Supabase + Google)...');
      
      // 1. Obtener usuarios de Supabase
      const { data: supabaseUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ AdminService: Error obteniendo usuarios de Supabase:', error);
      }

      // 2. Obtener usuarios de Google desde localStorage y storageManager
      let googleUsers = [];
      try {
        // Primero intentar desde localStorage directo
        const googleUsersData = JSON.parse(localStorage.getItem('google_users') || '[]');

        // Luego desde storageManager (usuarios autenticados con Google)
        const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
        const casiraUsers = (casiraData.users || []).filter(user => user.provider === 'google');

        // Combinar ambos, eliminando duplicados por email
        const allGoogleUsers = [...googleUsersData, ...casiraUsers];
        const seenGoogleEmails = new Set();

        googleUsers = allGoogleUsers
          .filter(user => {
            if (!seenGoogleEmails.has(user.email)) {
              seenGoogleEmails.add(user.email);
              return true;
            }
            return false;
          })
          .map(user => ({
            ...user,
            source: 'google',
            role: user.role || 'visitor',
            status: user.status || 'active',
            created_at: user.created_at || new Date().toISOString(),
            provider: 'google',
            // Asegurar que admin@casira.org tenga rol de admin
            ...(user.email === 'admin@casira.org' ? { role: 'admin' } : {})
          }));

        console.log(`📱 AdminService: ${googleUsers.length} usuarios de Google encontrados`);
        console.log('🔍 AdminService: Usuarios Google por rol:',
          googleUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {})
        );
      } catch (error) {
        console.warn('⚠️ AdminService: Error obteniendo usuarios de Google:', error);
      }

      // 3. Obtener usuarios del sistema local (CASIRA)
      let localUsers = [];
      try {
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        localUsers = (localData.users || []).map(user => ({
          ...user,
          source: 'local',
          provider: 'casira',
          created_at: user.created_at || new Date().toISOString()
        }));
        console.log(`💾 AdminService: ${localUsers.length} usuarios locales encontrados`);
      } catch (error) {
        console.warn('⚠️ AdminService: Error obteniendo usuarios locales:', error);
      }

      // 4. Combinar todos los usuarios eliminando duplicados y aplicando actualizaciones locales
      const allUsers = [];
      const seenEmails = new Set();
      const seenIds = new Set();

      // Crear mapa de cambios locales para preservar modificaciones manuales
      const localUpdatesMap = new Map();

      // Mapear actualizaciones de storageManager
      localUsers.forEach(user => {
        if (user.updated_at) {
          localUpdatesMap.set(user.email, user);
          localUpdatesMap.set(user.id, user);
        }
      });

      // También revisar actualizaciones en Google users localStorage
      try {
        const googleUsersLocal = JSON.parse(localStorage.getItem('google_users') || '[]');
        googleUsersLocal.forEach(user => {
          if (user.updated_at) {
            localUpdatesMap.set(user.email, user);
            localUpdatesMap.set(user.id, user);
          }
        });
      } catch (error) {
        console.warn('⚠️ AdminService: Error leyendo actualizaciones de Google users:', error);
      }

      // También revisar actualizaciones en CASIRA data
      try {
        const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
        const casiraUsers = casiraData.users || [];
        casiraUsers.forEach(user => {
          if (user.updated_at) {
            localUpdatesMap.set(user.email, user);
            localUpdatesMap.set(user.id, user);
          }
        });
      } catch (error) {
        console.warn('⚠️ AdminService: Error leyendo actualizaciones de CASIRA data:', error);
      }

      // Prioridad: Supabase > Local > Google, pero con actualizaciones locales aplicadas
      [...(supabaseUsers || []), ...localUsers, ...googleUsers].forEach(user => {
        const email = user.email;
        const id = user.id;

        if (!seenEmails.has(email) && !seenIds.has(id)) {
          seenEmails.add(email);
          seenIds.add(id);

          // Verificar si hay una actualización local para este usuario
          const localUpdate = localUpdatesMap.get(email) || localUpdatesMap.get(id);

          const finalUser = {
            ...user,
            // Aplicar actualización local si existe
            ...(localUpdate ? {
              role: localUpdate.role,
              updated_at: localUpdate.updated_at,
              source: user.source || 'local_updated'
            } : {}),
            // Asegurar campos requeridos
            id: user.id || user.email.replace('@', '_at_').replace('.', '_'),
            full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            first_name: user.first_name || user.email.split('@')[0],
            last_name: user.last_name || '',
            role: localUpdate?.role || user.role || 'visitor',
            status: user.status || 'active'
          };

          allUsers.push(finalUser);

          if (localUpdate) {
            console.log(`🔄 AdminService: Aplicando actualización local para ${email}:`, {
              oldRole: user.role,
              newRole: localUpdate.role,
              updated_at: localUpdate.updated_at
            });
          }
        }
      });

      // Ordenar por fecha de creación (más recientes primero)
      allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`✅ AdminService: ${allUsers.length} usuarios totales obtenidos`);
      console.log('📊 Fuentes:', {
        supabase: supabaseUsers?.length || 0,
        local: localUsers.length,
        google: googleUsers.length,
        total: allUsers.length
      });

      return allUsers;
    } catch (error) {
      console.error('❌ AdminService: Error en getAllUsers:', error);
      
      // Fallback: retornar usuarios locales si hay error
      try {
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        return localData.users || [];
      } catch (fallbackError) {
        console.error('❌ AdminService: Error en fallback:', fallbackError);
        return [];
      }
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      console.log(`🔄 AdminService: Actualizando rol de usuario ${userId} a ${newRole}`);

      // First get all users to find the target user across all sources
      const allUsers = await this.getAllUsers();
      const targetUser = allUsers.find(u =>
        u.id === userId ||
        u.email === userId ||
        String(u.id) === String(userId)
      );

      if (!targetUser) {
        console.error(`❌ AdminService: Usuario ${userId} no encontrado en ninguna fuente`);
        throw new Error('Usuario no encontrado en ninguna fuente de datos');
      }

      console.log(`🎯 AdminService: Usuario encontrado:`, {
        id: targetUser.id,
        email: targetUser.email,
        currentRole: targetUser.role,
        source: targetUser.source
      });

      // 1. Try to update in Supabase if user has a valid UUID and exists there
      if (targetUser.source === 'supabase' || targetUser.source === 'both') {
        try {
          // Try with both the ID and email to handle UUID issues
          let supabaseUpdate;

          // First try with ID
          const { data: dataById, error: errorById } = await supabase
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', targetUser.id)
            .select();

          if (!errorById && dataById && dataById.length > 0) {
            console.log('✅ AdminService: Rol actualizado en Supabase (por ID)');
            return dataById[0];
          }

          // If ID failed, try with email
          const { data: dataByEmail, error: errorByEmail } = await supabase
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('email', targetUser.email)
            .select();

          if (!errorByEmail && dataByEmail && dataByEmail.length > 0) {
            console.log('✅ AdminService: Rol actualizado en Supabase (por email)');
            return dataByEmail[0];
          }

          console.warn('⚠️ AdminService: No se pudo actualizar en Supabase:', errorById, errorByEmail);
        } catch (supabaseError) {
          console.warn('⚠️ AdminService: Error actualizando en Supabase:', supabaseError);
        }
      }

      // 2. Update in local storage
      try {
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        const users = localData.users || [];

        const userIndex = users.findIndex(u =>
          u.id === targetUser.id ||
          u.email === targetUser.email ||
          String(u.id) === String(targetUser.id)
        );

        if (userIndex !== -1) {
          users[userIndex].role = newRole;
          users[userIndex].updated_at = new Date().toISOString();

          storageManager.set('users', users);
          console.log('✅ AdminService: Rol actualizado en almacenamiento local');
          return users[userIndex];
        }
      } catch (localError) {
        console.warn('⚠️ AdminService: Error actualizando localmente:', localError);
      }

      // 3. Update in Google users localStorage
      try {
        const googleUsers = JSON.parse(localStorage.getItem('google_users') || '[]');
        const googleUserIndex = googleUsers.findIndex(u =>
          u.id === targetUser.id ||
          u.email === targetUser.email ||
          String(u.id) === String(targetUser.id)
        );

        if (googleUserIndex !== -1) {
          googleUsers[googleUserIndex].role = newRole;
          googleUsers[googleUserIndex].updated_at = new Date().toISOString();

          localStorage.setItem('google_users', JSON.stringify(googleUsers));
          console.log('✅ AdminService: Rol actualizado en usuarios de Google');
          return googleUsers[googleUserIndex];
        }
      } catch (googleError) {
        console.warn('⚠️ AdminService: Error actualizando usuario de Google:', googleError);
      }

      // 4. Update in CASIRA data if exists
      try {
        const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
        const casiraUsers = casiraData.users || [];

        const casiraUserIndex = casiraUsers.findIndex(u =>
          u.id === targetUser.id ||
          u.email === targetUser.email ||
          String(u.id) === String(targetUser.id)
        );

        if (casiraUserIndex !== -1) {
          casiraUsers[casiraUserIndex].role = newRole;
          casiraUsers[casiraUserIndex].updated_at = new Date().toISOString();

          casiraData.users = casiraUsers;
          localStorage.setItem('casira-data-v2', JSON.stringify(casiraData));
          console.log('✅ AdminService: Rol actualizado en datos CASIRA');
          return casiraUsers[casiraUserIndex];
        }
      } catch (casiraError) {
        console.warn('⚠️ AdminService: Error actualizando en datos CASIRA:', casiraError);
      }

      // 5. If user is from Google but not updated yet, force update in all possible sources
      if (targetUser.source === 'google' || targetUser.auth_provider === 'google') {
        console.log('🔄 AdminService: Forzando actualización para usuario de Google en todas las fuentes');

        const updatedUser = {
          ...targetUser,
          role: newRole,
          updated_at: new Date().toISOString()
        };

        // Force update in all Google-related storage
        try {
          // Update in google_users
          const googleUsers = JSON.parse(localStorage.getItem('google_users') || '[]');
          const updatedGoogleUsers = googleUsers.map(u =>
            u.id === targetUser.id || u.email === targetUser.email ? updatedUser : u
          );
          localStorage.setItem('google_users', JSON.stringify(updatedGoogleUsers));

          // Update in casira-data-v2
          const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
          casiraData.users = casiraData.users || [];

          // Add or update user in CASIRA data
          const existingIndex = casiraData.users.findIndex(u =>
            u.id === targetUser.id || u.email === targetUser.email
          );

          if (existingIndex !== -1) {
            casiraData.users[existingIndex] = updatedUser;
          } else {
            casiraData.users.push(updatedUser);
          }

          localStorage.setItem('casira-data-v2', JSON.stringify(casiraData));

          // Update in storageManager
          const { default: storageManager } = await import('../storage-manager.js');
          const localData = storageManager.exportData();
          localData.users = localData.users || [];

          const localUserIndex = localData.users.findIndex(u =>
            u.id === targetUser.id || u.email === targetUser.email
          );

          if (localUserIndex !== -1) {
            localData.users[localUserIndex] = updatedUser;
          } else {
            localData.users.push(updatedUser);
          }

          storageManager.set('users', localData.users);

          console.log('✅ AdminService: Usuario de Google actualizado forzadamente en todas las fuentes');
          return updatedUser;
        } catch (error) {
          console.warn('⚠️ AdminService: Error en actualización forzada:', error);
        }
      }

      throw new Error('No se pudo actualizar el rol en ninguna fuente de datos');
    } catch (error) {
      console.error('❌ AdminService: Error en updateUserRole:', error);
      throw error;
    }
  }

  async blockUser(userId) {
    try {
      console.log(`🚫 AdminService: Bloqueando usuario ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ 
          status: 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ AdminService: Error bloqueando usuario:', error);
        throw error;
      }

      console.log('✅ AdminService: Usuario bloqueado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ AdminService: Error en blockUser:', error);
      throw error;
    }
  }

  async unblockUser(userId) {
    try {
      console.log(`✅ AdminService: Desbloqueando usuario ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ AdminService: Error desbloqueando usuario:', error);
        throw error;
      }

      console.log('✅ AdminService: Usuario desbloqueado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ AdminService: Error en unblockUser:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      console.log(`🗑️ AdminService: Eliminando usuario ${userId}`);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ AdminService: Error eliminando usuario:', error);
        throw error;
      }

      console.log('✅ AdminService: Usuario eliminado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ AdminService: Error en deleteUser:', error);
      throw error;
    }
  }

  // ============= SOLICITUDES/REGISTRACIONES =============

  async getAllRegistrations() {
    try {
      console.log('📋 AdminService: Obteniendo todas las registraciones (Supabase + Local)...');
      
      // Usar el nuevo manejador de solicitudes
      const { getPendingVolunteerRequests } = await import('../volunteer-request-handler.js');
      const pendingRequests = await getPendingVolunteerRequests();
      
      // También obtener solicitudes aprobadas/rechazadas de Supabase
      let processedRequests = [];
      try {
        const { data, error } = await supabase
          .from('volunteer_requests')
          .select(`
            *,
            user:users(id, email, first_name, last_name, full_name, avatar_url),
            activity:activities(id, title, description, location)
          `)
          .neq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          processedRequests = data;
        }
      } catch (error) {
        console.warn('⚠️ AdminService: Error obteniendo solicitudes procesadas:', error);
      }

      const allRequests = [...pendingRequests, ...processedRequests];
      
      console.log(`✅ AdminService: ${allRequests.length} registraciones obtenidas total`);
      console.log(`📊 Pendientes: ${pendingRequests.length}, Procesadas: ${processedRequests.length}`);
      
      return allRequests;
    } catch (error) {
      console.warn('⚠️ AdminService: Error en getAllRegistrations, retornando array vacío:', error);
      return [];
    }
  }

  async approveRegistration(registrationId) {
    try {
      console.log(`✅ AdminService: Aprobando registración ${registrationId}`);
      
      // Detectar si es una solicitud local (ID empieza con "local_")
      const isLocalRequest = registrationId && registrationId.toString().startsWith('local_');
      
      if (isLocalRequest) {
        console.log('🏠 AdminService: Aprobando solicitud local en localStorage');
        
        // Manejar solicitud local
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        const volunteers = localData.volunteers || [];
        
        // Debug: Mostrar información para aprobación
        console.log('🔍 AdminService: Debug aprobación:', {
          registrationId,
          totalVolunteers: volunteers.length,
          volunteers: volunteers.map(v => ({ id: v.id, status: v.status, user_email: v.user_email }))
        });

        // Encontrar y actualizar la solicitud (comparación estricta)
        const requestIndex = volunteers.findIndex(v => String(v.id) === String(registrationId));
        console.log('📍 AdminService: Resultado búsqueda aprobación:', { requestIndex, found: requestIndex !== -1 });
        
        if (requestIndex !== -1) {
          const request = volunteers[requestIndex];
          volunteers[requestIndex].status = 'approved';
          volunteers[requestIndex].reviewed_at = new Date().toISOString();
          
          // Guardar de vuelta
          storageManager.set('volunteers', volunteers);
          
          // Crear notificación para el usuario
          try {
            const localData = storageManager.exportData();
            localData.notifications = localData.notifications || [];
            
            const notification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: request.user_id,
              type: 'volunteer_request_approved',
              title: '¡Solicitud Aprobada!',
              message: `Tu solicitud para "${request.activity_title}" ha sido aprobada. ¡Bienvenido al equipo!`,
              status: 'unread',
              created_at: new Date().toISOString(),
              data: {
                request_id: request.id,
                activity_id: request.activity_id,
                activity_title: request.activity_title
              }
            };
            
            localData.notifications.push(notification);
            storageManager.set('notifications', localData.notifications);
            
            console.log('✅ AdminService: Notificación de aprobación creada para usuario');
          } catch (notifError) {
            console.warn('⚠️ AdminService: Error creando notificación de aprobación:', notifError);
          }
          
          console.log('✅ AdminService: Solicitud local aprobada exitosamente');
          return volunteers[requestIndex];
        } else {
          throw new Error('Solicitud local no encontrada');
        }
      } else {
        // Manejar solicitud de Supabase (UUID válido)
        console.log('☁️ AdminService: Aprobando solicitud de Supabase');
        
        const { data, error } = await supabase
          .from('volunteer_requests')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', registrationId)
          .select();

        if (error) {
          console.error('❌ AdminService: Error aprobando registración:', error);
          throw error;
        }

        console.log('✅ AdminService: Registración aprobada exitosamente');
        return data?.[0];
      }
    } catch (error) {
      console.error('❌ AdminService: Error en approveRegistration:', error);
      throw error;
    }
  }

  async rejectRegistration(registrationId) {
    try {
      console.log(`❌ AdminService: Rechazando registración ${registrationId}`);
      
      // Detectar si es una solicitud local (ID empieza con "local_")
      const isLocalRequest = registrationId && registrationId.toString().startsWith('local_');
      
      if (isLocalRequest) {
        console.log('🏠 AdminService: Rechazando solicitud local en localStorage');
        
        // Manejar solicitud local
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        const volunteers = localData.volunteers || [];
        
        // Encontrar y actualizar la solicitud (comparación estricta)
        const requestIndex = volunteers.findIndex(v => String(v.id) === String(registrationId));
        
        if (requestIndex !== -1) {
          const request = volunteers[requestIndex];
          volunteers[requestIndex].status = 'rejected';
          volunteers[requestIndex].reviewed_at = new Date().toISOString();
          
          // Guardar de vuelta
          storageManager.set('volunteers', volunteers);
          
          // Crear notificación para el usuario
          try {
            const localData = storageManager.exportData();
            localData.notifications = localData.notifications || [];
            
            const notification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: request.user_id,
              type: 'volunteer_request_rejected',
              title: 'Solicitud No Aprobada',
              message: `Tu solicitud para "${request.activity_title}" no fue aprobada en esta ocasión. ¡Sigue participando!`,
              status: 'unread',
              created_at: new Date().toISOString(),
              data: {
                request_id: request.id,
                activity_id: request.activity_id,
                activity_title: request.activity_title
              }
            };
            
            localData.notifications.push(notification);
            storageManager.set('notifications', localData.notifications);
            
            console.log('✅ AdminService: Notificación de rechazo creada para usuario');
          } catch (notifError) {
            console.warn('⚠️ AdminService: Error creando notificación de rechazo:', notifError);
          }
          
          console.log('✅ AdminService: Solicitud local rechazada exitosamente');
          return volunteers[requestIndex];
        } else {
          throw new Error('Solicitud local no encontrada');
        }
      } else {
        // Manejar solicitud de Supabase (UUID válido)
        console.log('☁️ AdminService: Rechazando solicitud de Supabase');
        
        const { data, error } = await supabase
          .from('volunteer_requests')
          .update({ 
            status: 'rejected',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', registrationId)
          .select();

        if (error) {
          console.error('❌ AdminService: Error rechazando registración:', error);
          throw error;
        }

        console.log('✅ AdminService: Registración rechazada exitosamente');
        return data?.[0];
      }
    } catch (error) {
      console.error('❌ AdminService: Error en rejectRegistration:', error);
      throw error;
    }
  }

  // ============= NOTIFICACIONES =============

  async getAllNotifications() {
    try {
      console.log('🔔 AdminService: Obteniendo todas las notificaciones...');

      // First try to get notifications without relations to check if table exists
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ AdminService: Tabla notifications no disponible, retornando array vacío:', error);
        return [];
      }

      console.log(`✅ AdminService: ${notifications?.length || 0} notificaciones obtenidas`);
      return notifications || [];
    } catch (error) {
      console.warn('⚠️ AdminService: Error en getAllNotifications, retornando array vacío:', error);
      return [];
    }
  }

  async getNotificationStats() {
    try {
      // Try to query notifications table safely
      const { data, error, count } = await supabase
        .from('notifications')
        .select('id, read_at', { count: 'exact' });

      if (error) {
        console.warn('⚠️ AdminService: Notifications table not available:', error);
        return { count: 0, data: [] };
      }

      return { count: count || 0, data: data || [] };
    } catch (error) {
      console.warn('⚠️ AdminService: Error getting notification stats:', error);
      return { count: 0, data: [] };
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      console.log(`👁️ AdminService: Marcando notificación ${notificationId} como leída`);
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('❌ AdminService: Error marcando notificación como leída:', error);
        throw error;
      }

      console.log('✅ AdminService: Notificación marcada como leída');
      return data;
    } catch (error) {
      console.error('❌ AdminService: Error en markNotificationAsRead:', error);
      throw error;
    }
  }

  // ============= ESTADÍSTICAS =============

  async getAdminStats() {
    try {
      console.log('📊 AdminService: Obteniendo estadísticas del admin...');
      
      // Get stats with error handling for each table
      const [usersResult, activitiesResult, registrationsResult, notificationsResult] = await Promise.allSettled([
        supabase.from('users').select('id, role, status', { count: 'exact' }),
        supabase.from('activities').select('id, status', { count: 'exact' }),
        supabase.from('volunteer_requests').select('id, status', { count: 'exact' }),
        // Use a safer query for notifications that handles missing table/columns
        this.getNotificationStats()
      ]);

      const stats = {
        users: {
          total: usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0,
          by_role: {
            admin: usersResult.status === 'fulfilled' ? (usersResult.value.data?.filter(u => u.role === 'admin').length || 0) : 0,
            volunteer: usersResult.status === 'fulfilled' ? (usersResult.value.data?.filter(u => u.role === 'volunteer').length || 0) : 0,
            visitor: usersResult.status === 'fulfilled' ? (usersResult.value.data?.filter(u => u.role === 'visitor').length || 0) : 0
          },
          by_status: {
            active: usersResult.status === 'fulfilled' ? (usersResult.value.data?.filter(u => u.status === 'active').length || 0) : 0,
            blocked: usersResult.status === 'fulfilled' ? (usersResult.value.data?.filter(u => u.status === 'blocked').length || 0) : 0
          }
        },
        activities: {
          total: activitiesResult.status === 'fulfilled' ? (activitiesResult.value.count || 0) : 0,
          active: activitiesResult.status === 'fulfilled' ? (activitiesResult.value.data?.filter(a => a.status === 'active').length || 0) : 0
        },
        registrations: {
          total: registrationsResult.status === 'fulfilled' ? (registrationsResult.value.count || 0) : 0,
          pending: registrationsResult.status === 'fulfilled' ? (registrationsResult.value.data?.filter(r => r.status === 'pending').length || 0) : 0,
          approved: registrationsResult.status === 'fulfilled' ? (registrationsResult.value.data?.filter(r => r.status === 'approved').length || 0) : 0
        },
        notifications: {
          total: notificationsResult.status === 'fulfilled' ? (notificationsResult.value.count || 0) : 0,
          unread: notificationsResult.status === 'fulfilled' ? (notificationsResult.value.data?.filter(n => !n.read_at).length || 0) : 0
        }
      };

      console.log('✅ AdminService: Estadísticas obtenidas:', stats);
      return stats;
    } catch (error) {
      console.warn('⚠️ AdminService: Error en getAdminStats, retornando estadísticas vacías:', error);
      return {
        users: { total: 0, by_role: { admin: 0, volunteer: 0, visitor: 0 }, by_status: { active: 0, blocked: 0 } },
        activities: { total: 0, active: 0 },
        registrations: { total: 0, pending: 0, approved: 0 },
        notifications: { total: 0, unread: 0 }
      };
    }
  }
  // ============= SOLICITUDES DE USUARIO =============

  async getUserVolunteerRequests(userId) {
    try {
      console.log(`🔍 AdminService: Obteniendo solicitudes del usuario desde Supabase: ${userId}`);
      
      const userRequests = [];
      
      // Buscar en Supabase - método simplificado y directo
      try {
        let targetUserId = userId;
        
        // Si el userId es email, obtener el UUID correspondiente
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userId)) {
          console.log('📧 Buscando usuario por email:', userId);
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', userId)
            .single();
          
          if (!userError && userData) {
            targetUserId = userData.id;
            console.log('✅ Usuario encontrado, UUID:', targetUserId);
          } else {
            console.log('❌ Usuario no encontrado por email:', userId);
            return []; // Si no existe el usuario, no hay solicitudes
          }
        }
        
        // Ahora buscar las solicitudes con el UUID
        console.log('🔍 Buscando solicitudes para UUID:', targetUserId);
        
        const { data, error } = await supabase
          .from('volunteer_requests')
          .select(`
            *,
            activity:activities!volunteer_requests_activity_id_fkey(id, title, description, location),
            user:users!volunteer_requests_user_id_fkey(id, email, first_name, last_name, full_name, avatar_url)
          `)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error en consulta Supabase:', error);
        } else {
          userRequests.push(...(data || []));
          console.log(`✅ AdminService: ${data?.length || 0} solicitudes encontradas`);
        }
        
      } catch (error) {
        console.error('❌ AdminService: Error buscando solicitudes en Supabase:', error);
      }
      
      console.log(`📊 AdminService: ${userRequests.length} solicitudes totales encontradas para usuario`);
      return userRequests;
      
    } catch (error) {
      console.error('❌ AdminService: Error obteniendo solicitudes del usuario:', error);
      return [];
    }
  }

}

// Crear instancia singleton
const adminService = new AdminService();

export default adminService;
export { AdminService };