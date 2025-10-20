import React, { useState, useEffect } from 'react';
import { 
  Heart, Users, MessageCircle, Calendar, MapPin, Clock, Phone, Mail, 
  Camera, Award, Target, Globe, Bell, Search, Filter, Plus, Star,
  ThumbsUp, Share, Bookmark, Eye, User, Home, Activity, UserCheck
} from 'lucide-react';
import { 
  activitiesAPI, volunteersAPI, commentsAPI, photosAPI, postsAPI,
  forceRefreshData, permissionsAPI, dataStore 
} from '../lib/api.js';
import adminService from '../lib/services/admin.service.js';
import UniversalHeader from './UniversalHeader.jsx';
import MobileTabNavigation from './MobileTabNavigation.jsx';
import ActivityCard from './ActivityCard.jsx';

const VisitorDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityLikes, setActivityLikes] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeCommentActivity, setActiveCommentActivity] = useState(null);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadDashboardData();
    });
    
    return unsubscribe;
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading visitor dashboard data...');

      // Detectar URL del backend
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://proyecto-casira.onrender.com';

      // Load activities, posts, registrations, and volunteer requests in parallel
      const [activitiesData, postsData, registrationsData, volunteerRequestsData] = await Promise.all([
        activitiesAPI.getPublicActivities(),
        postsAPI.getPublicPosts(10),
        volunteersAPI.getUserRegistrations(user.id),
        adminService.getUserVolunteerRequests(user.email || user.id)
      ]);

      // Cargar también actividades de voluntarios
      let volunteerActivities = [];
      try {
        console.log('🔗 VISITOR: Loading volunteer activities from:', API_URL);
        const volunteerActivitiesResponse = await fetch(`${API_URL}/api/volunteer-activities`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (volunteerActivitiesResponse.ok) {
          volunteerActivities = await volunteerActivitiesResponse.json();
          console.log('✅ VISITOR: Loaded', volunteerActivities.length, 'volunteer activities');

          // Marcar actividades de voluntarios y agregar nombre del creador
          volunteerActivities = volunteerActivities.map(activity => ({
            ...activity,
            created_by_volunteer: true,
            creator_name: activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : 'Voluntario',
            creator_info: activity.users
          }));
        }
      } catch (error) {
        console.error('❌ VISITOR: Error loading volunteer activities:', error);
      }

      console.log('Loaded data:', {
        activities: activitiesData?.length,
        posts: postsData?.length,
        registrations: registrationsData?.length,
        volunteerRequests: volunteerRequestsData?.length,
        volunteerActivities: volunteerActivities?.length
      });

      // Combinar actividades normales y de voluntarios
      const allActivitiesCombined = [...(activitiesData || []), ...volunteerActivities];
      setActivities(allActivitiesCombined);
      setPosts(postsData || []);
      setUserRegistrations(registrationsData || []);
      setVolunteerRequests(volunteerRequestsData || []);

      // Load likes and comments for all activities and posts
      const allItems = [...(activitiesData || []), ...(postsData || [])];
      const likesData = {};
      const userLikesData = {};
      const commentsData = {};

      for (const item of allItems) {
        try {
          const likes = await activitiesAPI.getActivityLikes(item.id);
          const hasLiked = await activitiesAPI.hasUserLiked(item.id, user.id);
          const itemComments = await commentsAPI.getActivityComments(item.id);

          likesData[item.id] = likes.length;
          userLikesData[item.id] = hasLiked;
          commentsData[item.id] = itemComments || [];
        } catch (error) {
          console.error('Error loading interactions for item', item.id, error);
          likesData[item.id] = 0;
          userLikesData[item.id] = false;
          commentsData[item.id] = [];
        }
      }

      setActivityLikes(likesData);
      setUserLikes(userLikesData);
      setComments(commentsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeItem = async (itemId) => {
    if (!user?.id) return;

    try {
      const result = await activitiesAPI.likeActivity(itemId, user.id);
      
      setActivityLikes(prev => ({
        ...prev,
        [itemId]: result.liked ? (prev[itemId] || 0) + 1 : Math.max(0, (prev[itemId] || 0) - 1)
      }));

      setUserLikes(prev => ({
        ...prev,
        [itemId]: result.liked
      }));
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const handleAddComment = async (itemId, commentText) => {
    if (!user?.id || !commentText.trim()) return;

    try {
      // Use the correct API signature: addComment(activityId, userId, content)
      const newComment = await commentsAPI.addComment(
        itemId,           // activityId
        user.id,          // userId  
        commentText.trim() // content
      );

      setComments(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), newComment]
      }));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar el comentario. Por favor, intenta nuevamente.');
    }
  };

  const handleJoinActivity = async (activity) => {
    if (!permissionsAPI.canJoinActivity(user.role)) {
      alert('No tienes permisos para unirte a actividades.');
      return;
    }

    // Detectar URL del backend
    const API_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://proyecto-casira.onrender.com';

    try {
      // Si es una actividad creada por voluntario, usar endpoint diferente
      if (activity.created_by_volunteer) {
        console.log('🎯 VISITOR: Joining volunteer activity:', activity.title);
        const userId = user?.supabase_id || user?.id;

        const response = await fetch(`${API_URL}/api/volunteer-activities/${activity.id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            user_id: userId,
            message: `${user.first_name} ${user.last_name} quiere unirse a esta actividad`
          })
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.error?.includes('Already requested')) {
            alert('Ya has solicitado unirte a esta actividad.');
            return;
          }
          throw new Error(error.error || 'Error al enviar solicitud');
        }

        alert(`¡Solicitud enviada exitosamente!\\n\\n✅ El voluntario "${activity.creator_name}" revisará tu solicitud pronto.\\n🔔 Recibirás una notificación cuando sea aprobada.`);
        loadDashboardData();
        return;
      }

      // Código existente para actividades normales del admin
      // Check if already registered
      const existingRegistration = userRegistrations.find(r => r.activity_id === activity.id);
      if (existingRegistration) {
        alert('Ya te has registrado para esta actividad.');
        return;
      }

      const registrationData = {
        activity_id: activity.id,
        user_id: user.id,
        registration_date: new Date().toISOString(),
        status: 'pending',
        user_info: {
          phone: user.phone || '',
          emergency_contact: '',
          experience_level: 'beginner'
        }
      };

      // Usar el nuevo manejador de solicitudes de voluntarios
      const { createVolunteerRequest } = await import('../lib/volunteer-request-handler.js');
      const message = `${user.first_name} ${user.last_name} (Visitante) quiere asistir a "${activity.title}"`;

      await createVolunteerRequest(user, activity.id, message);

      alert(`¡Te has registrado exitosamente para "${activity.title}"!\\n\\n✅ Tu solicitud ha sido enviada al equipo de coordinación.\\n🔔 Recibirás una notificación cuando sea aprobada.`);

      loadDashboardData();
    } catch (error) {
      console.error('Error joining activity:', error);
      if (error?.message?.includes('Ya estás registrado')) {
        alert('Ya te has registrado previamente para esta actividad.');
      } else {
        alert('Hubo un error al registrarte. Por favor, intenta nuevamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Cargando tu portal...</p>
          {/* Loading skeleton for mobile */}
          <div className="space-y-4 sm:hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 mx-4">
                <div className="loading-shimmer h-4 rounded mb-2"></div>
                <div className="loading-shimmer h-3 rounded w-3/4 mb-2"></div>
                <div className="loading-shimmer h-32 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'feed', 
      label: 'Feed Comunitario', 
      shortLabel: 'Feed',
      icon: Home
    },
    { 
      id: 'activities', 
      label: 'Actividades', 
      shortLabel: 'Actividades',
      icon: Activity 
    },
    { 
      id: 'my-requests', 
      label: 'Mis Solicitudes', 
      shortLabel: 'Solicitudes',
      icon: UserCheck,
      badge: volunteerRequests.filter(r => r.status === 'pending').length || null
    },
    { 
      id: 'profile', 
      label: 'Mi Perfil', 
      shortLabel: 'Perfil',
      icon: User 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <UniversalHeader 
        user={user} 
        onLogout={onLogout}
        title="Portal Comunitario"
        subtitle={`¡Bienvenido de vuelta, ${user.first_name}!`}
      />

      {/* Mobile & Desktop Navigation */}
      <MobileTabNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 mobile-tab-container">
        {/* Feed Comunitario Tab */}
        {activeTab === 'feed' && (
          <div className="space-mobile">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Feed Comunitario</h2>
              <p className="text-gray-600 text-mobile">Mantente al día con todas las actividades y logros de nuestra comunidad</p>
            </div>

            {/* Feed Items */}
            <div className="dashboard-activity-grid">
              {[...posts, ...activities]
                .sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date))
                .map((item, index) => (
                  <div key={`${item.id}-${item.content ? 'post' : 'activity'}`}
                       className="transform transition-all duration-300 animate-fade-in"
                       style={{ animationDelay: `${index * 0.1}s` }}>
                    <ActivityCard
                      activity={item}
                      isLiked={userLikes[item.id] || false}
                      likesCount={activityLikes[item.id] || 0}
                      comments={comments[item.id] || []}
                      onLike={handleLikeItem}
                      onComment={handleAddComment}
                      onJoin={handleJoinActivity}
                      user={user}
                    />
                  </div>
                ))
              }
              
              {/* Empty State */}
              {[...posts, ...activities].length === 0 && (
                <div className="text-center py-12">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Bienvenido a CASIRA!</h3>
                  <p className="text-gray-600 mb-6">Aún no hay contenido en el feed, pero pronto habrá actividades emocionantes</p>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all btn-touch"
                  >
                    Explorar Actividades
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-mobile">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Actividades Disponibles</h2>
              <p className="text-gray-600 text-mobile">Encuentra actividades que te inspiren y únete a nuestra misión</p>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades disponibles</h3>
                <p className="text-gray-600">Pronto habrá nuevas oportunidades para participar</p>
              </div>
            ) : (
              <div className="dashboard-activity-grid">
                {activities.map((activity, index) => (
                  <div key={activity.id}
                       className={`transform transition-all duration-300 animate-fade-in`}
                       style={{ animationDelay: `${index * 0.1}s` }}>
                    <ActivityCard
                      activity={activity}
                      isLiked={userLikes[activity.id] || false}
                      likesCount={activityLikes[activity.id] || 0}
                      comments={comments[activity.id] || []}
                      onLike={handleLikeItem}
                      onComment={handleAddComment}
                      onJoin={handleJoinActivity}
                      user={user}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div className="space-mobile">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Mis Solicitudes</h2>
              <p className="text-gray-600 text-mobile">Revisa el estado de tus solicitudes de voluntariado</p>
            </div>

            <div className="space-mobile">
              {volunteerRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes solicitudes</h3>
                  <p className="text-gray-600 mb-6">Únete a actividades para empezar a contribuir</p>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all btn-touch"
                  >
                    Ver Actividades
                  </button>
                </div>
              ) : (
                volunteerRequests.map((request) => {
                  const activity = activities.find(a => a.id === request.activity_id) || 
                                   { title: request.activity_title || 'Actividad', description: 'Solicitud de voluntario' };

                  return (
                    <div key={request.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-mobile">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                        <img
                          src={activity.image_url || '/placeholder-activity.jpg'}
                          alt={activity.title}
                          className="w-full h-32 sm:w-16 sm:h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                            <div className="flex-1 mb-3 sm:mb-0">
                              <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {request.message || activity.description}
                              </p>
                            </div>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status === 'approved' ? '✅ Aprobada' :
                               request.status === 'rejected' ? '❌ Rechazada' :
                               '⏳ Pendiente'}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 space-y-2 sm:space-y-0">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Solicitado: {new Date(request.created_at).toLocaleDateString('es-ES')}
                            </div>
                            {request.reviewed_at && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Revisado: {new Date(request.reviewed_at).toLocaleDateString('es-ES')}
                              </div>
                            )}
                            {activity.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {activity.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-mobile">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-mobile">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <img
                    src={user.avatar_url || '/default-avatar.jpg'}
                    alt={user.first_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 mx-auto sm:mx-0"
                  />
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-white">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-blue-100">{user.email}</p>
                    <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
                        👀 Visitante
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="padding-mobile">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                      <p className="text-gray-900">{user.phone || 'No especificado'}</p>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Impacto</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{userRegistrations.length}</div>
                        <div className="text-sm text-gray-600">Solicitudes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {userRegistrations.filter(r => r.status === 'confirmed').length}
                        </div>
                        <div className="text-sm text-gray-600">Aprobadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.values(activityLikes).reduce((sum, count) => sum + count, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Likes dados</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VisitorDashboard;