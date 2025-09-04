// ============= CASIRA Connect - Admin Dashboard con Supabase =============
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, BarChart3, Settings, Bell, CheckCircle, XCircle, 
  AlertCircle, RefreshCw, UserCheck, UserX, MessageCircle, Heart,
  Activity, TrendingUp, Eye, EyeOff, Trash2, Star
} from 'lucide-react';
import { 
  adminUsers, adminVolunteers, adminContent, adminActivities, 
  adminDashboard, adminQuickActions 
} from '../lib/admin-supabase.js';
import { supabase, subscribeToTable } from '../lib/supabase-client.js';

const AdminDashboardSupabase = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('online');
  
  // Estados para datos
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Estados para acciones
  const [processingItems, setProcessingItems] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    loadAdminData();
    setupRealTimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
    };
  }, []);

  // ============= CARGAR DATOS =============
  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 ADMIN: Loading dashboard data...');
      
      const dashboardStats = await adminDashboard.getDashboardStats();
      setStats(dashboardStats);
      
      // Cargar datos según la pestaña activa
      switch (activeTab) {
        case 'users':
          const usersData = await adminUsers.getAllUsers();
          setUsers(usersData);
          break;
        case 'volunteers':
          const requestsData = await adminVolunteers.getPendingRequests();
          setVolunteerRequests(requestsData);
          break;
        case 'content':
          const [postsData, commentsData] = await Promise.all([
            adminContent.getAllPosts(),
            adminContent.getAllComments()
          ]);
          setPosts(postsData);
          setComments(commentsData);
          break;
        case 'activities':
          const activitiesData = await adminActivities.getAllActivities();
          setActivities(activitiesData);
          break;
        case 'dashboard':
          const recentData = await adminDashboard.getRecentActivity(10);
          setRecentActivity(recentData);
          break;
      }
      
      console.log('✅ ADMIN: Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ ADMIN: Error loading dashboard data:', error);
      setConnectionStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  // ============= SUSCRIPCIONES EN TIEMPO REAL =============
  const setupRealTimeSubscriptions = () => {
    console.log('🔔 ADMIN: Setting up real-time subscriptions');
    
    // Suscribirse a cambios en volunteer_requests
    subscribeToTable('volunteer_requests', () => {
      if (activeTab === 'volunteers') {
        loadAdminData();
      }
    });
    
    // Suscribirse a cambios en users
    subscribeToTable('users', () => {
      if (activeTab === 'users') {
        loadAdminData();
      }
      // Siempre actualizar stats
      adminDashboard.getDashboardStats().then(setStats);
    });
    
    // Suscribirse a cambios en posts y comments
    subscribeToTable('posts', () => {
      if (activeTab === 'content') {
        loadAdminData();
      }
    });
    
    subscribeToTable('comments', () => {
      if (activeTab === 'content') {
        loadAdminData();
      }
    });
  };

  // ============= ACCIONES ADMINISTRATIVAS =============
  const handleApproveUser = async (userId) => {
    try {
      setProcessingItems(prev => new Set([...prev, userId]));
      await adminUsers.approveUser(userId);
      loadAdminData();
      console.log(`✅ ADMIN: User ${userId} approved`);
    } catch (error) {
      console.error('❌ ADMIN: Error approving user:', error);
      alert('Error al aprobar usuario: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const reason = prompt('Razón del baneo (opcional):');
      setProcessingItems(prev => new Set([...prev, userId]));
      await adminUsers.banUser(userId, reason);
      loadAdminData();
      console.log(`🚫 ADMIN: User ${userId} banned`);
    } catch (error) {
      console.error('❌ ADMIN: Error banning user:', error);
      alert('Error al banear usuario: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleApproveVolunteer = async (requestId) => {
    try {
      setProcessingItems(prev => new Set([...prev, requestId]));
      await adminVolunteers.approveVolunteerRequest(requestId);
      loadAdminData();
      console.log(`✅ ADMIN: Volunteer request ${requestId} approved`);
    } catch (error) {
      console.error('❌ ADMIN: Error approving volunteer:', error);
      alert('Error al aprobar voluntario: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectVolunteer = async (requestId) => {
    try {
      const reason = prompt('Razón del rechazo (opcional):');
      setProcessingItems(prev => new Set([...prev, requestId]));
      await adminVolunteers.rejectVolunteerRequest(requestId, reason);
      loadAdminData();
      console.log(`❌ ADMIN: Volunteer request ${requestId} rejected`);
    } catch (error) {
      console.error('❌ ADMIN: Error rejecting volunteer:', error);
      alert('Error al rechazar voluntario: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('¿Seguro que quieres eliminar este post?')) return;
    
    try {
      setProcessingItems(prev => new Set([...prev, postId]));
      await adminContent.deletePost(postId);
      loadAdminData();
      console.log(`🗑️ ADMIN: Post ${postId} deleted`);
    } catch (error) {
      console.error('❌ ADMIN: Error deleting post:', error);
      alert('Error al eliminar post: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleFeaturePost = async (postId, featured = true) => {
    try {
      setProcessingItems(prev => new Set([...prev, postId]));
      await adminContent.featurePost(postId, featured);
      loadAdminData();
      console.log(`⭐ ADMIN: Post ${postId} ${featured ? 'featured' : 'unfeatured'}`);
    } catch (error) {
      console.error('❌ ADMIN: Error featuring post:', error);
      alert('Error al destacar post: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // ============= COMPONENTES DE UI =============
  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change} esta semana
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, active, onClick, badge }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
        active 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  // ============= RENDER =============
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
              <p className="text-sm text-gray-500">
                Gestión completa de CASIRA Connect
                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus === 'online' ? 'En línea' : 'Offline'}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadAdminData}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers}
            icon={Users}
            change={stats.newUsersThisWeek}
            color="blue"
          />
          <StatCard
            title="Solicitudes Pendientes"
            value={stats.pendingVolunteerRequests}
            icon={Bell}
            color="orange"
          />
          <StatCard
            title="Actividades Activas"
            value={stats.activeActivities}
            icon={Calendar}
            change={stats.newActivitiesToday}
            color="green"
          />
          <StatCard
            title="Posts Publicados"
            value={stats.totalPosts}
            icon={MessageCircle}
            change={stats.newPostsToday}
            color="purple"
          />
        </div>

        {/* Navegación de pestañas */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap p-4 space-x-2">
            <TabButton
              id="dashboard"
              label="Dashboard"
              icon={BarChart3}
              active={activeTab === 'dashboard'}
              onClick={() => {
                setActiveTab('dashboard');
                loadAdminData();
              }}
            />
            <TabButton
              id="users"
              label="Usuarios"
              icon={Users}
              active={activeTab === 'users'}
              onClick={() => {
                setActiveTab('users');
                loadAdminData();
              }}
              badge={stats.pendingUsers || 0}
            />
            <TabButton
              id="volunteers"
              label="Voluntarios"
              icon={UserCheck}
              active={activeTab === 'volunteers'}
              onClick={() => {
                setActiveTab('volunteers');
                loadAdminData();
              }}
              badge={stats.pendingVolunteerRequests || 0}
            />
            <TabButton
              id="content"
              label="Contenido"
              icon={MessageCircle}
              active={activeTab === 'content'}
              onClick={() => {
                setActiveTab('content');
                loadAdminData();
              }}
            />
            <TabButton
              id="activities"
              label="Actividades"
              icon={Calendar}
              active={activeTab === 'activities'}
              onClick={() => {
                setActiveTab('activities');
                loadAdminData();
              }}
            />
          </div>
        </div>

        {/* Contenido de pestañas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Cargando datos...</span>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'user_approved' && <UserCheck className="w-5 h-5 text-green-500" />}
                        {activity.type === 'volunteer_request' && <Bell className="w-5 h-5 text-blue-500" />}
                        {activity.type === 'volunteer_approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Gestión de Usuarios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Usuario</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Rol</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Estado</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Registro</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.full_name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-medium">
                                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium">
                                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'volunteer' ? 'bg-green-100 text-green-800' :
                              user.role === 'donor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role || 'visitor'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'banned' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center space-x-2">
                              {user.status !== 'active' && (
                                <button
                                  onClick={() => handleApproveUser(user.id)}
                                  disabled={processingItems.has(user.id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                                  title="Aprobar usuario"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              {user.status !== 'banned' && user.role !== 'admin' && (
                                <button
                                  onClick={() => handleBanUser(user.id)}
                                  disabled={processingItems.has(user.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                                  title="Banear usuario"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Volunteers Tab */}
            {activeTab === 'volunteers' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Solicitudes de Voluntarios</h3>
                <div className="space-y-4">
                  {volunteerRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {request.user?.avatar_url ? (
                              <img 
                                src={request.user.avatar_url} 
                                alt={request.user.full_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {(request.user?.first_name?.[0] || request.user?.email?.[0] || '?').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {request.user?.full_name || 
                                 `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim() || 
                                 'Usuario desconocido'}
                              </p>
                              <p className="text-sm text-gray-600">{request.user?.email}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Actividad:</strong> {request.activity?.title || 'Actividad desconocida'}
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Mensaje:</strong> {request.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Solicitado: {new Date(request.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveVolunteer(request.id)}
                            disabled={processingItems.has(request.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectVolunteer(request.id)}
                            disabled={processingItems.has(request.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {volunteerRequests.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay solicitudes pendientes</p>
                  )}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Moderación de Contenido</h3>
                
                {/* Posts Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium mb-3">Posts</h4>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{post.author?.full_name || 'Usuario desconocido'}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('es-ES')}
                              </span>
                              {post.featured && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                            {post.title && <h5 className="font-medium mb-1">{post.title}</h5>}
                            <p className="text-gray-700 text-sm mb-2">{post.content}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Heart className="w-3 h-3 mr-1" />
                                {post.likes_count || 0} likes
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {post.comments_count || 0} comentarios
                              </span>
                              <span className={`px-2 py-1 rounded ${
                                post.visibility === 'public' ? 'bg-green-100 text-green-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {post.visibility}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleFeaturePost(post.id, !post.featured)}
                              disabled={processingItems.has(post.id)}
                              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded disabled:opacity-50"
                              title={post.featured ? 'Quitar de destacados' : 'Destacar post'}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={processingItems.has(post.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                              title="Eliminar post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h4 className="text-md font-medium mb-3">Comentarios Recientes</h4>
                  <div className="space-y-2">
                    {comments.slice(0, 10).map((comment) => (
                      <div key={comment.id} className="border rounded p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.author?.full_name || 'Usuario desconocido'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              En: {comment.post?.title || 'Post eliminado'}
                            </p>
                          </div>
                          <button
                            onClick={() => adminContent.deleteComment(comment.id).then(loadAdminData)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Gestión de Actividades</h3>
                <div className="grid gap-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span>📍 {activity.location}</span>
                            <span>👥 {activity.current_volunteers || 0}/{activity.max_volunteers || 'Sin límite'}</span>
                            <span className={`px-2 py-1 rounded ${
                              activity.status === 'active' ? 'bg-green-100 text-green-800' :
                              activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Creado por: {activity.creator?.full_name || 'Usuario desconocido'} • 
                            {new Date(activity.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {activity.participants && activity.participants.length > 0 && (
                            <div className="text-xs text-gray-600">
                              {activity.participants.length} participante(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardSupabase;