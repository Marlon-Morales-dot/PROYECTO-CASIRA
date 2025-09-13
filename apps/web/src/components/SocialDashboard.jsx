import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, ThumbsUp, Camera, MapPin, Clock, Users, 
  Bell, Settings, LogOut, Plus, Send, MoreHorizontal, UserPlus, CheckCircle, Award, AlertCircle
} from 'lucide-react';
import { 
  usersAPI, volunteersAPI, activitiesAPI, categoriesAPI, 
  commentsAPI, photosAPI, dataStore 
} from '../lib/api.js';
import UniversalHeader from './UniversalHeader.jsx';
import VolunteerResponsibilities from './VolunteerResponsibilities.jsx';

const SocialDashboard = ({ user, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Si no hay usuario, mostrar loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
  
  // New state for comments and photos
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sendingComment, setSendingComment] = useState({});
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'responsibilities'

  useEffect(() => {
    loadSocialData();
    
    // Subscribe to store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadSocialData();
    });
    
    return unsubscribe;
  }, [user?.id]);

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

      // Usar el nuevo manejador de solicitudes de voluntarios
      const { createVolunteerRequest } = await import('../lib/volunteer-request-handler.js');
      
      const message = user.role === 'visitor' 
        ? `${user.first_name} ${user.last_name} (Visitante) quiere asistir a la actividad`
        : `${user.first_name} ${user.last_name} (Voluntario) solicita unirse como voluntario`;

      await createVolunteerRequest(user, activityId, message);
      
      // También mantener el registro local para compatibilidad
      await volunteersAPI.registerForActivity(user.id, activityId, {
        notes: `Solicitud de ${user.first_name} ${user.last_name} (${user.role})`,
        skills_offered: user.skills || [],
        role: user.role
      });
      
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

  const [likedPosts, setLikedPosts] = useState({});

  const handleLikePost = (postId) => {
    // Add visual feedback
    setLikedPosts(prev => ({ ...prev, [postId]: true }));
    
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: (post.likes || 0) + 1 }
        : post
    ));

    // Remove visual feedback after animation
    setTimeout(() => {
      setLikedPosts(prev => ({ ...prev, [postId]: false }));
    }, 600);
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
      // Visitors can now comment

      // Set sending state
      setSendingComment(prev => ({ ...prev, [postId]: true }));

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

        // Success feedback
        setSendingComment(prev => ({ ...prev, [postId]: 'success' }));
        setTimeout(() => {
          setSendingComment(prev => ({ ...prev, [postId]: false }));
        }, 1000);

        // Reload data to get the new comment
        loadSocialData();
      }
    } catch (error) {
      setSendingComment(prev => ({ ...prev, [postId]: 'error' }));
      setTimeout(() => {
        setSendingComment(prev => ({ ...prev, [postId]: false }));
      }, 2000);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gradient-to-r from-blue-600 to-blue-800 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderImage: "linear-gradient(45deg, #2563eb, #1d4ed8) 1" }}
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 font-medium"
          >
            Cargando feed social...
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full mx-auto mt-4 max-w-xs"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Enhanced Logo */}
            <div className="flex items-center">
              <img src="/logo.png" alt="CASIRA" className="h-8 w-auto mr-3" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  CASIRA Social
                </h1>
                <div className="h-1 bg-gradient-to-r from-blue-600 to-transparent rounded-full" />
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-lg mx-4 relative">
              <input
                type="text"
                placeholder="Buscar actividades, personas..."
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-50 rounded-full border border-blue-200 outline-none focus:bg-white focus:border-blue-400 focus:shadow-lg transition-all duration-300 placeholder-blue-400"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-full hover:bg-blue-50 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {notifications.length || ''}
                </motion.span>
              </motion.button>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2"
              >
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={user.avatar_url || '/grupo-canadienses.jpg'}
                  alt={user.first_name}
                  className="h-8 w-8 rounded-full object-cover border-2 border-blue-200 hover:border-blue-400 transition-colors"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user.first_name} {user.last_name}
                </span>
              </motion.div>

              <motion.button
                onClick={onLogout}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 text-gray-600 hover:text-red-600 transition-colors" />
              </motion.button>
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
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-blue-100"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    src={user.avatar_url || '/grupo-canadienses.jpg'}
                    alt={user.first_name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h3>
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full capitalize font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex items-center text-blue-600">
                    <span className="mr-2">📍</span>
                    <span className="text-gray-700">{user.location || 'Guatemala'}</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <span className="mr-2">⏱️</span>
                    <span className="text-gray-700">{user.total_hours || 0} horas contribuidas</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <span className="mr-2">🎯</span>
                    <span className="text-gray-700">{myActivities.length} actividades</span>
                  </div>
                </div>
              </motion.div>

              {/* My Activities */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-blue-100"
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Mis Actividades
                  </span>
                </h3>
                <div className="space-y-2">
                  {myActivities.slice(0, 3).map((activity, index) => (
                    <motion.div 
                      key={activity.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-blue-200">
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
                        <p className="text-xs text-blue-600">{activity.location}</p>
                      </div>
                    </motion.div>
                  ))}
                  {myActivities.length > 3 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-blue-500 text-center py-2 font-medium"
                    >
                      +{myActivities.length - 3} más
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Create Post */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <motion.img
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    src={user.avatar_url || '/grupo-canadienses.jpg'}
                    alt={user.first_name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div className="flex-1">
                    <motion.textarea
                      whileFocus={{ scale: 1.02 }}
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={`¿Qué estás pensando, ${user.first_name}?`}
                      className="w-full px-4 py-2 bg-gray-100 rounded-full resize-none outline-none focus:bg-white focus:shadow-md focus:border-blue-300 border-2 border-transparent transition-all"
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
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
                        >
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
                          />
                          <span className="text-sm text-blue-700 font-medium">Subiendo foto...</span>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="ml-3 h-1 bg-blue-600 rounded-full w-16"
                          />
                        </motion.div>
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
                  <motion.button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Publicar
                  </motion.button>
                </div>
              </motion.div>

              {/* Posts Feed */}
              <div className="space-y-6">
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.div 
                      key={post.id} 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.01, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
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
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="overflow-hidden rounded-lg"
                        >
                          <motion.img
                            src={post.photo.url}
                            alt={post.photo.caption}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            className="w-full object-cover max-h-96 cursor-pointer"
                          />
                        </motion.div>
                      </div>
                    )}

                    {/* Activity Card */}
                    {post.type === 'activity' && post.activity && (
                      <div className="px-4 pb-3">
                        <motion.div 
                          whileHover={{ 
                            scale: 1.02,
                            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.15)"
                          }}
                          className="border border-blue-100 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-white"
                        >
                          <motion.div className="overflow-hidden">
                            <motion.img
                              src={post.activity.image_url || '/grupo-canadienses.jpg'}
                              alt={post.activity.title}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                              className="w-full h-48 object-cover"
                            />
                          </motion.div>
                          <div className="p-4">
                            <h5 className="font-semibold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              {post.activity.title}
                            </h5>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center"
                              >
                                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                                {post.activity.location}
                              </motion.div>
                              <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center"
                              >
                                <Users className="h-4 w-4 mr-1 text-blue-600" />
                                {post.activity.current_volunteers || 0}/{post.activity.max_volunteers || '∞'}
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
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
                        <motion.button
                          onClick={() => handleLikePost(post.id)}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                          whileTap={{ scale: 0.95 }}
                          animate={likedPosts[post.id] ? { 
                            backgroundColor: "rgba(59, 130, 246, 0.15)",
                            color: "#2563eb"
                          } : {}}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 ${likedPosts[post.id] ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          <motion.div 
                            whileHover={{ rotate: 10 }}
                            animate={likedPosts[post.id] ? { 
                              scale: [1, 1.3, 1],
                              rotate: [0, 15, 0]
                            } : {}}
                            transition={{ duration: 0.6 }}
                          >
                            <ThumbsUp className={`h-4 w-4 ${likedPosts[post.id] ? 'fill-blue-600' : ''}`} />
                          </motion.div>
                          <span className="text-sm font-medium">Me gusta</span>
                          {likedPosts[post.id] && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full"
                            >
                              +1
                            </motion.span>
                          )}
                        </motion.button>
                        <motion.button 
                          onClick={() => handleToggleComments(post.id)}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-green-50 transition-all text-gray-600 hover:text-green-600"
                        >
                          <motion.div whileHover={{ rotate: -10 }}>
                            <MessageCircle className="h-4 w-4" />
                          </motion.div>
                          <span className="text-sm font-medium">Comentar</span>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(147, 51, 234, 0.1)" }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all text-gray-600 hover:text-purple-600"
                        >
                          <motion.div whileHover={{ rotate: 15 }}>
                            <Share2 className="h-4 w-4" />
                          </motion.div>
                          <span className="text-sm font-medium">Compartir</span>
                        </motion.button>
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
                              placeholder="Escribe un comentario..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id);
                                }
                              }}
                              disabled={false}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            {(
                              <motion.button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim() || sendingComment[post.id]}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={
                                  sendingComment[post.id] === 'success' ? {
                                    backgroundColor: "#10b981",
                                    scale: [1, 1.1, 1]
                                  } : sendingComment[post.id] === 'error' ? {
                                    backgroundColor: "#ef4444",
                                    scale: [1, 1.1, 1]
                                  } : {}
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {sendingComment[post.id] === true ? (
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                  />
                                ) : sendingComment[post.id] === 'success' ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="h-4 w-4"
                                  >
                                    ✓
                                  </motion.div>
                                ) : sendingComment[post.id] === 'error' ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="h-4 w-4"
                                  >
                                    ✗
                                  </motion.div>
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </motion.button>
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Available Activities */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Quick Join Activities */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-blue-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      {user.role === 'visitor' ? 'Eventos para Asistir' : 'Únete Rápido'}
                    </span>
                  </h3>
                  <motion.button 
                    onClick={() => {
                      console.log('Refreshing social data...');
                      loadSocialData();
                    }}
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                    title="Actualizar actividades"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </motion.button>
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
                <div className="space-y-4">
                  {activities
                    .filter(a => !myActivities.find(ma => ma.id === a.id))
                    .slice(0, 5)
                    .map((activity, index) => (
                      <motion.div 
                        key={activity.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.2)" }}
                        className="bg-white border-2 border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-200">
                            <img
                              src={activity.image_url || '/grupo-canadienses.jpg'}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                              {activity.title}
                            </h4>
                            <div className="flex items-center text-xs text-blue-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{activity.location}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(activity.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center bg-blue-50 px-2 py-1 rounded-full">
                              <Users className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="text-xs text-blue-700 font-medium">
                                {activity.current_volunteers || 0}/{activity.max_volunteers || '∞'}
                              </span>
                            </div>
                            {activity.urgency && (
                              <div className="flex items-center bg-orange-50 px-2 py-1 rounded-full">
                                <AlertCircle className="h-3 w-3 text-orange-600 mr-1" />
                                <span className="text-xs text-orange-700 font-medium">Urgente</span>
                              </div>
                            )}
                          </div>
                          <motion.button
                            onClick={() => handleJoinActivity(activity.id)}
                            disabled={user.role === 'visitor' && myActivities.length >= 2}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg ${
                              user.role === 'visitor' && myActivities.length >= 2
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                            }`}
                          >
                            {user.role === 'visitor' 
                              ? (myActivities.length >= 2 ? '🚫 Límite alcanzado' : '✋ Asistir') 
                              : '🤝 Unirme'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>

              {/* Activity Categories */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-blue-100"
              >
                <h3 className="font-semibold mb-4 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Categorías
                  </span>
                </h3>
                <div className="space-y-2">
                  {(dataStore.categories || []).map((category, index) => (
                    <motion.div 
                      key={category.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-blue-600">
                          {activities.filter(a => a.category_id === category.id).length} actividades
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;