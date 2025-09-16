import React, { useState } from 'react';
import {
  Heart, MessageCircle, MapPin, Calendar, Clock, Users, Share2,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { useActivityRegistrations } from '../lib/hooks/useActivityRegistrations.js';

const ActivityCard = ({
  activity,
  isLiked,
  likesCount,
  comments,
  onLike,
  onComment,
  onJoin,
  user
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Hook para manejar suscripciones en tiempo real
  const {
    volunteerCount,
    isUserRegistered,
    isUserPending,
    getUserRegistrationStatus,
    canRegister,
    registerForActivity,
    isRegistering
  } = useActivityRegistrations(activity?.id);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onComment(activity.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleJoinActivity = async () => {
    if (!user) {
      alert('Debes iniciar sesión para unirte a una actividad');
      return;
    }

    try {
      await registerForActivity(user, 'Solicito unirme a esta actividad');

      if (onJoin) {
        onJoin(activity);
      }
    } catch (error) {
      console.error('Error joining activity:', error);
      alert(error.message || 'Error al solicitar unirse a la actividad');
    }
  };

  // Función para obtener el estado visual del botón de unirse
  const getJoinButtonState = () => {
    if (!user) {
      return { text: 'Iniciar Sesión', disabled: false, variant: 'primary' };
    }

    const userId = user.supabase_id || user.id;
    const status = getUserRegistrationStatus(userId);

    switch (status) {
      case 'approved':
        return { text: 'Ya Inscrito', disabled: true, variant: 'success', icon: CheckCircle };
      case 'pending':
        return { text: 'Solicitud Pendiente', disabled: true, variant: 'warning', icon: AlertCircle };
      case 'rejected':
        return { text: 'Solicitud Rechazada', disabled: true, variant: 'danger', icon: XCircle };
      default:
        if (!canRegister(userId)) {
          return { text: 'Sin Cupos', disabled: true, variant: 'disabled' };
        }
        return { text: 'Unirme', disabled: false, variant: 'primary' };
    }
  };

  const joinButtonState = getJoinButtonState();

  const description = activity.description || activity.content || '';
  const truncatedDescription = description.length > 120 
    ? description.substring(0, 120) + '...'
    : description;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-mobile">
      {/* Image */}
      <div className="relative h-48 sm:h-56">
        <img 
          src={activity.image_url || '/placeholder-activity.jpg'} 
          alt={activity.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          <span className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
            Disponible
          </span>
        </div>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="padding-mobile">
        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {activity.title}
        </h3>
        
        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-600 text-mobile">
            {showFullDescription || !truncatedDescription.includes('...') 
              ? description 
              : truncatedDescription
            }
          </p>
          {truncatedDescription.includes('...') && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 text-sm font-medium mt-1 hover:text-blue-700 transition-colors"
            >
              {showFullDescription ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
        
        {/* Meta Information */}
        <div className="space-y-2 mb-4 text-sm text-gray-500">
          {activity.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          
          {activity.date && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{new Date(activity.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          )}
          
          {activity.time && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{activity.time}</span>
            </div>
          )}
          
          {(activity.volunteers_needed || activity.max_volunteers) && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {volunteerCount || 0} de {activity.max_volunteers || activity.volunteers_needed || 'ilimitados'} voluntarios
              </span>
              {activity.max_volunteers && volunteerCount >= activity.max_volunteers && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Completo
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(activity.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all btn-touch ${
                isLiked 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart 
                className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-sm font-medium">{likesCount || 0}</span>
            </button>
            
            {/* Comments Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all btn-touch"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{comments?.length || 0}</span>
            </button>
            
            {/* Share Button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: activity.title,
                    text: activity.description,
                    url: window.location.href
                  });
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all btn-touch"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          
          {/* Join Button */}
          <button
            onClick={joinButtonState.disabled ? undefined : handleJoinActivity}
            disabled={joinButtonState.disabled || isRegistering}
            className={`px-6 py-2 rounded-full font-semibold transition-all btn-touch focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-2 ${
              joinButtonState.variant === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : joinButtonState.variant === 'warning'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : joinButtonState.variant === 'danger'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : joinButtonState.variant === 'disabled'
                ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
            } ${(joinButtonState.disabled || isRegistering) ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            {joinButtonState.icon && <joinButtonState.icon className="h-4 w-4" />}
            <span>{isRegistering ? 'Enviando...' : joinButtonState.text}</span>
          </button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 pt-4">
            {/* Comment Form */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="flex space-x-3">
                  <img
                    src={user.avatar_url || '/default-avatar.jpg'}
                    alt={user.first_name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors btn-touch"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            )}
            
            {/* Comments List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments?.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={comment.id || index} className="flex space-x-3">
                    <img
                      src={comment.user?.avatar_url || '/default-avatar.jpg'}
                      alt={comment.user?.first_name || 'Usuario'}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-2xl px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {comment.user?.first_name || 'Usuario'} {comment.user?.last_name || ''}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {comment.created_at && new Date(comment.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No hay comentarios aún. ¡Sé el primero en comentar!
                </p>
              )}
            </div>
            
            {/* Show/Hide Comments Toggle */}
            <button
              onClick={() => setShowComments(false)}
              className="flex items-center justify-center w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              Ocultar comentarios
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;