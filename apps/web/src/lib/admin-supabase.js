// ============= CASIRA Connect - Admin Panel Supabase API =============
import { supabase } from './supabase-client.js';

// ============= ADMIN - GESTIÓN DE USUARIOS =============
export const adminUsers = {
  // Obtener todos los usuarios para revisión del admin
  getAllUsers: async () => {
    console.log('👥 ADMIN: Fetching all users for review');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ ADMIN: Error fetching users:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} users for review`);
    return data || [];
  },

  // Aprobar usuario nuevo (cambiar status)
  approveUser: async (userId) => {
    console.log(`✅ ADMIN: Approving user ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        status: 'active',
        verified: true 
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error approving user:', error);
      throw error;
    }
    
    // Crear notificación de aprobación para el usuario
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'user_approved',
        title: '¡Cuenta aprobada!',
        message: 'Tu cuenta ha sido aprobada por el administrador. Ya puedes participar en todas las actividades.',
      }]);
    
    console.log('✅ ADMIN: User approved successfully');
    return data;
  },

  // Rechazar/Banear usuario
  banUser: async (userId, reason = '') => {
    console.log(`🚫 ADMIN: Banning user ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        status: 'banned',
        preferences: { ban_reason: reason }
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error banning user:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: User banned successfully');
    return data;
  },

  // Cambiar rol de usuario
  changeUserRole: async (userId, newRole) => {
    console.log(`🔄 ADMIN: Changing user ${userId} role to ${newRole}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error changing user role:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: User role changed successfully');
    return data;
  }
};

