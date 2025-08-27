import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, ThumbsUp, Camera, MapPin, Clock, Users, 
  Bell, Settings, LogOut, Plus, Send, MoreHorizontal, UserPlus, CheckCircle
} from 'lucide-react';
import { 
  usersAPI, volunteersAPI, activitiesAPI, categoriesAPI, 
  commentsAPI, photosAPI, dataStore 
} from '../lib/api.js';

const SocialDashboard = ({ user, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for comments and photos
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadSocialData();
    
    // Subscribe to store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadSocialData();
    });
    
    return unsubscribe;
  }, [user.id]);

  const loadSocialData = async () => {
    try {
      // Load all data for social feed
      const [allActivities, allComments, allPhotos, userRegistrations] = await Promise.all([
        activitiesAPI.getPublicActivities(),
        Promise.resolve(dataStore.comments || []),
        Promise.resolve(dataStore.photos || []),
        volunteersAPI.getUserRegistrations(user.id)
      ]);

      console.log('SocialDashboard: Loaded activities count:', allActivities.length);
      console.log('SocialDashboard: Activities:', allActivities.map(a => a.title));
      setActivities(allActivities);
      
      // Filter user's registered activities
      const userActivityIds = userRegistrations.map(r => r.activity_id);
      const registeredActivities = allActivities.filter(a => userActivityIds.includes(a.id));
      setMyActivities(registeredActivities);

      // Create social posts from activities, comments and photos
      const socialPosts = [];

      // Activity posts
      allActivities.forEach(activity => {
        socialPosts.push({
          id: `activity_${activity.id}`,
          type: 'activity',
          user: { first_name: 'CASIRA', last_name: 'Connect', avatar_url: '/logo.png' },
          content: activity.description,
          activity: activity,
          created_at: activity.created_at,
          likes: Math.floor(Math.random() * 50) + 10,
          comments: allComments.filter(c => c.activity_id === activity.id).length,
          shares: Math.floor(Math.random() * 20) + 5
        });
      });

      // Photo posts
      allPhotos.forEach(photo => {
        const photoUser = dataStore.users?.find(u => u.id === photo.user_id);
        const activity = allActivities.find(a => a.id === photo.activity_id);
        socialPosts.push({
          id: `photo_${photo.id}`,
          type: 'photo',
          user: photoUser || { first_name: 'Usuario', last_name: 'Anónimo', avatar_url: '/grupo-canadienses.jpg' },
          content: photo.caption,
          photo: photo,
          activity: activity,
          created_at: photo.created_at,
          likes: photo.likes || 0,
          comments: Math.floor(Math.random() * 10),
          shares: Math.floor(Math.random() * 5)
        });
      });

      // Comment posts (recent comments as posts)
      allComments.forEach(comment => {
        const commentUser = dataStore.users?.find(u => u.id === comment.user_id);
        const activity = allActivities.find(a => a.id === comment.activity_id);
        socialPosts.push({
          id: `comment_${comment.id}`,
          type: 'comment',
          user: commentUser || { first_name: 'Usuario', last_name: 'Anónimo', avatar_url: '/grupo-canadienses.jpg' },
          content: comment.content,
          activity: activity,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          comments: Math.floor(Math.random() * 5),
          shares: 0
        });
      });

      // Sort by date
      socialPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(socialPosts);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading social data:', error);
      setIsLoading(false);
    }
  };

  const handleJoinActivity = async (activityId) => {
    try {
      // Check visitor limitations
      if (user.role === 'visitor') {
        const userRegistrations = await volunteersAPI.getUserRegistrations(user.id);
        if (userRegistrations.length >= 2) {
          alert('Los visitantes solo pueden unirse a máximo 2 actividades. Cambia a rol Voluntario para unirte a más actividades.');
          return;
        }
      }

      await volunteersAPI.registerForActivity(user.id, activityId, {
        notes: `Solicitud de ${user.first_name} ${user.last_name} (${user.role})`,
        skills_offered: user.skills || [],
        role: user.role
      });
      
      // Different notification messages for visitors vs volunteers
      const notificationMessage = user.role === 'visitor' 
        ? `${user.first_name} ${user.last_name} (Visitante) quiere asistir a la actividad`
        : `${user.first_name} ${user.last_name} (Voluntario) solicita unirse a la actividad`;

      // Add notification for admin
      const newNotification = {
        id: Date.now(),
        type: user.role === 'visitor' ? 'visitor_attendance' : 'volunteer_request',
        user_id: user.id,
        activity_id: activityId,
        message: notificationMessage,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      // Store notification for admin
      if (!dataStore.notifications) {
        dataStore.notifications = [];
      }
      dataStore.notifications.push(newNotification);
      dataStore.saveToStorage();
      dataStore.notify();

      await loadSocialData();
      alert('¡Solicitud enviada! El administrador revisará tu solicitud.');
    } catch (error) {
      alert(error.message || 'Error al solicitar unirse a la actividad');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      // Create a social post
      const post = {
        id: `user_post_${Date.now()}`,
        type: 'user_post',
        user: user,
        content: newPost,
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0
      };
      
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    } catch (error) {
      alert('Error al crear publicación');
    }
  };

  const handleLikePost = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: (post.likes || 0) + 1 }
        : post
    ));
  };

  // Handle comment functionality
  const handleToggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      // Check if user has permission to comment
      if (user.role === 'visitor') {
        alert('Los visitantes no pueden comentar. Cambia a rol Voluntario para comentar.');
        return;
      }

      // For activity posts, use the activity_id to add comment
      const post = posts.find(p => p.id === postId);
      if (post && post.activity) {
        await commentsAPI.addComment(post.activity.id, user.id, commentText);
        
        // Update posts to reflect new comment count
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, comments: (p.comments || 0) + 1 }
            : p
        ));

        // Clear comment input
        setCommentInputs(prev => ({
          ...prev,
          [postId]: ''
        }));

        // Reload data to get the new comment
        loadSocialData();
      }
    } catch (error) {
      alert('Error al agregar comentario: ' + error.message);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  // Handle photo upload functionality
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if user has permission to upload photos
      if (user.role === 'visitor') {
        alert('Los visitantes no pueden subir fotos. Cambia a rol Voluntario para subir fotos.');
        e.target.value = ''; // Clear file input
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB permitido.');
        e.target.value = '';
        return;
      }

      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (activityId) => {
    if (!selectedPhoto || !photoPreview) return;

    try {
      setUploadingPhoto(true);
      
      // Upload photo using photosAPI
      await photosAPI.uploadPhoto({
        activity_id: activityId,
        user_id: user.id,
        image_data: photoPreview,
        caption: `Foto subida por ${user.first_name} ${user.last_name}`,
        file_name: selectedPhoto.name
      });

      // Clear photo states
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      // Reload social data to show new photo
      loadSocialData();
      
      alert('Foto subida exitosamente');
    } catch (error) {
      alert('Error al subir foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhotoUpload = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    // Clear file input if it exists
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando feed social...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Facebook-style Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.png" alt="CASIRA" className="h-8 w-auto mr-2" />
              <h1 className="text-xl font-bold text-blue-600">CASIRA Social</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4">
              <input
                type="text"
                placeholder="Buscar actividades, personas..."
                className="w-full px-4 py-2 bg-gray-100 rounded-full border-none outline-none focus:bg-white focus:shadow-md transition-all"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length || ''}
                </span>
              </button>
              
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatar_url || '/grupo-canadienses.jpg'}
                  alt={user.first_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user.first_name} {user.last_name}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - User Info & My Activities */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatar_url || '/grupo-canadienses.jpg'}
                    alt={user.first_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📍 {user.location || 'Guatemala'}</p>
                  <p>⏱️ {user.total_hours || 0} horas contribuidas</p>
                  <p>🎯 {myActivities.length} actividades</p>
                </div>
              </div>

              {/* My Activities */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Mis Actividades
                </h3>
                <div className="space-y-2">
                  {myActivities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img
                          src={activity.image_url || '/grupo-canadienses.jpg'}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.location}</p>
                      </div>
                    </div>
                  ))}
                  {myActivities.length > 3 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      +{myActivities.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Create Post */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatar_url || '/grupo-canadienses.jpg'}
                    alt={user.first_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={`¿Qué estás pensando, ${user.first_name}?`}
                      className="w-full px-4 py-2 bg-gray-100 rounded-full resize-none outline-none focus:bg-white focus:shadow-md transition-all"
                      rows={1}
                    />
                  </div>
                </div>
                
                {/* Photo Preview */}
                {photoPreview && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Vista previa de foto:</h4>
                      <button
                        onClick={handleCancelPhotoUpload}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <div className="flex space-x-3">
                      {myActivities.length > 0 ? (
                        <select 
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              handlePhotoUpload(parseInt(e.target.value));
                            }
                          }}
                        >
                          <option value="">Seleccionar actividad para subir foto</option>
                          {myActivities.map(activity => (
                            <option key={activity.id} value={activity.id}>
                              {activity.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-gray-500 flex-1">
                          Debes unirte a una actividad para subir fotos
                        </p>
                      )}
                      {uploadingPhoto && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span className="text-sm text-blue-600">Subiendo...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Ubicación</span>
                    </button>
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publicar
                  </button>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow">
                    {/* Post Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.user?.avatar_url || '/grupo-canadienses.jpg'}
                            alt={post.user?.first_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {post.user?.first_name} {post.user?.last_name}
                            </h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                              {post.activity && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{post.activity.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="p-1 rounded-full hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <p className="text-gray-800">{post.content}</p>
                      </div>
                    </div>

                    {/* Post Image */}
                    {post.photo && (
                      <div className="px-4 pb-3">
                        <img
                          src={post.photo.url}
                          alt={post.photo.caption}
                          className="w-full rounded-lg object-cover max-h-96"
                        />
                      </div>
                    )}

                    {/* Activity Card */}
                    {post.type === 'activity' && post.activity && (
                      <div className="px-4 pb-3">
                        <div className="border rounded-lg overflow-hidden">
                          <img
                            src={post.activity.image_url || '/grupo-canadienses.jpg'}
                            alt={post.activity.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h5 className="font-semibold text-gray-900 mb-2">{post.activity.title}</h5>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {post.activity.location}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {post.activity.current_volunteers || 0}/{post.activity.max_volunteers || '∞'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="px-4 py-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{post.likes || 0} Me gusta</span>
                        <div className="flex space-x-4">
                          <span>{post.comments || 0} comentarios</span>
                          <span>{post.shares || 0} compartir</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex justify-around">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Me gusta</span>
                        </button>
                        <button 
                          onClick={() => handleToggleComments(post.id)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-green-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Comentar</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-purple-600">
                          <Share2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Compartir</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        {/* Comment Input */}
                        <div className="flex space-x-3 mb-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.first_name?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              placeholder={user.role === 'visitor' ? 'Los visitantes no pueden comentar' : 'Escribe un comentario...'}
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id);
                                }
                              }}
                              disabled={user.role === 'visitor'}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            {user.role !== 'visitor' && (
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Existing Comments Display */}
                        {post.activity && dataStore.comments && (
                          <div className="space-y-3">
                            {dataStore.comments
                              .filter(comment => comment.activity_id === post.activity.id)
                              .slice(0, 3) // Show only first 3 comments
                              .map(comment => {
                                const commentUser = dataStore.users?.find(u => u.id === comment.user_id);
                                return (
                                  <div key={comment.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-7 h-7 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                        {commentUser?.first_name?.charAt(0) || 'A'}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                        <div className="text-sm font-medium text-gray-900">
                                          {commentUser ? `${commentUser.first_name} ${commentUser.last_name}` : 'Usuario Anónimo'}
                                        </div>
                                        <div className="text-sm text-gray-700">{comment.content}</div>
                                      </div>
                                      <div className="flex items-center space-x-4 mt-1 px-3">
                                        <button className="text-xs text-gray-500 hover:text-blue-600">
                                          Me gusta ({comment.likes || 0})
                                        </button>
                                        <span className="text-xs text-gray-400">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            {post.activity && dataStore.comments?.filter(c => c.activity_id === post.activity.id).length > 3 && (
                              <button className="text-sm text-blue-600 hover:text-blue-800 px-3">
                                Ver más comentarios ({dataStore.comments.filter(c => c.activity_id === post.activity.id).length - 3} más)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Available Activities */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Quick Join Activities */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <UserPlus className="h-4 w-4 mr-2 text-green-600" />
                    {user.role === 'visitor' ? 'Eventos para Asistir' : 'Únete Rápido'}
                  </h3>
                  <button 
                    onClick={() => {
                      console.log('Refreshing social data...');
                      loadSocialData();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Actualizar actividades"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {/* Visitor Limitations Info */}
                {user.role === 'visitor' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{myActivities.length}</span>
                        </div>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium text-blue-800">
                          Límite de Visitante: {myActivities.length}/2 eventos
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>• Solo puedes asistir a 2 eventos</p>
                      <p>• No puedes comentar ni subir fotos</p>
                      <p>• Cambia a Voluntario para acceso completo</p>
                    </div>
                    {myActivities.length >= 2 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-700 font-medium">
                          ⚠️ Has alcanzado tu límite de eventos
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Volunteer Information */}
                {user.role === 'volunteer' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <p className="text-sm font-medium text-green-800">Acceso Completo de Voluntario</p>
                    </div>
                    <div className="text-xs text-green-600 space-y-1">
                      <p>• Únete a actividades ilimitadas</p>
                      <p>• Comenta y sube fotos</p>
                      <p>• Participa activamente</p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {activities
                    .filter(a => !myActivities.find(ma => ma.id === a.id))
                    .slice(0, 5)
                    .map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden">
                            <img
                              src={activity.image_url || '/grupo-canadienses.jpg'}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {activity.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">{activity.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {activity.current_volunteers || 0}/{activity.max_volunteers || '∞'} vol.
                          </div>
                          <button
                            onClick={() => handleJoinActivity(activity.id)}
                            disabled={user.role === 'visitor' && myActivities.length >= 2}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              user.role === 'visitor' && myActivities.length >= 2
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {user.role === 'visitor' 
                              ? (myActivities.length >= 2 ? 'Límite alcanzado' : 'Asistir') 
                              : 'Unirme'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Activity Categories */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Categorías</h3>
                <div className="space-y-2">
                  {(dataStore.categories || []).map((category) => (
                    <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {activities.filter(a => a.category_id === category.id).length} actividades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;