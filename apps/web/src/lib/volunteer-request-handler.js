// ============= CASIRA Connect - Manejador de Solicitudes de Voluntarios =============
import { supabase } from './supabase-client.js';

console.log('🎯 CASIRA: Loading Volunteer Request Handler...');

// Función para crear solicitudes de voluntarios que lleguen al admin - SOLO SUPABASE
export const createVolunteerRequest = async (userOrId, activityId, message = '') => {
  try {
    console.log('📝 VOLUNTEER: Creating request in Supabase:', { userOrId, activityId, message });

    // 1. Obtener información del usuario desde Supabase
    let user = null;
    let supabaseUserId = null;
    
    // Si recibimos el objeto usuario completo
    if (typeof userOrId === 'object' && userOrId.email) {
      user = userOrId;
      // Solo usar supabase_id si es un UUID válido
      if (user.supabase_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.supabase_id)) {
        supabaseUserId = user.supabase_id;
      }
      console.log('✅ Usuario recibido directamente:', user.email);
    } else {
      // Buscar usuario en Supabase por ID o email
      const userId = userOrId;
      console.log('🔍 Buscando usuario en Supabase:', { userId, type: typeof userId });
      
      try {
        const { supabaseAPI } = await import('./supabase-api.js');
        
        // Intentar buscar por ID UUID primero
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          user = await supabaseAPI.users.getUserById(userId);
          if (user) supabaseUserId = user.id;
        }
        
        // Si no se encuentra, buscar por email
        if (!user) {
          user = await supabaseAPI.users.getUserByEmail(userId);
          if (user) supabaseUserId = user.id;
        }
        
        if (user) {
          console.log('✅ Usuario encontrado en Supabase:', user.email);
        }
      } catch (error) {
        console.warn('⚠️ Usuario no encontrado en Supabase, se creará:', error.message);
        // No lanzar error aquí, permitir que se cree el usuario más adelante
      }
    }

    // 2. Obtener información de la actividad desde Supabase
    let activity = null;
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();
      
      if (error) {
        console.error('❌ Error buscando actividad en Supabase:', error);
        throw new Error('Actividad no encontrada en la base de datos');
      }
      
      activity = data;
      console.log('✅ Actividad encontrada en Supabase:', activity.title);
    } catch (error) {
      console.error('❌ Error buscando actividad:', error);
      throw new Error('Actividad no encontrada');
    }

    // Si no tenemos usuario aún, crearlo con datos mínimos
    if (!user) {
      // Si solo recibimos ID/email, crear usuario básico
      if (typeof userOrId === 'string') {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userOrId);
        user = {
          email: isEmail ? userOrId : `${userOrId}@temp.com`,
          first_name: 'Usuario',
          last_name: 'Nuevo',
          role: 'visitor'
        };
        console.log('📝 VOLUNTEER: Created basic user object for:', user.email);
      } else {
        throw new Error('Usuario no encontrado y no se pudo crear');
      }
    }

    if (!activity) {
      throw new Error('Actividad no encontrada');
    }

    // 3. Asegurar que el usuario existe en Supabase (crítico para UUIDs)
    if (!supabaseUserId || !user.supabase_id) {
      try {
        console.log('🔄 VOLUNTEER: Creating/ensuring user exists in Supabase...');
        const { supabaseAPI } = await import('./supabase-api.js');
        
        // Primero intentar buscar si el usuario ya existe por email
        let existingUser = null;
        try {
          existingUser = await supabaseAPI.users.getUserByEmail(user.email);
          if (existingUser) {
            console.log('✅ VOLUNTEER: User found in Supabase:', existingUser.email);
            supabaseUserId = existingUser.id;
            user.supabase_id = existingUser.id;
          }
        } catch (lookupError) {
          console.log('📝 VOLUNTEER: User not found, will create new...');
        }
        
        // Si no existe, crearlo
        if (!existingUser) {
          const newUser = await supabaseAPI.users.createUser({
            email: user.email,
            first_name: user.first_name || 'Usuario',
            last_name: user.last_name || 'Nuevo',
            role: user.role || 'visitor',
            bio: `Usuario registrado - ${new Date().toLocaleDateString()}`,
            avatar_url: user.avatar_url || null
          });
          
          supabaseUserId = newUser.id;
          console.log('✅ VOLUNTEER: User created in Supabase with UUID:', newUser.id);
          
          // Actualizar el objeto usuario con el nuevo ID
          user.supabase_id = newUser.id;
        }
        
      } catch (error) {
        console.error('❌ VOLUNTEER: Error with user in Supabase:', error);
        
        // Si el error es de duplicado, intentar obtener el usuario existente
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          try {
            const { supabaseAPI } = await import('./supabase-api.js');
            const existingUser = await supabaseAPI.users.getUserByEmail(user.email);
            supabaseUserId = existingUser.id;
            user.supabase_id = existingUser.id;
            console.log('✅ VOLUNTEER: Used existing user from duplicate:', existingUser.id);
          } catch (duplicateError) {
            throw new Error(`Error con usuario duplicado: ${duplicateError.message}`);
          }
        } else {
          throw new Error(`No se pudo gestionar el usuario en la base de datos: ${error.message}`);
        }
      }
    }

    // 4. Crear la solicitud directamente en Supabase
    const requestData = {
      user_id: supabaseUserId,
      activity_id: activityId,
      message: message || `Solicitud para participar en ${activity.title}`,
      status: 'pending'
    };

    console.log('📤 VOLUNTEER: Creating request in Supabase:', requestData);
    
    const { data, error } = await supabase
      .from('volunteer_requests')
      .insert(requestData)
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(*),
        activity:activities!volunteer_requests_activity_id_fkey(*)
      `);

    if (error) {
      console.error('❌ VOLUNTEER: Supabase error:', error);
      throw new Error(`Error al crear solicitud: ${error.message}`);
    }

    if (data && data.length > 0) {
      const created = data[0];
      console.log('✅ VOLUNTEER: Request created in Supabase:', created.id);
      
      // Crear notificación en Supabase para el admin
      try {
        const userName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        
        // Crear notificación para admin (user_id = null para notificaciones globales del admin)
        await supabase
          .from('notifications')
          .insert({
            type: 'volunteer_request',
            title: '🙋‍♀️ Nueva Solicitud de Voluntario',
            message: `${userName} quiere unirse a "${activity.title}"`,
            data: JSON.stringify({ 
              volunteer_request_id: created.id, 
              activity_id: activityId,
              user_email: user.email,
              user_name: userName
            })
          });
        
        console.log('🔔 VOLUNTEER: Admin notification created');
      } catch (notifError) {
        console.warn('⚠️ VOLUNTEER: Failed to create admin notification:', notifError);
      }
      
      return created;
    } else {
      throw new Error('No se pudo crear la solicitud');
    }

  } catch (error) {
    console.error('❌ VOLUNTEER: Error creating volunteer request:', error);
    throw error;
  }
};

// Función para obtener solicitudes pendientes (para el admin) - SOLO SUPABASE
export const getPendingVolunteerRequests = async () => {
  try {
    console.log('🔍 VOLUNTEER: Fetching pending requests from Supabase...');
    
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(id, email, first_name, last_name, full_name, avatar_url),
        activity:activities!volunteer_requests_activity_id_fkey(id, title, description, location)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ VOLUNTEER: Error getting Supabase requests:', error);
      throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    }

    const requests = data || [];
    console.log(`✅ VOLUNTEER: Found ${requests.length} pending requests in Supabase`);
    return requests;
    
  } catch (error) {
    console.error('❌ VOLUNTEER: Error getting pending volunteer requests:', error);
    throw error;
  }
};

export default {
  createVolunteerRequest,
  getPendingVolunteerRequests
};

console.log('✅ CASIRA: Volunteer Request Handler Ready');