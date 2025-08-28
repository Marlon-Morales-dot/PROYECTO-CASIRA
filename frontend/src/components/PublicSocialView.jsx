import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Users, MapPin, Calendar, Clock, Send, Star, Eye, ThumbsUp, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { activitiesAPI, commentsAPI, photosAPI, dataStore } from '@/lib/api.js';

const PublicSocialView = ({ currentUser = null }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async () => {
    try {
      console.log('Loading public social feed...');
      const activitiesData = await activitiesAPI.getPublicActivities();
      console.log('Loaded activities:', activitiesData?.length);
      
      setActivities(activitiesData || []);
      
      // Cargar comentarios y likes para cada actividad
      const commentsData = {};
      const likesData = {};
      
      for (const activity of activitiesData || []) {
        const activityComments = await commentsAPI.getActivityComments(activity.id);
        const activityPhotos = await photosAPI.getActivityPhotos(activity.id);
        
        commentsData[activity.id] = activityComments;
        likesData[activity.id] = {
          count: (activityComments?.length || 0) * 2 + Math.floor(Math.random() * 15),
          liked: false
        };
      }
      
      setComments(commentsData);
      setLikes(likesData);
      
    } catch (error) {
      console.error('Error loading social feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (activityId) => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      // Call API to like/unlike activity
      const result = await activitiesAPI.likeActivity(activityId, currentUser.id);
      
      setLikes(prev => ({
        ...prev,
        [activityId]: {
          count: result.totalLikes,
          liked: result.liked
        }
      }));
      
      console.log(`User ${currentUser?.first_name} ${result.liked ? 'liked' : 'unliked'} activity ${activityId}`);
    } catch (error) {
      console.error('Error liking activity:', error);
    }
  };

  const handleComment = async (activityId) => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      const comment = {
        id: Date.now(),
        activity_id: activityId,
        user_id: currentUser.id,
        content: newComment,
        created_at: new Date().toISOString(),
        user: currentUser,
        likes: 0
      };
      
      setComments(prev => ({
        ...prev,
        [activityId]: [...(prev[activityId] || []), comment]
      }));
      
      setNewComment('');
      
      // Guardar en dataStore
      await commentsAPI.addComment(activityId, currentUser.id, newComment);
      console.log('Comment added successfully');
      
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = (activity) => {
    if (navigator.share) {
      navigator.share({
        title: `${activity.title} - CASIRA`,
        text: activity.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${activity.title}: ${activity.description} - ${window.location.href}`);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Hace un momento';
    if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)} horas`;
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando experiencia social CASIRA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CASIRA Social
                </h1>
                <p className="text-xs text-gray-500">Conoce nuestras actividades</p>
              </div>
            </div>
            
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <img 
                  src={currentUser.avatar_url || '/grupo-canadienses.jpg'} 
                  alt={currentUser.first_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser.first_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Vista pública</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {currentUser ? 
                  `¡Hola ${currentUser.first_name}! 👋` : 
                  '¡Descubre el Impacto de CASIRA! 🌟'
                }
              </h2>
              <p className="text-blue-100">
                {currentUser ? 
                  'Explora todas nuestras actividades y únete a la conversación' :
                  'Ve lo que estamos haciendo y únete a nuestra comunidad'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{activities.length}</div>
              <div className="text-blue-100 text-sm">Actividades activas</div>
            </div>
          </div>
        </div>

        {/* Activities Feed */}
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Activity Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {activity.title?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{activity.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatTimeAgo(activity.created_at)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {activity.location || 'Guatemala'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {activity.current_volunteers || 0} voluntarios
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    activity.status === 'active' ? 'bg-green-100 text-green-800' :
                    activity.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status === 'active' ? '🟢 Activa' :
                     activity.status === 'planning' ? '🟡 En Planificación' : activity.status}
                  </span>
                </div>
              </div>

              {/* Activity Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-4 leading-relaxed">{activity.description}</p>
                
                {activity.detailed_description && (
                  <p className="text-gray-600 text-sm mb-4">{activity.detailed_description}</p>
                )}

                {/* Activity Image */}
                <div className="mb-4">
                  <img 
                    src={activity.image_url || '/grupo-canadienses.jpg'} 
                    alt={activity.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span>{likes[activity.id]?.count || 0} me gusta</span>
                    <span>{comments[activity.id]?.length || 0} comentarios</span>
                    <span>{Math.floor(Math.random() * 5) + 1} compartido</span>
                  </div>
                  <div className="text-xs">
                    Presupuesto: Q{activity.budget?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleLike(activity.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        likes[activity.id]?.liked ? 
                        'bg-red-50 text-red-600' : 
                        'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likes[activity.id]?.liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">Me gusta</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Comentar</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare(activity)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Compartir</span>
                    </button>
                  </div>
                  
                  {!currentUser && (
                    <button
                      onClick={() => setShowLoginPrompt(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium"
                    >
                      Unirse
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                {selectedActivity === activity.id && (
                  <div className="border-t border-gray-100 pt-4">
                    {/* Comment Input */}
                    {currentUser ? (
                      <div className="flex space-x-3 mb-4">
                        <img 
                          src={currentUser.avatar_url || '/grupo-canadienses.jpg'} 
                          alt={currentUser.first_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 flex space-x-2">
                          <input
                            type="text"
                            placeholder="Escribe un comentario..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(activity.id)}
                          />
                          <button
                            onClick={() => handleComment(activity.id)}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                        <p className="text-gray-600 mb-3">¡Únete para comentar y participar!</p>
                        <button
                          onClick={() => setShowLoginPrompt(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Crear cuenta gratis
                        </button>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3">
                      {(comments[activity.id] || []).map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <img 
                            src={comment.user?.avatar_url || '/grupo-canadienses.jpg'} 
                            alt={comment.user?.first_name || 'Usuario'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <div className="font-medium text-sm text-gray-900">
                                {comment.user?.first_name} {comment.user?.last_name}
                              </div>
                              <div className="text-gray-700">{comment.content}</div>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>{formatTimeAgo(comment.created_at)}</span>
                              <button className="hover:text-blue-600">Me gusta</button>
                              <button className="hover:text-blue-600">Responder</button>
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

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay actividades por el momento</h3>
            <p className="text-gray-500">¡Pronto compartiremos nuevos proyectos increíbles!</p>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <Smile className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¡Únete a CASIRA!
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu cuenta gratuita para comentar, dar me gusta y ser parte de esta increíble comunidad de cambio social.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Crear cuenta gratis
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSocialView;