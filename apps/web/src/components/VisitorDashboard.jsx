import React, { useState, useEffect } from 'react';
import { 
  Heart, Users, MessageCircle, Calendar, MapPin, Clock, Phone, Mail, 
  Camera, Award, Target, Globe, Bell, Search, Filter, Plus, Star,
  ThumbsUp, Share, Bookmark, Eye, User
} from 'lucide-react';
import { 
  activitiesAPI, volunteersAPI, commentsAPI, photosAPI, postsAPI,
  forceRefreshData, permissionsAPI, dataStore 
} from '../lib/api.js';
import UniversalHeader from './UniversalHeader.jsx';

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

      // Load activities, posts, and registrations in parallel
      const [activitiesData, postsData, registrationsData] = await Promise.all([
        activitiesAPI.getPublicActivities(),
        postsAPI.getPublicPosts(10),
        volunteersAPI.getUserRegistrations(user.id)
      ]);

      console.log('Loaded data:', { 
        activities: activitiesData?.length, 
        posts: postsData?.length, 
        registrations: registrationsData?.length 
      });

      setActivities(activitiesData || []);
      setPosts(postsData || []);
      setUserRegistrations(registrationsData || []);

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
        [itemId]: result.totalLikes
      }));
      
      setUserLikes(prev => ({
        ...prev,
        [itemId]: result.liked
      }));
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const handleAddComment = async (itemId) => {
    if (!newComment.trim() || !user?.id) return;

    try {
      await commentsAPI.addComment(itemId, user.id, newComment);
      setNewComment('');
      
      // Reload comments for this item
      const updatedComments = await commentsAPI.getActivityComments(itemId);
      setComments(prev => ({
        ...prev,
        [itemId]: updatedComments || []
      }));
      
      setActiveCommentActivity(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar comentario');
    }
  };

  const handleJoinActivity = async (activity) => {
    setSelectedActivity(activity);
    setShowJoinModal(true);
  };

  const confirmJoinActivity = async () => {
    try {
      if (selectedActivity && user) {
        const registrationData = {
          notes: `Solicitud de ${user.first_name} ${user.last_name} desde el portal de visitantes`,
          skills_offered: user.skills || []
        };
        
        await volunteersAPI.registerForActivity(user.id, selectedActivity.id, registrationData);
        
        alert(`¡Te has registrado exitosamente para "${selectedActivity.title}"!\\n\\n✅ Tu solicitud ha sido enviada al equipo de coordinación.\\n🔔 Recibirás una notificación cuando sea aprobada.`);
        
        setShowJoinModal(false);
        setSelectedActivity(null);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error joining activity:', error);
      if (error.message.includes('Ya estás registrado')) {
        alert('Ya te has registrado previamente para esta actividad.');
      } else {
        alert('Hubo un error al registrarte. Por favor, intenta nuevamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <UniversalHeader 
        user={user} 
        onLogout={onLogout}
        title="Portal Comunitario"
        subtitle={`¡Bienvenido de vuelta, ${user.first_name}!`}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'feed', label: 'Feed Comunitario', icon: Globe },
              { id: 'activities', label: 'Actividades', icon: Calendar },
              { id: 'my-requests', label: 'Mis Solicitudes', icon: Bell },
              { id: 'profile', label: 'Mi Perfil', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Feed Comunitario Tab */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Feed Comunitario</h2>
              <p className="text-gray-600">Mantente al día con todas las actividades y logros de nuestra comunidad</p>
            </div>

            {/* Feed Items */}
            <div className="space-y-6">
              {[...posts, ...activities].sort((a, b) => 
                new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date)
              ).map((item) => (
                <div key={`${item.id}-${item.content ? 'post' : 'activity'}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Item Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {item.content ? '📢' : '🎯'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.content ? 'Actualización CASIRA' : item.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at || item.start_date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {item.content || item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item Image */}
                  {item.image_url && (
                    <div className="px-6 pb-4">
                      <img 
                        src={item.image_url} 
                        alt={item.title || 'Imagen'} 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Item Actions */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeItem(item.id)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                            userLikes[item.id] 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${userLikes[item.id] ? 'fill-current' : ''}`} />
                          <span className="text-sm font-semibold">{activityLikes[item.id] || 0}</span>
                        </button>
                        
                        <button
                          onClick={() => setActiveCommentActivity(activeCommentActivity === item.id ? null : item.id)}
                          className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">{comments[item.id]?.length || 0}</span>
                        </button>

                        {!item.content && (
                          <button
                            onClick={() => handleJoinActivity(item)}
                            className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          >
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-semibold">Unirse</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    {activeCommentActivity === item.id && (
                      <div className="mt-4 space-y-3">
                        {/* Add Comment */}
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {user.first_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Escribe un comentario..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleAddComment(item.id)}
                                disabled={!newComment.trim()}
                                className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                Comentar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Existing Comments */}
                        <div className="space-y-2">
                          {(comments[item.id] || []).map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {comment.user?.first_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-900">
                                      {comment.user?.first_name} {comment.user?.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Actividades Disponibles</h2>
              <p className="text-gray-600">Encuentra actividades que te inspiren y únete a nuestra misión</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative h-48">
                    <img 
                      src={activity.image_url || '/placeholder-activity.jpg'} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Disponible
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {activity.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          {activity.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        {activity.current_volunteers || 0}/{activity.max_volunteers || '∞'} voluntarios
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLikeItem(activity.id)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                          userLikes[activity.id] 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${userLikes[activity.id] ? 'fill-current' : ''}`} />
                        <span className="text-sm font-semibold">{activityLikes[activity.id] || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => handleJoinActivity(activity)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ¡Participar!
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Solicitudes</h2>
              <p className="text-gray-600">Seguimiento de tus solicitudes de participación</p>
            </div>

            {userRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tienes solicitudes pendientes
                </h3>
                <p className="text-gray-600 mb-4">
                  ¡Explora las actividades disponibles y únete a una causa!
                </p>
                <button
                  onClick={() => setActiveTab('activities')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Actividades
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userRegistrations.map((registration) => {
                  const activity = activities.find(a => a.id === registration.activity_id);
                  if (!activity) return null;

                  return (
                    <div key={registration.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-start space-x-4">
                        <img
                          src={activity.image_url || '/placeholder-activity.jpg'}
                          alt={activity.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                              <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {registration.status === 'confirmed' ? '✅ Aprobado' :
                               registration.status === 'rejected' ? '❌ Rechazado' :
                               '⏳ Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Solicitado: {new Date(registration.registration_date).toLocaleDateString('es-ES')}
                            </div>
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
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {user.first_name[0].toUpperCase()}{user.last_name?.[0]?.toUpperCase() || ''}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                <p className="text-gray-600 capitalize">{user.role}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                    <p className="text-gray-900">{user.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Ubicación:</span>
                    <p className="text-gray-900">{user.location || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Miembro desde:</span>
                    <p className="text-gray-900">{new Date(user.created_at).getFullYear()}</p>
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Biografía:</span>
                    <p className="text-gray-900 mt-1">{user.bio}</p>
                  </div>
                )}

                {user.skills && user.skills.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Habilidades:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Join Activity Modal */}
      {showJoinModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Quieres participar en esta actividad?
              </h3>
              <p className="text-gray-600">
                Tu solicitud será enviada al equipo de coordinación para su aprobación.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedActivity.title}</h4>
              <p className="text-gray-600 text-sm">{selectedActivity.description}</p>
              {selectedActivity.location && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedActivity.location}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmJoinActivity}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;