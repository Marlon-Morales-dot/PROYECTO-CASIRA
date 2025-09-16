import React, { useState, useEffect } from 'react';
import { 
  User, Camera, MessageCircle, Heart, Calendar, MapPin, Clock, Users, 
  Settings, LogOut, Plus, Edit3, Save, X, Upload, Star, Award 
} from 'lucide-react';
import {
  usersAPI, volunteersAPI, activitiesAPI, categoriesAPI,
  commentsAPI, photosAPI, dataStore
} from '../lib/api.js';
import ImageUpload from './ImageUpload.jsx';
import { postsAPI as supabasePosts, commentsAPI as supabaseComments } from '../lib/supabase-singleton.js';

const VolunteerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('activities');
  const [userActivities, setUserActivities] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [userProfile, setUserProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

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
      // Load user's registered activities
      const registrations = await volunteersAPI.getUserRegistrations(user.id);
      const userActivityIds = registrations.map(r => r.activity_id);
      
      const allActivities = await activitiesAPI.getPublicActivities();
      const userRegisteredActivities = allActivities.filter(a => 
        userActivityIds.includes(a.id)
      );
      const availableActs = allActivities.filter(a => 
        !userActivityIds.includes(a.id) && a.status === 'active'
      );
      
      setUserActivities(userRegisteredActivities);
      setAvailableActivities(availableActs);
      
      // Update user profile
      const updatedUser = await usersAPI.getUserById(user.id);
      if (updatedUser) {
        setUserProfile(updatedUser);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleEditProfile = () => {
    setEditForm({ ...userProfile });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await usersAPI.updateUserProfile(user.id, editForm);
      setUserProfile(updated);
      setIsEditing(false);
      alert('¡Perfil actualizado exitosamente!');
    } catch (error) {
      alert('Error al actualizar el perfil');
      console.error(error);
    }
  };

  const handleRegisterActivity = async (activityId) => {
    try {
      await volunteersAPI.registerForActivity(user.id, activityId, {
        notes: 'Interesado en participar',
        skills_offered: userProfile.skills || []
      });
      
      await loadDashboardData();
      alert('¡Te has registrado exitosamente en la actividad!');
    } catch (error) {
      alert(error.message || 'Error al registrarse en la actividad');
      console.error(error);
    }
  };

  const openActivityModal = async (activity) => {
    setSelectedActivity(activity);
    try {
      const [activityComments, activityPhotos] = await Promise.all([
        commentsAPI.getActivityComments(activity.id),
        photosAPI.getActivityPhotos(activity.id)
      ]);
      setComments(activityComments);
      setPhotos(activityPhotos);
    } catch (error) {
      console.error('Error loading activity details:', error);
    }
    setShowActivityModal(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      console.log('💬 VOLUNTARIO: Adding comment to activity', selectedActivity.id);

      // Use Supabase API for real-time comments
      const comment = await supabaseComments.addComment(selectedActivity.id, user.id, newComment.trim());

      // Update local state immediately (optimistic update)
      setComments(prevComments => [...prevComments, comment]);
      setNewComment('');

      console.log('✅ VOLUNTARIO: Comment added successfully');
    } catch (error) {
      console.error('❌ VOLUNTARIO: Error adding comment:', error);
      alert('Error al agregar comentario: ' + error.message);
    }
  };

  const handlePhotoUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      console.log('📷 VOLUNTARIO: Processing', files.length, 'image(s)');
      const newPhotos = [];

      for (const file of files) {
        try {
          // Use the improved image manager
          const imageResult = await import('../lib/image-manager.js').then(module =>
            module.handleImage(file, user.id, selectedActivity.id, 'activities')
          );

          // Create photo object for local storage
          const photoObj = {
            id: Date.now() + Math.random(),
            url: imageResult.url,
            caption: file.name,
            user: user,
            likes: 0,
            liked: false,
            activity_id: selectedActivity.id,
            created_at: new Date().toISOString()
          };

          newPhotos.push(photoObj);
          console.log('✅ VOLUNTARIO: Image processed successfully:', file.name);
        } catch (error) {
          console.error('❌ VOLUNTARIO: Error processing image:', file.name, error);
        }
      }

      if (newPhotos.length > 0) {
        // Update local state with new photos
        setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
        setUploadedImages(prevImages => [...prevImages, ...newPhotos]);

        console.log(`✅ VOLUNTARIO: ${newPhotos.length} foto(s) subida(s) exitosamente`);
      }
    } catch (error) {
      console.error('❌ VOLUNTARIO: Error uploading photos:', error);
      alert('Error al subir las fotos: ' + error.message);
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const handleImageUploadFromComponent = (images) => {
    console.log('📷 VOLUNTARIO: Images uploaded from ImageUpload component:', images);

    const photoObjects = images.map(img => ({
      id: img.id || Date.now() + Math.random(),
      url: img.url,
      caption: img.originalName || 'Foto subida',
      user: user,
      likes: 0,
      liked: false,
      activity_id: selectedActivity.id,
      created_at: new Date().toISOString()
    }));

    setPhotos(prevPhotos => [...prevPhotos, ...photoObjects]);
    setUploadedImages(images);
  };

  const handleLikeComment = async (commentId) => {
    try {
      console.log('👍 VOLUNTARIO: Toggling like for comment', commentId);

      // Optimistic update
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, liked: !comment.liked, likes: (comment.likes || 0) + (comment.liked ? -1 : 1) }
            : comment
        )
      );

      console.log('✅ VOLUNTARIO: Comment like toggled');
    } catch (error) {
      console.error('❌ VOLUNTARIO: Error liking comment:', error);

      // Revert optimistic update on error
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, liked: !comment.liked, likes: (comment.likes || 0) + (comment.liked ? 1 : -1) }
            : comment
        )
      );
    }
  };

  const handleLikePhoto = async (photoId) => {
    try {
      console.log('❤️ VOLUNTARIO: Toggling like for photo', photoId);

      // Optimistic update
      setPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === photoId
            ? { ...photo, liked: !photo.liked, likes: (photo.likes || 0) + (photo.liked ? -1 : 1) }
            : photo
        )
      );

      console.log('✅ VOLUNTARIO: Photo like toggled');
    } catch (error) {
      console.error('❌ VOLUNTARIO: Error liking photo:', error);

      // Revert optimistic update on error
      setPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === photoId
            ? { ...photo, liked: !photo.liked, likes: (photo.likes || 0) + (photo.liked ? 1 : -1) }
            : photo
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="CASIRA" className="h-10 w-auto mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Voluntario</h1>
                <p className="text-sm text-gray-600">¡Bienvenido de vuelta, {userProfile.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {userProfile.total_hours || 0} horas contribuidas
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'activities', label: 'Mis Actividades', icon: Calendar },
              { id: 'available', label: 'Actividades Disponibles', icon: Users },
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Mis Actividades</h2>
              <div className="text-sm text-gray-600">
                {userActivities.length} actividades registradas
              </div>
            </div>
            
            {userActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tienes actividades registradas
                </h3>
                <p className="text-gray-600 mb-4">
                  ¡Explora las actividades disponibles y únete a una causa!
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Actividades Disponibles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => openActivityModal(activity)}
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={activity.image_url || '/grupo-canadienses.jpg'}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Registrado
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        {activity.activity_categories && (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: activity.activity_categories.color }}
                          >
                            {activity.activity_categories.icon} {activity.activity_categories.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                      <div className="space-y-2">
                        {activity.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            {activity.location}
                          </div>
                        )}
                        {activity.start_date && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(activity.start_date).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Activities Tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Actividades Disponibles</h2>
              <div className="text-sm text-gray-600">
                {availableActivities.length} actividades disponibles
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 overflow-hidden rounded-t-xl">
                    <img
                      src={activity.image_url || '/grupo-canadienses.jpg'}
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
                    <div className="flex items-center mb-3">
                      {activity.activity_categories && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: activity.activity_categories.color }}
                        >
                          {activity.activity_categories.icon} {activity.activity_categories.name}
                        </span>
                      )}
                    </div>
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
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openActivityModal(activity)}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleRegisterActivity(activity.id)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Registrarse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar Perfil</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Guardar</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar and Basic Info */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <img
                      src={userProfile.avatar_url || '/grupo-canadienses.jpg'}
                      alt={userProfile.first_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-4">
                    {userProfile.first_name} {userProfile.last_name}
                  </h3>
                  <p className="text-gray-600 capitalize">{userProfile.role}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Miembro desde {new Date(userProfile.created_at).getFullYear()}
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Award className="h-4 w-4 mr-2" />
                      {userProfile.total_hours || 0} horas contribuidas
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-6">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editForm.first_name || ''}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={editForm.last_name || ''}
                          onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Biografía
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.bio || ''}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Cuéntanos sobre ti..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Información Personal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Email:</span>
                            <p className="text-gray-900">{userProfile.email}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                            <p className="text-gray-900">{userProfile.phone || 'No especificado'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Ubicación:</span>
                            <p className="text-gray-900">{userProfile.location || 'No especificado'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Experiencia:</span>
                            <p className="text-gray-900">{userProfile.experience || 'No especificado'}</p>
                          </div>
                        </div>
                      </div>

                      {userProfile.bio && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Biografía</h4>
                          <p className="text-gray-700">{userProfile.bio}</p>
                        </div>
                      )}

                      {userProfile.skills && userProfile.skills.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Habilidades</h4>
                          <div className="flex flex-wrap gap-2">
                            {userProfile.skills.map((skill, index) => (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Activity Modal */}
      {showActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowActivityModal(false)}>
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Header */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={selectedActivity.image_url || '/grupo-canadienses.jpg'} 
                  alt={selectedActivity.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button 
                  onClick={() => setShowActivityModal(false)}
                  className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedActivity.title}</h2>
                  <p className="text-white/90">{selectedActivity.description}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-6">
                  {[
                    { id: 'info', label: 'Información', icon: Calendar },
                    { id: 'comments', label: 'Comentarios', icon: MessageCircle },
                    { id: 'photos', label: 'Fotos', icon: Camera }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        className="flex items-center space-x-2 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Info Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles</h3>
                      <p className="text-gray-600">{selectedActivity.detailed_description || selectedActivity.description}</p>
                    </div>

                    {/* Comments Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentarios ({comments.length})</h3>
                      
                      {/* Add Comment */}
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <img
                            src={user.avatar_url || '/grupo-canadienses.jpg'}
                            alt={user.first_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="relative">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Comparte tu experiencia sobre esta actividad..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder-gray-500 text-sm"
                                rows={3}
                                maxLength={500}
                              />
                              {newComment.length > 0 && (
                                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                  {newComment.length}/500
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <MessageCircle className="w-3 h-3" />
                                <span>Comparte tu experiencia con otros voluntarios</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {newComment.trim() && (
                                  <button
                                    onClick={() => setNewComment('')}
                                    className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm rounded-lg hover:bg-white/50 transition-all"
                                  >
                                    Limpiar
                                  </button>
                                )}
                                <button
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim()}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2 shadow-md"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Comentar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-4">
                        {comments.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No hay comentarios aún</p>
                            <p className="text-gray-400 text-sm mt-1">¡Sé el primero en compartir tu experiencia!</p>
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="hover:bg-gray-50 transition-colors p-3 rounded-xl group">
                              <div className="flex space-x-3">
                                <img
                                  src={comment.user?.avatar_url || '/grupo-canadienses.jpg'}
                                  alt={comment.user?.first_name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-100 group-hover:bg-gray-200 rounded-2xl px-4 py-3 transition-colors">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-sm text-gray-900 truncate">
                                        {comment.user?.first_name} {comment.user?.last_name}
                                      </span>
                                      <span className="text-xs text-gray-500 flex-shrink-0">
                                        {(() => {
                                          const now = new Date();
                                          const commentDate = new Date(comment.created_at);
                                          const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

                                          if (diffInMinutes < 1) return 'Ahora';
                                          if (diffInMinutes < 60) return `${diffInMinutes}m`;
                                          if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
                                          return commentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                        })()}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{comment.content}</p>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-2 px-2">
                                    <button
                                      onClick={() => handleLikeComment(comment.id)}
                                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors group"
                                    >
                                      <Heart className={`h-4 w-4 group-hover:scale-110 transition-transform ${
                                        comment.liked ? 'fill-current text-red-500' : ''
                                      }`} />
                                      <span>{comment.likes || 0}</span>
                                    </button>
                                    <span className="text-xs text-gray-400">
                                      {new Date(comment.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Photos Section */}
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Camera className="w-5 h-5 text-blue-600" />
                          Fotos de la Actividad ({photos.length})
                        </h3>

                        {/* Improved Image Upload Component */}
                        <div className="mb-6">
                          <ImageUpload
                            onImageUploaded={handleImageUploadFromComponent}
                            userId={user.id}
                            postId={selectedActivity.id}
                            folder="activities"
                            maxImages={10}
                            showUrlInput={true}
                            showFileUpload={true}
                            existingImages={uploadedImages}
                            compact={true}
                            className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      {photos.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium mb-2">No hay fotos de esta actividad</p>
                          <p className="text-gray-400 text-sm mb-4">Comparte momentos especiales de tu participación</p>
                          <div className="relative inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploading}
                              multiple
                            />
                            <button
                              disabled={isUploading}
                              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                            >
                              Subir Primera Foto
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {photos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-40 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-end p-3">
                                <div className="w-full">
                                  {photo.caption && (
                                    <p className="text-white text-sm font-medium mb-2 line-clamp-2">
                                      {photo.caption}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className="text-white text-xs opacity-90">
                                      por {photo.user?.first_name}
                                    </span>
                                    <button
                                      onClick={() => handleLikePhoto(photo.id)}
                                      className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all hover:scale-110 ${
                                        photo.liked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 ${photo.liked ? 'fill-current' : ''}`} />
                                      <span className="text-sm">{photo.likes || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Información</h4>
                      <div className="space-y-3">
                        {selectedActivity.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-600">{selectedActivity.location}</span>
                          </div>
                        )}
                        {selectedActivity.start_date && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-600">
                              {new Date(selectedActivity.start_date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {selectedActivity.current_volunteers || 0}/{selectedActivity.max_volunteers || '∞'} voluntarios
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!userActivities.find(a => a.id === selectedActivity.id) && (
                      <button
                        onClick={() => {
                          handleRegisterActivity(selectedActivity.id);
                          setShowActivityModal(false);
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Registrarse en esta actividad
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;