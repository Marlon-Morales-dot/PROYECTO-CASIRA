import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Users, MapPin, Calendar, Clock, Send, Star, Eye, ThumbsUp, Smile, ArrowLeft, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { activitiesAPI, photosAPI, dataStore, commentsAPI } from '../lib/api.js';
import OptimizedImage from './OptimizedImage.jsx';

const PublicSocialView = ({ currentUser = null }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [publishingComment, setPublishingComment] = useState(null);
  const [commentsToShow, setCommentsToShow] = useState({}); // Track how many comments to show per activity
  const [commentLikes, setCommentLikes] = useState({}); // Track comment likes
  const [commentReplies, setCommentReplies] = useState({}); // Track comment replies visibility
  const [replyInputs, setReplyInputs] = useState({}); // Track reply input text

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async (page = 0, append = false) => {
    try {
      setIsLoading(!append);
      console.log('Loading public social feed...');

      // Use optimized API with pagination and minimal columns
      const activitiesData = await activitiesAPI.getPublicActivities(page, 8);
      console.log('Loaded activities:', activitiesData?.length);

      if (activitiesData?.length < 8) {
        setHasMoreActivities(false);
      }

      if (append) {
        setActivities(prev => [...prev, ...(activitiesData || [])]);
      } else {
        setActivities(activitiesData || []);
      }

      // Generate likes data without API calls
      const likesData = {};
      const commentsData = {};

      // Load comment counts for each activity
      for (const activity of activitiesData || []) {
        likesData[activity.id] = {
          count: Math.floor(Math.random() * 15) + 5,
          liked: false
        };

        // Load actual comment count from API (just count, not full comments)
        try {
          const activityComments = await commentsAPI.getActivityComments(activity.id, 0, 50);
          commentsData[activity.id] = activityComments || [];
          console.log(`📊 Comments for activity ${activity.id}:`, activityComments?.length || 0);
        } catch (error) {
          console.error(`❌ Error loading comments for activity ${activity.id}:`, error);
          commentsData[activity.id] = [];
        }
      }

      if (append) {
        setLikes(prev => ({ ...prev, ...likesData }));
        setComments(prev => ({ ...prev, ...commentsData }));
      } else {
        setLikes(likesData);
        setComments(commentsData);
      }

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

  const handleToggleComments = async (activityId) => {
    console.log('🔄 PUBLIC SOCIAL VIEW - TOGGLE COMMENTS:', {
      activityId,
      selectedActivity,
      hasComments: !!comments[activityId],
      commentsCount: comments[activityId]?.length || 0,
      currentUser: currentUser?.email
    });

    if (selectedActivity === activityId) {
      console.log('📖 PUBLIC SOCIAL VIEW: Closing comments for activity:', activityId);
      setSelectedActivity(null);
      return;
    }

    console.log('📖 PUBLIC SOCIAL VIEW: Opening comments for activity:', activityId);
    setSelectedActivity(activityId);

    // Always reload comments to show latest (including just posted ones)
    try {
      console.log('📖 PUBLIC SOCIAL VIEW: Loading comments for activity:', activityId);
      const activityComments = await commentsAPI.getActivityComments(activityId, 0, 15);
      console.log('✅ PUBLIC SOCIAL VIEW: Loaded comments:', {
        count: activityComments?.length || 0,
        comments: activityComments,
        activityId: activityId
      });
      setComments(prev => {
        const newComments = {
          ...prev,
          [activityId]: activityComments || []
        };
        console.log('📝 PUBLIC SOCIAL VIEW: Updated comments state:', newComments);
        return newComments;
      });
    } catch (error) {
      console.error('❌ PUBLIC SOCIAL VIEW: Error loading comments:', error);
      // Set empty array to prevent infinite loading
      setComments(prev => ({
        ...prev,
        [activityId]: []
      }));
    }
  };

  const handleComment = async (activityId) => {
    if (!currentUser) {
      console.log('❌ PUBLIC SOCIAL VIEW: No current user, showing login prompt');
      setShowLoginPrompt(true);
      return;
    }

    if (!newComment.trim()) {
      console.log('❌ PUBLIC SOCIAL VIEW: Empty comment, ignoring');
      return;
    }

    const commentId = Date.now();
    setPublishingComment(activityId);

    try {
      console.log('💬 PUBLIC SOCIAL VIEW: Publishing comment:', {
        activityId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        content: newComment.substring(0, 50),
        commentId: commentId
      });

      // Check user permissions
      const userRole = currentUser.role || 'visitor';
      if (userRole === 'visitor' && !currentUser.email) {
        setShowLoginPrompt(true);
        return;
      }

      // Optimistic update - add comment immediately to UI
      const optimisticComment = {
        id: commentId,
        activity_id: activityId,
        user_id: currentUser.id,
        content: newComment,
        created_at: new Date().toISOString(),
        author: {
          id: currentUser.id,
          first_name: currentUser.first_name || currentUser.firstName,
          last_name: currentUser.last_name || currentUser.lastName,
          avatar_url: currentUser.avatar_url
        }
      };

      setComments(prev => ({
        ...prev,
        [activityId]: [...(prev[activityId] || []), optimisticComment]
      }));

      setNewComment('');

      // Save to database (with proper user ID resolution)
      const savedComment = await commentsAPI.addComment(activityId, currentUser.id, newComment);
      console.log('✅ Comment saved successfully:', savedComment);

      // Reload comments to show the real saved comment
      try {
        const updatedComments = await commentsAPI.getActivityComments(activityId, 0, 15);
        setComments(prev => ({
          ...prev,
          [activityId]: updatedComments || []
        }));
        console.log('✅ Comments reloaded after save');
      } catch (reloadError) {
        console.error('❌ Error reloading comments:', reloadError);
      }

    } catch (error) {
      console.error('❌ Error adding comment:', error);

      // Remove optimistic comment on error
      setComments(prev => ({
        ...prev,
        [activityId]: (prev[activityId] || []).filter(c => c.id !== commentId)
      }));

      alert('Error al publicar comentario. Inténtalo de nuevo.');
    } finally {
      setPublishingComment(null);
    }
  };

  // Handle "Ver más comentarios" functionality
  const handleLoadMoreComments = (activityId) => {
    setCommentsToShow(prev => ({
      ...prev,
      [activityId]: (prev[activityId] || 3) + 10 // Show 10 more comments
    }));
    console.log(`📖 Loading more comments for activity ${activityId}`);
  };

  // Handle "Ver menos comentarios" functionality
  const handleShowLessComments = (activityId) => {
    setCommentsToShow(prev => ({
      ...prev,
      [activityId]: 3 // Reset to show only 3 comments
    }));
    console.log(`📖 Showing less comments for activity ${activityId}`);
  };

  // Handle comment like functionality
  const handleCommentLike = (commentId) => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        liked: !prev[commentId]?.liked,
        count: (prev[commentId]?.count || 0) + (!prev[commentId]?.liked ? 1 : -1)
      }
    }));
    console.log(`👍 Toggled like for comment ${commentId}`);
  };

  // Handle comment reply functionality
  const handleToggleReply = (commentId) => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    setCommentReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    console.log(`💬 Toggled reply for comment ${commentId}`);
  };

  // Handle reply input change
  const handleReplyInputChange = (commentId, value) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  // Function to organize comments hierarchically
  const organizeComments = (comments) => {
    const mainComments = [];
    const replies = {};

    // Separate main comments from replies
    comments.forEach(comment => {
      if (comment.content?.startsWith('@') && comment.content.includes(':')) {
        // This is a reply - extract parent info
        const replyMatch = comment.content.match(/@([^:]+):\s*(.+)/);
        if (replyMatch) {
          const [, mentionedUser, replyText] = replyMatch;

          // Find parent comment by looking for the mentioned user
          const parentComment = comments.find(c =>
            !c.content?.startsWith('@') &&
            c.author &&
            `${c.author.first_name} ${c.author.last_name}` === mentionedUser.trim()
          );

          if (parentComment) {
            if (!replies[parentComment.id]) {
              replies[parentComment.id] = [];
            }
            replies[parentComment.id].push({
              ...comment,
              replyText,
              mentionedUser
            });
          } else {
            // If we can't find parent, treat as main comment
            mainComments.push(comment);
          }
        } else {
          mainComments.push(comment);
        }
      } else {
        // This is a main comment
        mainComments.push(comment);
      }
    });

    return { mainComments, replies };
  };

  // Handle submit reply
  const handleSubmitReply = async (commentId, activityId, parentComment) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText || !currentUser) return;

    try {
      console.log(`📤 Submitting reply to comment ${commentId}: ${replyText}`);

      // Find the parent comment to get author info
      const parentAuthor = parentComment?.author || { first_name: 'Usuario', last_name: 'Anónimo' };
      const replyContent = `@${parentAuthor.first_name} ${parentAuthor.last_name}: ${replyText}`;

      // Add reply with parent reference
      await commentsAPI.addComment(activityId, currentUser.id, replyContent);

      // Clear reply input and hide reply box
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setCommentReplies(prev => ({ ...prev, [commentId]: false }));

      // Reload comments
      const updatedComments = await commentsAPI.getActivityComments(activityId, 0, 50);
      setComments(prev => ({
        ...prev,
        [activityId]: updatedComments || []
      }));

    } catch (error) {
      console.error('❌ Error submitting reply:', error);
      alert('Error al enviar respuesta: ' + error.message);
    }
  };

  const loadMoreActivities = async () => {
    if (!hasMoreActivities) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadSocialFeed(nextPage, true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden">
                <img
                  src="/logo.png"
                  alt="CASIRA"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">Menú Principal</span>
              </button>

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
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white/70 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-4 py-3 overflow-x-auto">
            <Link
              to="/"
            >
              Inicio
            </Link>
            <Link
              to="/activities"
              className="px-2 sm:px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium bg-sky-50 text-sky-600 text-sm sm:text-base whitespace-nowrap"
            >
              Actividades
            </Link>
            <Link
              to="/social"
              className="px-2 sm:px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              Social
            </Link>
            {!currentUser && (
              <Link
                to="/login"
                className="px-2 sm:px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
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
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl hover:bg-white/95 transition-all duration-300">
              {/* Activity Header */}
              <div className="p-6 border-b border-white/30">
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
                  <OptimizedImage
                    src={activity.image_url}
                    alt={activity.title}
                    className="w-full h-64 object-cover rounded-lg"
                    quality="medium"
                    lazy={true}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-white/30">
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
                      onClick={() => handleToggleComments(activity.id)}
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
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium"
                    >
                      Unirse
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                {selectedActivity === activity.id && (
                  <div className="border-t border-white/30 pt-4">
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
                            disabled={publishingComment === activity.id}
                            className={`p-2 text-white rounded-full transition-colors ${
                              publishingComment === activity.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {publishingComment === activity.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4 text-center border border-white/40">
                        <div className="flex items-center justify-center mb-2">
                          <Eye className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">Vista como visitante</span>
                        </div>
                        <p className="text-gray-600 mb-3">¡Únete como voluntario para comentar y participar!</p>
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
                      {/* Debug info */}
                      <div className="text-xs text-gray-400 mb-2">
                        Comentarios cargados: {(comments[activity.id] || []).length}
                      </div>

                      {(comments[activity.id] || []).length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay comentarios aún</p>
                          <p className="text-xs">¡Sé el primero en comentar!</p>
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const allActivityComments = comments[activity.id] || [];
                            const { mainComments, replies } = organizeComments(allActivityComments);
                            const commentsLimit = commentsToShow[activity.id] || 3;
                            const visibleMainComments = mainComments.slice(0, commentsLimit);

                            return visibleMainComments.map((comment) => (
                              <div key={comment.id} className="flex space-x-3 mb-3">
                                <img
                                  src={comment.author?.avatar_url || '/grupo-canadienses.jpg'}
                                  alt={comment.author?.first_name || 'Usuario'}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/40">
                                    <div className="font-medium text-sm text-gray-900 flex items-center justify-between">
                                      <span>{comment.author?.first_name} {comment.author?.last_name}</span>
                                      {comment.author?.role === 'admin' && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Admin</span>
                                      )}
                                      {comment.author?.role === 'volunteer' && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Voluntario</span>
                                      )}
                                    </div>
                                    <div className="text-gray-700">{comment.content}</div>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    <span>{formatTimeAgo(comment.created_at)}</span>
                                    <button
                                      onClick={() => handleCommentLike(comment.id)}
                                      className={`hover:text-blue-600 flex items-center space-x-1 ${
                                        commentLikes[comment.id]?.liked ? 'text-blue-600 font-medium' : 'text-gray-500'
                                      }`}
                                    >
                                      <span>👍</span>
                                      <span>Me gusta ({(comment.likes || 0) + (commentLikes[comment.id]?.count || 0)})</span>
                                    </button>
                                    <button
                                      onClick={() => handleToggleReply(comment.id)}
                                      className={`hover:text-green-600 flex items-center space-x-1 ${
                                        commentReplies[comment.id] ? 'text-green-600 font-medium' : 'text-gray-500'
                                      }`}
                                    >
                                      <span>💬</span>
                                      <span>Responder</span>
                                    </button>
                                  </div>

                                  {/* Reply Input Box */}
                                  {commentReplies[comment.id] && currentUser && (
                                    <div className="mt-3 ml-3 pl-3 border-l-2 border-blue-200">
                                      <div className="flex space-x-2">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                          {currentUser.first_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 flex space-x-2">
                                          <input
                                            type="text"
                                            placeholder="Escribe una respuesta..."
                                            value={replyInputs[comment.id] || ''}
                                            onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                handleSubmitReply(comment.id, activity.id, comment);
                                              }
                                            }}
                                            className="flex-1 px-3 py-1 border border-gray-300 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                                          />
                                          <button
                                            onClick={() => handleSubmitReply(comment.id, activity.id, comment)}
                                            disabled={!replyInputs[comment.id]?.trim()}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            💬
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Nested Replies */}
                                  {replies[comment.id] && replies[comment.id].length > 0 && (
                                    <div className="ml-8 mt-3 space-y-2 border-l-2 border-sky-200 pl-4">
                                      {replies[comment.id].map(reply => {
                                        const replyUser = reply.author || { first_name: 'Usuario', last_name: 'Anónimo' };
                                        return (
                                          <div key={reply.id} className="flex space-x-2">
                                            <div className="flex-shrink-0">
                                              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                                {replyUser?.first_name?.charAt(0) || 'A'}
                                              </div>
                                            </div>
                                            <div className="flex-1">
                                              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/40">
                                                <div className="text-sm font-medium text-gray-900">
                                                  <span className="text-blue-600">@{reply.mentionedUser}</span>
                                                  <span className="text-gray-600 ml-1">{replyUser ? `${replyUser.first_name} ${replyUser.last_name}` : 'Usuario Anónimo'}</span>
                                                </div>
                                                <div className="text-sm text-gray-700 mt-1">{reply.replyText}</div>
                                              </div>
                                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                <span>{formatTimeAgo(reply.created_at)}</span>
                                                <button
                                                  onClick={() => handleCommentLike(reply.id)}
                                                  className={`hover:text-blue-600 flex items-center space-x-1 ${
                                                    commentLikes[reply.id]?.liked ? 'text-blue-600 font-medium' : 'text-gray-500'
                                                  }`}
                                                >
                                                  <span>👍</span>
                                                  <span>({(reply.likes || 0) + (commentLikes[reply.id]?.count || 0)})</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}

                          {/* Ver más/menos comentarios buttons */}
                          {(() => {
                            const allActivityComments = comments[activity.id] || [];
                            const { mainComments: allMainComments } = organizeComments(allActivityComments);
                            const commentsLimit = commentsToShow[activity.id] || 3;
                            const remainingComments = allMainComments.length - commentsLimit;
                            const isExpanded = commentsLimit > 3;

                            return allMainComments.length > 3 && (
                              <div className="flex space-x-2 mt-4 pt-2 border-t border-white/30">
                                {remainingComments > 0 && (
                                  <button
                                    onClick={() => handleLoadMoreComments(activity.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50/50 transition-all font-medium flex items-center space-x-1"
                                  >
                                    <span>Ver más comentarios ({remainingComments} más)</span>
                                    <span className="text-xs">▼</span>
                                  </button>
                                )}
                                {isExpanded && (
                                  <button
                                    onClick={() => handleShowLessComments(activity.id)}
                                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50/50 transition-all font-medium flex items-center space-x-1"
                                  >
                                    <span>Ver menos</span>
                                    <span className="text-xs">▲</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMoreActivities && activities.length > 0 && (
          <div className="text-center py-8">
            <button
              onClick={loadMoreActivities}
              className="bg-white/80 backdrop-blur-md text-blue-600 px-8 py-3 rounded-xl border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium shadow-lg"
            >
              Cargar más actividades
            </button>
          </div>
        )}

        {/* Empty State */}
        {activities.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay actividades por el momento</h3>
            <p className="text-gray-500">¡Pronto compartiremos nuevos proyectos increíbles!</p>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-md w-full p-6 shadow-2xl border border-white/20">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
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