// ============= ADMIN - GESTIÓN DE SOLICITUDES DE VOLUNTARIOS =============
export const adminVolunteers = {
  // Obtener todas las solicitudes pendientes
  getPendingRequests: async () => {
    console.log('📋 ADMIN: Fetching pending volunteer requests');
    
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url,
          status
        ),
        activity:activities!volunteer_requests_activity_id_fkey(
          id,
          title,
          location,
          max_volunteers,
          current_volunteers
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ ADMIN: Error fetching volunteer requests:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} pending requests`);
    return data || [];
  },

  // Aprobar solicitud de voluntario
  approveVolunteerRequest: async (requestId) => {
    console.log(`✅ ADMIN: Approving volunteer request ${requestId}`);
    
    // Actualizar estado de la solicitud
    const { data: request, error } = await supabase
      .from('volunteer_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(*),
        activity:activities!volunteer_requests_activity_id_fkey(*)
      `)
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error approving volunteer request:', error);
      throw error;
    }
    
    // Agregar a la tabla de participantes
    await supabase
      .from('activity_participants')
      .insert([{
        activity_id: request.activity_id,
        user_id: request.user_id,
        role: 'volunteer',
        status: 'confirmed'
      }]);
    
    // Actualizar contador de voluntarios en la actividad
    await supabase
      .from('activities')
      .update({ 
        current_volunteers: supabase.raw('current_volunteers + 1')
      })
      .eq('id', request.activity_id);
    
    // Notificar al usuario
    await supabase
      .from('notifications')
      .insert([{
        user_id: request.user_id,
        activity_id: request.activity_id,
        type: 'volunteer_approved',
        title: 'Solicitud aprobada',
        message: `Tu solicitud para participar en "${request.activity.title}" ha sido aprobada.`
      }]);
    
    console.log('✅ ADMIN: Volunteer request approved successfully');
    return request;
  },

  // Rechazar solicitud de voluntario
  rejectVolunteerRequest: async (requestId, reason = '') => {
    console.log(`❌ ADMIN: Rejecting volunteer request ${requestId}`);
    
    const { data: request, error } = await supabase
      .from('volunteer_requests')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        user:users!volunteer_requests_user_id_fkey(*),
        activity:activities!volunteer_requests_activity_id_fkey(*)
      `)
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error rejecting volunteer request:', error);
      throw error;
    }
    
    // Notificar al usuario
    await supabase
      .from('notifications')
      .insert([{
        user_id: request.user_id,
        activity_id: request.activity_id,
        type: 'volunteer_rejected',
        title: 'Solicitud rechazada',
        message: `Tu solicitud para participar en "${request.activity.title}" no fue aprobada. ${reason ? 'Razón: ' + reason : ''}`
      }]);
    
    console.log('✅ ADMIN: Volunteer request rejected successfully');
    return request;
  }
};

// ============= ADMIN - GESTIÓN DE CONTENIDO =============
export const adminContent = {
  // Obtener todos los posts para moderación
  getAllPosts: async () => {
    console.log('📝 ADMIN: Fetching all posts for moderation');
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        ),
        activity:activities!posts_activity_id_fkey(
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ ADMIN: Error fetching posts:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} posts for moderation`);
    return data || [];
  },

  // Obtener todos los comentarios para moderación
  getAllComments: async () => {
    console.log('💬 ADMIN: Fetching all comments for moderation');
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        ),
        post:posts(
          id,
          title,
          content
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ ADMIN: Error fetching comments:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} comments for moderation`);
    return data || [];
  },

  // Eliminar post
  deletePost: async (postId) => {
    console.log(`🗑️ ADMIN: Deleting post ${postId}`);
    
    // Eliminar comentarios del post
    await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);
    
    // Eliminar el post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
      
    if (error) {
      console.error('❌ ADMIN: Error deleting post:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: Post deleted successfully');
  },

  // Eliminar comentario
  deleteComment: async (commentId) => {
    console.log(`🗑️ ADMIN: Deleting comment ${commentId}`);
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (error) {
      console.error('❌ ADMIN: Error deleting comment:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: Comment deleted successfully');
  },

  // Hacer post destacado
  featurePost: async (postId, featured = true) => {
    console.log(`⭐ ADMIN: ${featured ? 'Featuring' : 'Unfeaturing'} post ${postId}`);
    
    const { error } = await supabase
      .from('posts')
      .update({ featured: featured })
      .eq('id', postId);
      
    if (error) {
      console.error('❌ ADMIN: Error updating post featured status:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: Post featured status updated successfully');
  }
};

// ============= ADMIN - GESTIÓN DE ACTIVIDADES =============
export const adminActivities = {
  // Obtener todas las actividades
  getAllActivities: async () => {
    console.log('🎯 ADMIN: Fetching all activities');
    
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        category:activity_categories(
          id,
          name,
          color,
          icon
        ),
        creator:users!activities_created_by_fkey(
          id,
          first_name,
          last_name,
          full_name,
          email
        ),
        participants:activity_participants(
          id,
          user:users(
            id,
            first_name,
            last_name,
            full_name,
            email
          ),
          role,
          status
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ ADMIN: Error fetching activities:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} activities`);
    return data || [];
  },

  // Aprobar/Rechazar actividad
  updateActivityStatus: async (activityId, status) => {
    console.log(`🎯 ADMIN: Updating activity ${activityId} status to ${status}`);
    
    const { data, error } = await supabase
      .from('activities')
      .update({ status: status })
      .eq('id', activityId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ ADMIN: Error updating activity status:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: Activity status updated successfully');
    return data;
  },

  // Eliminar actividad
  deleteActivity: async (activityId) => {
    console.log(`🗑️ ADMIN: Deleting activity ${activityId}`);
    
    // Eliminar en cascada: participantes, posts, comentarios, etc.
    await supabase.from('activity_participants').delete().eq('activity_id', activityId);
    await supabase.from('volunteer_requests').delete().eq('activity_id', activityId);
    await supabase.from('notifications').delete().eq('activity_id', activityId);
    
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);
      
    if (error) {
      console.error('❌ ADMIN: Error deleting activity:', error);
      throw error;
    }
    
    console.log('✅ ADMIN: Activity deleted successfully');
  }
};

