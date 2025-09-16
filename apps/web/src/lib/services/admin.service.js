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

      // PRIORIDAD ABSOLUTA: SUPABASE es la fuente de verdad, localStorage es solo cache
      console.log(`☁️ AdminService: Supabase is the PRIMARY SOURCE - localStorage is cache only`);

      // 1. SUPABASE USERS FIRST (Primary source of truth)
      (supabaseUsers || []).forEach(user => {
        const email = user.email;
        const id = user.id;

        if (!seenEmails.has(email) && !seenIds.has(id)) {
          seenEmails.add(email);
          seenIds.add(id);

          const finalUser = {
            ...user,
            source: 'supabase',
            // Asegurar campos requeridos
            id: user.id,
            full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            first_name: user.first_name || user.email.split('@')[0],
            last_name: user.last_name || '',
            role: user.role || 'visitor', // ALWAYS use Supabase role
            status: user.status || 'active'
          };

          allUsers.push(finalUser);
          console.log(`✅ AdminService: Added Supabase user: ${email} (role: ${finalUser.role})`);
        }
      });

      // 2. Local and Google users ONLY if not already in Supabase
      [...localUsers, ...googleUsers].forEach(user => {
        const email = user.email;
        const id = user.id || user.email;

        if (!seenEmails.has(email) && !seenIds.has(id)) {
          seenEmails.add(email);
          seenIds.add(id);

          const finalUser = {
            ...user,
            source: user.source || 'local',
            id: id,
            role: user.role || 'visitor',
            status: user.status || 'active'
          };

          allUsers.push(finalUser);
          console.log(`✅ AdminService: Added ${user.source || 'local'} user: ${email} (role: ${finalUser.role})`);
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

  async updateUserRole(userId, newRole, adminMessage = null, forceImmediate = false) {
    try {
      console.log(`🔄 AdminService: Updating user role ${userId} to ${newRole} (forceImmediate: ${forceImmediate})`);

      // STEP 0: VERIFICAR QUE QUIEN HACE EL CAMBIO SEA ADMINISTRADOR
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: adminData, error: adminError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', currentUser.email)
          .single();

        if (adminError || !adminData || adminData.role !== 'admin') {
          console.error('❌ AdminService: Usuario no es administrador o no autorizado');
          throw new Error('Solo los administradores pueden cambiar roles de usuario');
        }

        console.log(`✅ AdminService: Cambio autorizado por administrador: ${adminData.email}`);
      } else {
        // Fallback: verificar localStorage para usuarios de demo
        const savedUser = localStorage.getItem('casira-current-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData.role !== 'admin') {
            console.error('❌ AdminService: Usuario no es administrador (localStorage)');
            throw new Error('Solo los administradores pueden cambiar roles de usuario');
          }
          console.log(`✅ AdminService: Cambio autorizado por administrador local: ${userData.email}`);
        } else {
          console.error('❌ AdminService: No se pudo verificar usuario administrador');
          throw new Error('Usuario no autenticado o sin permisos de administrador');
        }
      }

      // STEP 1: Find user by ID or email - use the same approach as supabase-api.js
      let targetUserId = userId;
      let targetUserEmail = null;

      // Store old role for notification
      let oldRole = 'visitor';

      // If userId looks like an email, try to find the actual UUID
      if (userId.includes('@')) {
        targetUserEmail = userId;
        console.log(`📧 AdminService: Searching for user by email: ${targetUserEmail}`);

        const { data: foundUser, error: findError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', targetUserEmail)
          .single();

        if (!findError && foundUser) {
          targetUserId = foundUser.id;
          oldRole = foundUser.role || 'visitor';
          console.log(`✅ AdminService: Found user by email, ID: ${targetUserId}, current role: ${oldRole}`);
        } else {
          console.log(`❌ AdminService: User not found by email: ${targetUserEmail}`);
          throw new Error(`Usuario con email ${targetUserEmail} no encontrado en Supabase`);
        }
      } else {
        // Verify that the ID exists in Supabase
        const { data: existingUser, error: verifyError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', targetUserId)
          .single();

        if (!verifyError && existingUser) {
          targetUserEmail = existingUser.email;
          oldRole = existingUser.role || 'visitor';
          console.log(`✅ AdminService: User verified in Supabase: ${targetUserId}, current role: ${oldRole}`);
        } else {
          console.log(`❌ AdminService: User ID not found in Supabase: ${targetUserId}`);
          throw new Error(`Usuario con ID ${targetUserId} no encontrado en Supabase`);
        }
      }

      // STEP 1.5: Si no es cambio forzado, crear notificación pendiente primero
      if (!forceImmediate && oldRole !== newRole) {
        console.log(`📬 AdminService: Creando notificación pendiente para confirmación del usuario`);

        try {
          // Obtener información del admin actual
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) {
            console.warn('⚠️ No hay usuario autenticado, continuando con cambio directo');
          } else {
            // Buscar admin en tabla users
            const { data: adminData } = await supabase
              .from('users')
              .select('id, email, role, full_name')
              .eq('email', currentUser.email)
              .single();

            if (adminData && adminData.role === 'admin') {
              console.log(`👑 Admin encontrado: ${adminData.full_name || adminData.email}`);

              // Crear cambio pendiente en lugar de cambio directo
              const pendingChangeService = await import('./pending-role-change.service.js');
              const pendingChange = await pendingChangeService.default.createPendingRoleChange(
                targetUserId,
                adminData.id,
                oldRole,
                newRole,
                adminMessage || `Cambio de rol de ${oldRole} a ${newRole}`
              );

              console.log('✅ AdminService: Cambio pendiente creado, esperando confirmación del usuario');

              return {
                success: true,
                pending: true,
                pendingChangeId: pendingChange.id,
                message: 'Cambio de rol enviado al usuario para confirmación',
                targetUserEmail: targetUserEmail,
                oldRole: oldRole,
                newRole: newRole
              };
            }
          }
        } catch (pendingError) {
          console.warn('⚠️ Error creando cambio pendiente, procediendo con cambio directo:', pendingError);
        }
      }

      // STEP 2: Continuar con cambio directo (legacy o cuando forceImmediate = true)
      console.log(`⚡ AdminService: Procediendo con cambio directo de rol`);

      // Check if role is actually changing
      if (oldRole === newRole) {
        console.log(`ℹ️ AdminService: User already has role ${newRole}, but continuing for UI consistency`);

        // Still return the user data and sync local data for consistency
        const { data: currentUserData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (!error && currentUserData) {
          await this._syncLocalData(targetUserEmail, newRole);
          return currentUserData;
        }
      }

      // STEP 2: MANDATORY Supabase update - NO FALLBACKS
      console.log(`🔄 AdminService: EXECUTING MANDATORY Supabase update...`);
      console.log(`☁️ AdminService: Supabase MUST be the source of truth - no localStorage fallbacks`);

      const { supabaseUsersAPI } = await import('../supabase-api.js');
      const updatedUser = await supabaseUsersAPI.updateUserRole(targetUserId, newRole);

      if (!updatedUser) {
        throw new Error('Supabase update failed - no fallback allowed. Database must be updated.');
      }

      console.log(`✅ AdminService: User role updated successfully in SUPABASE DATABASE`);
      console.log(`📝 AdminService: Updated user from database:`, updatedUser);

      // Create notification for role change only if role actually changed
      if (oldRole !== newRole) {
        console.log(`🔔 AdminService: Creating notification for role change: ${oldRole} → ${newRole}`);
        await this._createRoleChangeNotification(updatedUser.id, targetUserEmail, oldRole, newRole);

        // ENVIAR NOTIFICACIÓN CON MÚLTIPLES MÉTODOS PARA GARANTIZAR ENTREGA
        console.log(`🚀 AdminService: Enviando notificación de cambio de rol`);
        console.log(`📧 AdminService: Email del usuario afectado: "${targetUserEmail}"`);
        console.log(`🔄 AdminService: Cambio de rol: "${oldRole}" → "${newRole}"`);

        // Obtener email del administrador actual
        let adminEmail = 'Administrador';
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            adminEmail = currentUser.email;
          } else {
            const savedUser = localStorage.getItem('casira-current-user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              adminEmail = userData.email;
            }
          }
        } catch (error) {
          console.warn('⚠️ No se pudo obtener email del admin:', error);
        }

        let notificationSent = false;

        // MÉTODO 1: Intentar broadcast con Supabase Realtime
        try {
          const broadcastService = await import('./broadcast-role-change.service.js');
          const broadcastSent = await broadcastService.default.sendRoleChangeNotification(
            targetUserEmail,
            oldRole,
            newRole,
            adminEmail
          );

          if (broadcastSent) {
            console.log(`✅ AdminService: Método 1 (Broadcast) - EXITOSO`);
            notificationSent = true;
          }
        } catch (broadcastError) {
          console.warn(`⚠️ AdminService: Método 1 (Broadcast) - FALLÓ:`, broadcastError);
        }

        // MÉTODO 2: Sistema simple con localStorage (SIEMPRE ejecutar como backup)
        try {
          const simpleService = await import('./simple-role-notification.service.js');
          const simpleSent = simpleService.default.createRoleChangeNotification(
            targetUserEmail,
            oldRole,
            newRole,
            adminEmail
          );

          if (simpleSent) {
            console.log(`✅ AdminService: Método 2 (Simple) - EXITOSO`);
            notificationSent = true;
          }
        } catch (simpleError) {
          console.warn(`⚠️ AdminService: Método 2 (Simple) - FALLÓ:`, simpleError);
        }

        // MÉTODO 3: Fallback evento local (última opción)
        if (!notificationSent) {
          console.log(`🔄 AdminService: Usando Método 3 (Local Event) como último recurso`);
          this._dispatchLegacyRoleChangeEvent(targetUserEmail, oldRole, newRole);
        }

        console.log(`🎯 AdminService: Notificación enviada. Al menos un método debería haber funcionado.`);
      }

      // Sync local data as CACHE ONLY (Supabase is the source of truth)
      console.log(`🔄 AdminService: Updating localStorage cache to match Supabase data`);
      await this._syncLocalData(targetUserEmail, newRole);

      // Verify the change was persisted in Supabase with a delay
      console.log(`🔍 AdminService: Verifying role change persisted in Supabase...`);

      // Wait a bit for the database to fully commit the change
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', targetUserId)
        .single();

      if (verifyError) {
        console.warn(`⚠️ AdminService: Error verifying role change:`, verifyError);
        console.log(`✅ AdminService: Proceeding anyway since main update succeeded`);
      } else if (verifyUser && verifyUser.role === newRole) {
        console.log(`✅ AdminService: CONFIRMED - Role change persisted in Supabase database`);
      } else {
        console.warn(`⚠️ AdminService: Role verification mismatch. Expected: ${newRole}, Found: ${verifyUser?.role}`);
        console.log(`✅ AdminService: Proceeding anyway since main update succeeded`);
      }

      return updatedUser;

    } catch (error) {
      console.error('❌ AdminService: Critical error in updateUserRole:', error);
      throw error;
    }
  }

  // Método auxiliar para sincronizar datos locales después del cambio en Supabase
  async _syncLocalData(userEmail, newRole) {
    try {
      console.log(`🔄 AdminService: Sincronizando datos locales para ${userEmail} con rol ${newRole}`);

      // Actualizar en storageManager
      try {
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        const users = localData.users || [];

        const userIndex = users.findIndex(u => u.email === userEmail);
        if (userIndex !== -1) {
          users[userIndex].role = newRole;
          users[userIndex].updated_at = new Date().toISOString();
          storageManager.set('users', users);
          console.log('✅ AdminService: Rol sincronizado en storageManager');
        }
      } catch (error) {
        console.warn('⚠️ AdminService: Error sincronizando storageManager:', error);
      }

      // Actualizar en Google users localStorage
      try {
        const googleUsers = JSON.parse(localStorage.getItem('google_users') || '[]');
        const googleUserIndex = googleUsers.findIndex(u => u.email === userEmail);

        if (googleUserIndex !== -1) {
          googleUsers[googleUserIndex].role = newRole;
          googleUsers[googleUserIndex].updated_at = new Date().toISOString();
          localStorage.setItem('google_users', JSON.stringify(googleUsers));
          console.log('✅ AdminService: Rol sincronizado en Google users');
        }
      } catch (error) {
        console.warn('⚠️ AdminService: Error sincronizando Google users:', error);
      }

      // Actualizar en CASIRA data
      try {
        const casiraData = JSON.parse(localStorage.getItem('casira-data-v2') || '{}');
        const casiraUsers = casiraData.users || [];

        const casiraUserIndex = casiraUsers.findIndex(u => u.email === userEmail);
        if (casiraUserIndex !== -1) {
          casiraUsers[casiraUserIndex].role = newRole;
          casiraUsers[casiraUserIndex].updated_at = new Date().toISOString();
          casiraData.users = casiraUsers;
          localStorage.setItem('casira-data-v2', JSON.stringify(casiraData));
          console.log('✅ AdminService: Rol sincronizado en CASIRA data');
        }
      } catch (error) {
        console.warn('⚠️ AdminService: Error sincronizando CASIRA data:', error);
      }

      console.log('✅ AdminService: Sincronización local completada');

    } catch (error) {
      console.warn('⚠️ AdminService: Error en sincronización local:', error);
    }
  }



  async blockUser(userId) {
    try {
      console.log(`🚫 AdminService: Bloqueando usuario ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          status: 'blocked'
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
          status: 'active'
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
        .select('id, read', { count: 'exact' });

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
          read: true
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
          unread: notificationsResult.status === 'fulfilled' ? (notificationsResult.value.data?.filter(n => !n.read).length || 0) : 0
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

  // ============= NOTIFICACIONES DE CAMBIO DE ROL =============

  async _createRoleChangeNotification(userId, userEmail, oldRole, newRole) {
    try {
      if (oldRole === newRole) return; // No hay cambio

      console.log(`🔔 AdminService: Creando notificación de cambio de rol para ${userEmail}: ${oldRole} → ${newRole}`);

      const roleNames = {
        'visitor': 'Visitante',
        'volunteer': 'Voluntario',
        'admin': 'Administrador'
      };

      const roleEmojis = {
        'visitor': '👁️',
        'volunteer': '🤝',
        'admin': '👑'
      };

      const messages = {
        'visitor': 'Ahora puedes explorar actividades y registrarte como voluntario.',
        'volunteer': '¡Felicitaciones! Ahora puedes participar activamente en actividades y hacer la diferencia en tu comunidad.',
        'admin': '¡Bienvenido al equipo administrativo! Tienes acceso completo para gestionar usuarios, actividades y el sistema.'
      };

      const title = `${roleEmojis[newRole]} ¡Has sido promovido a ${roleNames[newRole]}!`;
      const message = `Tu rol ha cambiado de ${roleNames[oldRole]} a ${roleNames[newRole]}. ${messages[newRole]}`;

      // Intentar crear en Supabase primero
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'role_change',
            title: title,
            message: message,
            data: JSON.stringify({
              old_role: oldRole,
              new_role: newRole,
              changed_at: new Date().toISOString(),
              admin_promoted: true
            })
          })
          .select()
          .single();

        if (!error && data) {
          console.log('✅ AdminService: Notificación de cambio de rol creada en Supabase');

          // Disparar evento para UI en tiempo real
          if (typeof window !== 'undefined') {
            const eventDetail = {
              userId,
              userEmail,
              oldRole,
              newRole,
              notificationId: data.id,
              timestamp: new Date().toISOString()
            };

            console.log('🔔 AdminService: Disparando evento role-changed:', eventDetail);

            window.dispatchEvent(new CustomEvent('role-changed', {
              detail: eventDetail
            }));

            // También disparar evento de notificación específica
            window.dispatchEvent(new CustomEvent('casira-role-notification', {
              detail: {
                type: 'role_change',
                title: title,
                message: message,
                userEmail: userEmail,
                newRole: newRole,
                autoShow: true
              }
            }));
          }

          return data;
        }
      } catch (supabaseError) {
        console.warn('⚠️ AdminService: Error creando notificación en Supabase:', supabaseError);
      }

      // Fallback a localStorage
      try {
        const { default: storageManager } = await import('../storage-manager.js');
        const localData = storageManager.exportData();
        localData.notifications = localData.notifications || [];

        const notification = {
          id: `role_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          type: 'role_change',
          title: title,
          message: message,
          status: 'unread',
          created_at: new Date().toISOString(),
          data: {
            old_role: oldRole,
            new_role: newRole,
            changed_at: new Date().toISOString(),
            admin_promoted: true
          }
        };

        localData.notifications.push(notification);
        storageManager.set('notifications', localData.notifications);

        console.log('✅ AdminService: Notificación de cambio de rol creada en localStorage');

        // Disparar evento para UI en tiempo real
        if (typeof window !== 'undefined') {
          const eventDetail = {
            userId,
            userEmail,
            oldRole,
            newRole,
            notificationId: notification.id,
            timestamp: new Date().toISOString()
          };

          console.log('🔔 AdminService: Disparando evento role-changed (localStorage):', eventDetail);

          window.dispatchEvent(new CustomEvent('role-changed', {
            detail: eventDetail
          }));

          // También disparar evento de notificación específica
          window.dispatchEvent(new CustomEvent('casira-role-notification', {
            detail: {
              type: 'role_change',
              title: title,
              message: message,
              userEmail: userEmail,
              newRole: newRole,
              autoShow: true
            }
          }));
        }

        return notification;
      } catch (localError) {
        console.warn('⚠️ AdminService: Error creando notificación en localStorage:', localError);
      }

    } catch (error) {
      console.error('❌ AdminService: Error general creando notificación de cambio de rol:', error);
    }
  }

  // ============= BACKGROUND SYNC FOR SUPABASE =============

  _scheduleSupabaseSync(userId, userEmail, newRole) {
    try {
      console.log(`🔄 AdminService: Scheduling background sync for ${userEmail}`);

      // Store sync request in localStorage for retry later
      const syncRequests = JSON.parse(localStorage.getItem('casira-sync-requests') || '[]');

      const syncRequest = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user_role_update',
        userId: userId,
        userEmail: userEmail,
        newRole: newRole,
        attempts: 0,
        maxAttempts: 5,
        created_at: new Date().toISOString(),
        next_attempt: new Date(Date.now() + 30000).toISOString() // 30 seconds from now
      };

      syncRequests.push(syncRequest);
      localStorage.setItem('casira-sync-requests', JSON.stringify(syncRequests));

      // Attempt immediate background sync
      setTimeout(() => this._attemptSupabaseSync(syncRequest), 30000);

      console.log(`📅 AdminService: Sync scheduled for ${userEmail} in 30 seconds`);
    } catch (error) {
      console.warn('⚠️ AdminService: Error scheduling background sync:', error);
    }
  }

  async _attemptSupabaseSync(syncRequest) {
    try {
      console.log(`🔄 AdminService: Attempting background sync for ${syncRequest.userEmail} (attempt ${syncRequest.attempts + 1})`);

      // Try the RPC approach first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('admin_update_user_role', {
          target_user_id: syncRequest.userId,
          new_role_value: syncRequest.newRole
        });

      if (!rpcError) {
        console.log(`✅ AdminService: Background sync successful via RPC for ${syncRequest.userEmail}`);
        this._removeSyncRequest(syncRequest.id);
        return;
      }

      // If RPC fails, try direct update
      const { data, error } = await supabase
        .from('users')
        .update({ role: syncRequest.newRole })
        .eq('id', syncRequest.userId);

      if (!error) {
        console.log(`✅ AdminService: Background sync successful via direct update for ${syncRequest.userEmail}`);
        this._removeSyncRequest(syncRequest.id);
        return;
      }

      throw error;

    } catch (error) {
      console.warn(`⚠️ AdminService: Background sync attempt failed for ${syncRequest.userEmail}:`, error);

      // Update sync request with new attempt count
      const syncRequests = JSON.parse(localStorage.getItem('casira-sync-requests') || '[]');
      const requestIndex = syncRequests.findIndex(r => r.id === syncRequest.id);

      if (requestIndex !== -1) {
        syncRequests[requestIndex].attempts += 1;
        syncRequests[requestIndex].last_error = error.message;
        syncRequests[requestIndex].last_attempt = new Date().toISOString();

        if (syncRequests[requestIndex].attempts >= syncRequests[requestIndex].maxAttempts) {
          console.error(`❌ AdminService: Max sync attempts reached for ${syncRequest.userEmail}, giving up`);
          syncRequests.splice(requestIndex, 1);
        } else {
          // Schedule next attempt with exponential backoff
          const backoffMs = Math.min(300000, 30000 * Math.pow(2, syncRequests[requestIndex].attempts)); // Max 5 minutes
          syncRequests[requestIndex].next_attempt = new Date(Date.now() + backoffMs).toISOString();

          setTimeout(() => this._attemptSupabaseSync(syncRequests[requestIndex]), backoffMs);
          console.log(`📅 AdminService: Next sync attempt for ${syncRequest.userEmail} in ${backoffMs/1000} seconds`);
        }

        localStorage.setItem('casira-sync-requests', JSON.stringify(syncRequests));
      }
    }
  }

  _removeSyncRequest(syncId) {
    try {
      const syncRequests = JSON.parse(localStorage.getItem('casira-sync-requests') || '[]');
      const filteredRequests = syncRequests.filter(r => r.id !== syncId);
      localStorage.setItem('casira-sync-requests', JSON.stringify(filteredRequests));
      console.log(`🗑️ AdminService: Removed sync request ${syncId}`);
    } catch (error) {
      console.warn('⚠️ AdminService: Error removing sync request:', error);
    }
  }

  /**
   * Método fallback para disparar evento legacy de cambio de rol
   */
  _dispatchLegacyRoleChangeEvent(targetUserEmail, oldRole, newRole) {
    try {
      console.log(`🔄 AdminService: Disparando evento legacy role-changed para modal inmediato`);
      console.log(`📧 AdminService: Email del usuario afectado: "${targetUserEmail}"`);
      console.log(`🔄 AdminService: Cambio de rol: "${oldRole}" → "${newRole}"`);

      // Esperar un momento para asegurar que todo esté listo
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('role-changed', {
          detail: {
            userEmail: targetUserEmail,
            oldRole: oldRole,
            newRole: newRole,
            timestamp: new Date().toISOString(),
            source: 'legacy_fallback'
          }
        }));
        console.log(`✅ AdminService: Evento legacy role-changed disparado para ${targetUserEmail}`);
      }, 100);

    } catch (error) {
      console.error('❌ AdminService: Error disparando evento legacy:', error);
    }
  }

}

// Crear instancia singleton
const adminService = new AdminService();

export default adminService;
export { AdminService };