// ============= ADMIN - ESTADÍSTICAS Y DASHBOARD =============
export const adminDashboard = {
  // Obtener estadísticas completas del dashboard
  getDashboardStats: async () => {
    console.log('📊 ADMIN: Fetching dashboard statistics');
    
    // Ejecutar múltiples consultas en paralelo
    const [
      usersResult,
      activitiesResult,
      postsResult,
      commentsResult,
      volunteerRequestsResult,
      notificationsResult
    ] = await Promise.all([
      supabase.from('users').select('id, status, role, created_at'),
      supabase.from('activities').select('id, status, created_at'),
      supabase.from('posts').select('id, visibility, created_at'),
      supabase.from('comments').select('id, created_at'),
      supabase.from('volunteer_requests').select('id, status, created_at'),
      supabase.from('notifications').select('id, read, created_at')
    ]);
    
    const users = usersResult.data || [];
    const activities = activitiesResult.data || [];
    const posts = postsResult.data || [];
    const comments = commentsResult.data || [];
    const volunteerRequests = volunteerRequestsResult.data || [];
    const notifications = notificationsResult.data || [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      // Usuarios
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      pendingUsers: users.filter(u => u.status === 'inactive').length,
      bannedUsers: users.filter(u => u.status === 'banned').length,
      newUsersToday: users.filter(u => new Date(u.created_at) >= today).length,
      newUsersThisWeek: users.filter(u => new Date(u.created_at) >= thisWeek).length,
      newUsersThisMonth: users.filter(u => new Date(u.created_at) >= thisMonth).length,
      
      // Roles
      adminUsers: users.filter(u => u.role === 'admin').length,
      volunteers: users.filter(u => u.role === 'volunteer').length,
      donors: users.filter(u => u.role === 'donor').length,
      visitors: users.filter(u => u.role === 'visitor').length,
      
      // Actividades
      totalActivities: activities.length,
      activeActivities: activities.filter(a => a.status === 'active').length,
      completedActivities: activities.filter(a => a.status === 'completed').length,
      planningActivities: activities.filter(a => a.status === 'planning').length,
      
      // Contenido
      totalPosts: posts.length,
      publicPosts: posts.filter(p => p.visibility === 'public').length,
      totalComments: comments.length,
      
      // Solicitudes
      totalVolunteerRequests: volunteerRequests.length,
      pendingVolunteerRequests: volunteerRequests.filter(vr => vr.status === 'pending').length,
      approvedVolunteerRequests: volunteerRequests.filter(vr => vr.status === 'approved').length,
      rejectedVolunteerRequests: volunteerRequests.filter(vr => vr.status === 'rejected').length,
      
      // Notificaciones
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
      
      // Actividad reciente
      newActivitiesToday: activities.filter(a => new Date(a.created_at) >= today).length,
      newPostsToday: posts.filter(p => new Date(p.created_at) >= today).length,
      newCommentsToday: comments.filter(c => new Date(c.created_at) >= today).length,
      newVolunteerRequestsToday: volunteerRequests.filter(vr => new Date(vr.created_at) >= today).length
    };
    
    console.log('✅ ADMIN: Dashboard statistics retrieved successfully');
    console.log('📊 Stats summary:', {
      totalUsers: stats.totalUsers,
      pendingRequests: stats.pendingVolunteerRequests,
      unreadNotifications: stats.unreadNotifications,
      todayActivity: {
        users: stats.newUsersToday,
        activities: stats.newActivitiesToday,
        posts: stats.newPostsToday,
        comments: stats.newCommentsToday,
        requests: stats.newVolunteerRequestsToday
      }
    });
    
    return stats;
  },

  // Obtener actividad reciente para el feed del admin
  getRecentActivity: async (limit = 20) => {
    console.log('⏱️ ADMIN: Fetching recent activity feed');
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user:users!notifications_user_id_fkey(
          id,
          first_name,
          last_name,
          full_name,
          email,
          avatar_url
        ),
        activity:activities!notifications_activity_id_fkey(
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('❌ ADMIN: Error fetching recent activity:', error);
      throw error;
    }
    
    console.log(`✅ ADMIN: Retrieved ${data?.length || 0} recent activities`);
    return data || [];
  }
};

// ============= ADMIN - ACCIONES RÁPIDAS =============
export const adminQuickActions = {
  // Aprobar múltiples solicitudes de voluntarios
  bulkApproveVolunteers: async (requestIds) => {
    console.log(`✅ ADMIN: Bulk approving ${requestIds.length} volunteer requests`);
    
    for (const requestId of requestIds) {
      try {
        await adminVolunteers.approveVolunteerRequest(requestId);
      } catch (error) {
        console.error(`❌ ADMIN: Error approving request ${requestId}:`, error);
      }
    }
    
    console.log('✅ ADMIN: Bulk approval completed');
  },

  // Enviar notificación a todos los usuarios
  sendBroadcastNotification: async (title, message, type = 'announcement') => {
    console.log('📢 ADMIN: Sending broadcast notification');
    
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('status', 'active');
    
    if (users && users.length > 0) {
      const notifications = users.map(user => ({
        user_id: user.id,
        type: type,
        title: title,
        message: message
      }));
      
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
        
      if (error) {
        console.error('❌ ADMIN: Error sending broadcast notification:', error);
        throw error;
      }
    }
    
    console.log(`✅ ADMIN: Broadcast notification sent to ${users?.length || 0} users`);
  }
};

export default {
  adminUsers,
  adminVolunteers,
  adminContent,
  adminActivities,
  adminDashboard,
  adminQuickActions
};