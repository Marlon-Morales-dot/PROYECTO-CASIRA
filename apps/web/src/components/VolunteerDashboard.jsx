import React, { useState, useEffect } from 'react';
import {
  User, Camera, MessageCircle, Heart, Calendar, MapPin, Clock, Users,
  Settings, LogOut, Plus, Edit3, Save, X, Upload, Star, Award, Bell, Check, AlertCircle, Trash2
} from 'lucide-react';
import {
  usersAPI, volunteersAPI, activitiesAPI, categoriesAPI,
  commentsAPI, photosAPI, dataStore
} from '../lib/api.js';
import { supabaseNotificationsAPI } from '../lib/supabase-api.js';
import activityRegistrationsService from '../lib/services/activity-registrations.service.js';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // States for nested comments functionality
  const [commentLikes, setCommentLikes] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [commentsToShow, setCommentsToShow] = useState({});

  // States for volunteer-created activities
  const [myVolunteerActivities, setMyVolunteerActivities] = useState([]);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [editingVolunteerActivity, setEditingVolunteerActivity] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    description: '',
    detailed_description: '',
    location: '',
    start_date: '',
    end_date: '',
    max_participants: 10,
    image_url: '',
    requirements: [],
    benefits: [],
    category_id: '',
    status: 'active',
    priority: 'medium'
  });
  const [activityRequests, setActivityRequests] = useState([]);

  // States for image upload (activities)
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadMode, setImageUploadMode] = useState('url'); // 'url' or 'file'

  // States for avatar upload (profile)
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();

    // Subscribe to store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadDashboardData();
    });

    // Polling para notificaciones más rápido + Realtime
    const notificationInterval = setInterval(loadNotifications, 3000); // Cada 3 segundos

    // Configurar Supabase Realtime para notificaciones instantáneas
    let realtimeChannel = null;
    const setupRealtime = async () => {
      if (user?.supabase_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.supabase_id)) {
        try {
          const { supabase } = await import('../lib/supabase-singleton.js');

          realtimeChannel = supabase
            .channel(`volunteer-notifications-${user.supabase_id}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.supabase_id}`
            }, (payload) => {
              console.log('⚡ REALTIME NOTIFICATIONS: Cambio detectado:', payload);
              // Recargar notificaciones inmediatamente cuando hay cambios
              loadNotifications();
            })
            .subscribe();

          console.log('✅ REALTIME NOTIFICATIONS: Suscripción activada para:', user.supabase_id);
        } catch (error) {
          console.warn('⚠️ REALTIME NOTIFICATIONS: No se pudo activar realtime:', error);
        }
      }
    };

    setupRealtime();

    return () => {
      unsubscribe();
      clearInterval(notificationInterval);
      // Limpiar canal de realtime
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        console.log('🧹 REALTIME NOTIFICATIONS: Canal desconectado');
      }
    };
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      console.log('📊 VOLUNTEER DASHBOARD: Cargando datos del dashboard...', user);

      // Obtener todas las actividades públicas
      const allActivities = await activitiesAPI.getPublicActivities();

      // Cargar actividades creadas por este voluntario
      await loadMyVolunteerActivities();

      // Obtener solicitudes aprobadas del usuario desde el nuevo sistema
      let userApprovedActivityIds = [];

      // Buscar por supabase_id o id del usuario
      const userId = user?.supabase_id || user?.id;

      if (userId) {
        try {
          // Usar el nuevo servicio para obtener solicitudes aprobadas
          const approvedRequests = await activityRegistrationsService.getUserApprovedRequests(userId);
          userApprovedActivityIds = approvedRequests.map(r => r.activity_id);

          console.log('✅ VOLUNTEER DASHBOARD: Solicitudes aprobadas encontradas:', userApprovedActivityIds);
        } catch (error) {
          console.warn('⚠️ VOLUNTEER DASHBOARD: Error obteniendo solicitudes aprobadas, usando sistema legacy:', error);

          // Fallback al sistema viejo
          try {
            const registrations = await volunteersAPI.getUserRegistrations(user.id);
            userApprovedActivityIds = registrations.map(r => r.activity_id);
          } catch (legacyError) {
            console.warn('⚠️ VOLUNTEER DASHBOARD: Error en sistema legacy también:', legacyError);
          }
        }
      }

      // Filtrar actividades registradas vs disponibles
      const userRegisteredActivities = allActivities.filter(a =>
        userApprovedActivityIds.includes(a.id)
      );
      const availableActs = allActivities.filter(a =>
        !userApprovedActivityIds.includes(a.id) && a.status === 'active'
      );

      console.log('📊 VOLUNTEER DASHBOARD: Actividades del usuario:', userRegisteredActivities.length);
      console.log('📊 VOLUNTEER DASHBOARD: Actividades disponibles:', availableActs.length);

      setUserActivities(userRegisteredActivities);
      setAvailableActivities(availableActs);

      // Update user profile
      const updatedUser = await usersAPI.getUserById(user.id);
      if (updatedUser) {
        setUserProfile(updatedUser);
      }
    } catch (error) {
      console.error('❌ VOLUNTEER DASHBOARD: Error loading dashboard data:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      console.log('🔔 VOLUNTEER NOTIFICATIONS: Iniciando carga de notificaciones...');
      console.log('👤 VOLUNTEER NOTIFICATIONS: Usuario actual:', user);

      // Solo cargar notificaciones si el usuario tiene supabase_id
      const userId = user?.supabase_id || user?.id;

      // Verificar que sea un UUID válido
      const isValidUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

      if (!userId) {
        console.log('⚠️ VOLUNTEER NOTIFICATIONS: No hay ID de usuario');
        return;
      }

      if (!isValidUUID) {
        console.log('🔍 VOLUNTEER NOTIFICATIONS: Usuario sin UUID válido para Supabase:', userId);
        // Para usuarios sin UUID válido, simplemente no cargar notificaciones pero no fallar
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      console.log('📡 VOLUNTEER NOTIFICATIONS: Consultando notificaciones para UUID:', userId);

      const userNotifications = await supabaseNotificationsAPI.getUserNotifications(userId);

      console.log('📨 VOLUNTEER NOTIFICATIONS: Respuesta de API:', userNotifications);

      if (userNotifications && Array.isArray(userNotifications)) {
        // Filtrar solo notificaciones relevantes para voluntarios
        const volunteerNotifications = userNotifications.filter(n =>
          ['request_approved', 'request_rejected', 'activity_updated', 'volunteer_request'].includes(n.type)
        );

        setNotifications(volunteerNotifications);

        // Contar no leídas
        const unread = volunteerNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);

        console.log('✅ VOLUNTEER NOTIFICATIONS: Cargadas', volunteerNotifications.length, 'notificaciones, ', unread, 'sin leer');
      } else {
        console.log('📭 VOLUNTEER NOTIFICATIONS: No hay notificaciones disponibles');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ VOLUNTEER NOTIFICATIONS: Error cargando notificaciones:', error);
      // No fallar el componente, simplemente no mostrar notificaciones
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await supabaseNotificationsAPI.markAsRead(notificationId);

      // Actualizar localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      // Actualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));

      console.log('✅ VOLUNTEER NOTIFICATIONS: Notificación marcada como leída:', notificationId);
    } catch (error) {
      console.error('❌ VOLUNTEER NOTIFICATIONS: Error marcando como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);

      for (const notification of unreadNotifications) {
        await supabaseNotificationsAPI.markAsRead(notification.id);
      }

      // Actualizar todas como leídas
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      console.log('✅ VOLUNTEER NOTIFICATIONS: Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('❌ VOLUNTEER NOTIFICATIONS: Error marcando todas como leídas:', error);
    }
  };

  const handleEditProfile = () => {
    setEditForm({ ...userProfile });
    setIsEditing(true);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const userId = user?.supabase_id || user?.id;
      console.log('💾 VOLUNTEER: Saving profile for user ID:', userId);

      let profileData = { ...editForm };

      // Handle avatar upload if user selected a new file
      if (selectedAvatar) {
        console.log('📸 VOLUNTEER: Uploading avatar...');
        const { storageAPI } = await import('../lib/supabase-singleton.js');
        const timestamp = Date.now();
        const filename = `avatar_${userId}_${timestamp}_${selectedAvatar.name}`;
        const uploadResult = await storageAPI.uploadImage(selectedAvatar, 'avatars');
        profileData.avatar_url = uploadResult.url;
        console.log('✅ VOLUNTEER: Avatar uploaded:', uploadResult.url);
      }

      const updated = await usersAPI.updateUserProfile(userId, profileData);
      setUserProfile(updated);
      setIsEditing(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
      alert('¡Perfil actualizado exitosamente!');
    } catch (error) {
      alert('Error al actualizar el perfil');
      console.error('❌ VOLUNTEER: Error updating profile:', error);
    }
  };

  const handleRegisterActivity = async (activityId) => {
    try {
      console.log('🎯 VOLUNTEER: Registrando en actividad:', activityId, 'Usuario:', user);

      // Usar el nuevo servicio que SÍ notifica a los admins
      await activityRegistrationsService.registerForActivity(
        activityId,
        user, // Pasar el objeto completo del usuario
        `${user.first_name || user.name || 'Usuario'} está interesado en participar en esta actividad.`
      );

      console.log('✅ VOLUNTEER: Registro exitoso, recargando datos...');
      await loadDashboardData();
      alert('¡Te has registrado exitosamente! Los administradores han sido notificados.');
    } catch (error) {
      console.error('❌ VOLUNTEER: Error en registro:', error);
      alert(error.message || 'Error al registrarse en la actividad');
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

  // Function to organize comments hierarchically
  const organizeComments = (comments) => {
    const mainComments = [];
    const replies = {};

    // Sort comments by creation date first to maintain proper order
    const sortedComments = [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Separate main comments from replies
    sortedComments.forEach(comment => {
      if (comment.content?.startsWith('@') && comment.content.includes(':')) {
        // This is a reply - extract parent info
        const replyMatch = comment.content.match(/@([^:]+):\s*(.+)/);
        if (replyMatch) {
          const [, mentionedUser, replyText] = replyMatch;

          // Find parent comment by looking for the mentioned user
          // Look for the most recent main comment from that user before this reply
          const parentComment = sortedComments
            .filter(c => !c.content?.startsWith('@') &&
                        c.user &&
                        `${c.user.first_name} ${c.user.last_name}` === mentionedUser.trim() &&
                        new Date(c.created_at) < new Date(comment.created_at))
            .pop(); // Get the most recent one

          if (parentComment) {
            if (!replies[parentComment.id]) {
              replies[parentComment.id] = [];
            }
            replies[parentComment.id].push({
              ...comment,
              replyText,
              mentionedUser,
              parentId: parentComment.id
            });
          } else {
            // If we can't find parent, treat as main comment but mark as orphaned
            mainComments.push({
              ...comment,
              isOrphanedReply: true
            });
          }
        } else {
          mainComments.push(comment);
        }
      } else {
        // This is a main comment
        mainComments.push(comment);
      }
    });

    // Sort replies by creation date for each parent
    Object.keys(replies).forEach(parentId => {
      replies[parentId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return { mainComments, replies };
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

  // Handle toggle reply functionality
  const handleToggleReply = (commentId) => {
    setCommentReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    // Clear reply input when closing
    if (commentReplies[commentId]) {
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    }
  };

  // Handle reply input change
  const handleReplyInputChange = (commentId, value) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  // Handle submit reply
  const handleSubmitReply = async (commentId, activityId, parentComment) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText) return;

    try {
      console.log(`📤 VOLUNTARIO: Submitting reply to comment ${commentId}: ${replyText}`);

      // Find the parent comment to get author info
      const parentAuthor = parentComment?.user || { first_name: 'Usuario', last_name: 'Anónimo' };
      const replyContent = `@${parentAuthor.first_name} ${parentAuthor.last_name}: ${replyText}`;

      // Add reply using the standard API
      const newReply = await supabaseComments.addComment(activityId, user.id, replyContent);

      // Add the reply optimistically to local state for immediate display
      if (newReply) {
        setComments(prevComments => [...prevComments, newReply]);
      }

      // Clear reply input and hide reply box
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setCommentReplies(prev => ({ ...prev, [commentId]: false }));

      console.log('✅ VOLUNTARIO: Reply submitted successfully');

    } catch (error) {
      console.error('❌ VOLUNTARIO: Error submitting reply:', error);
      alert('Error al enviar respuesta: ' + error.message);
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

  // ====== VOLUNTEER ACTIVITIES FUNCTIONS ======
  // Detectar si estamos en desarrollo o producción
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://proyecto-casira.onrender.com';

  const loadMyVolunteerActivities = async () => {
    try {
      const userId = user?.supabase_id || user?.id;
      console.log('📋 VOLUNTEER: Loading my created activities for user:', userId);

      // Get all activities from Supabase and filter by created_by
      const allActivities = await activitiesAPI.getAllActivities();

      // Filter activities created by this volunteer
      const myActivities = allActivities.filter(activity => {
        const createdBy = activity.created_by;
        const matches = createdBy === userId || createdBy === user?.id || createdBy === user?.email;
        return matches;
      });

      setMyVolunteerActivities(myActivities || []);
      console.log('✅ VOLUNTEER: Loaded', myActivities?.length || 0, 'activities created by me');

      // Cargar solicitudes para cada actividad usando Supabase
      if (myActivities && myActivities.length > 0) {
        await loadActivityRequests(myActivities.map(a => a.id));
      }
    } catch (error) {
      console.error('❌ VOLUNTEER: Error loading my activities:', error);
      setMyVolunteerActivities([]);
    }
  };

  const loadActivityRequests = async (activityIds) => {
    try {
      console.log('📋 VOLUNTEER: Loading requests for activities:', activityIds);

      // Get all requests from Supabase for these activities
      const allRequests = [];
      for (const activityId of activityIds) {
        try {
          const requests = await activityRegistrationsService.getActivityRequests(activityId);
          if (requests && requests.length > 0) {
            allRequests.push(...requests.map(r => ({ ...r, activity_id: activityId })));
          }
        } catch (error) {
          console.warn(`⚠️ Error loading requests for activity ${activityId}:`, error);
        }
      }

      setActivityRequests(allRequests);
      console.log('✅ VOLUNTEER: Loaded', allRequests.length, 'activity requests');
    } catch (error) {
      console.error('❌ VOLUNTEER: Error loading activity requests:', error);
      setActivityRequests([]);
    }
  };

  // ====== IMAGE UPLOAD FUNCTIONS ======
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImageStates = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setImageUploadMode('url');
  };

  const handleCreateVolunteerActivity = async (e) => {
    e.preventDefault();

    // Validation
    if (!activityFormData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    if (!activityFormData.description.trim()) {
      alert('La descripción es requerida');
      return;
    }
    if (!activityFormData.location.trim()) {
      alert('La ubicación es requerida');
      return;
    }
    if (!activityFormData.start_date) {
      alert('La fecha de inicio es requerida');
      return;
    }
    if (activityFormData.end_date && activityFormData.start_date > activityFormData.end_date) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }

    try {
      console.log('�� VOLUNTEER: Creating new activity:', activityFormData);

      // Get current user ID for activity creation
      const userId = user?.supabase_id || user?.id;
      console.log('🔍 Current volunteer user for activity creation:', {
        user: user,
        userId: userId,
        email: user?.email
      });

      // Handle image - either URL or file upload to Supabase Storage
      let finalImageUrl = activityFormData.image_url || '/grupo-canadienses.jpg';

      if (selectedFile) {
        try {
          console.log('📷 VOLUNTEER: Uploading image file to Supabase Storage...');
          const { storageAPI } = await import('../lib/supabase-singleton.js');

          // Generate unique filename
          const timestamp = Date.now();
          const filename = `volunteer_activity_${timestamp}_${selectedFile.name}`;

          // Upload to Supabase Storage
          const uploadResult = await storageAPI.uploadImage(
            selectedFile,
            userId,
            null, // activity_id will be null for new activities
            filename
          );

          finalImageUrl = uploadResult.url;
          console.log('✅ VOLUNTEER: Image file uploaded successfully:', finalImageUrl);
        } catch (uploadError) {
          console.error('❌ VOLUNTEER: Image file upload failed:', uploadError);
          finalImageUrl = imagePreview || activityFormData.image_url || '/grupo-canadienses.jpg';
          console.log('⚠️ VOLUNTEER: Using fallback image URL:', finalImageUrl);
        }
      }

      // Prepare activity data - only include fields that exist in Supabase
      const activityData = {
        title: activityFormData.title,
        description: activityFormData.description,
        detailed_description: activityFormData.detailed_description,
        location: activityFormData.location,
        created_by: userId, // Use current volunteer user ID
        requirements: activityFormData.requirements.filter(r => r.trim()),
        benefits: activityFormData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(activityFormData.max_participants) || null,
        date_start: activityFormData.start_date,
        date_end: activityFormData.end_date || activityFormData.start_date,
        image_url: finalImageUrl,
        current_volunteers: 0,
        category_id: activityFormData.category_id ? parseInt(activityFormData.category_id) : null,
        visibility: 'public',
        status: activityFormData.status || 'active',
        priority: activityFormData.priority || 'medium'
      };

      console.log('🚀 VOLUNTEER: Creating activity with data:', activityData);
      const result = await activitiesAPI.createActivity(activityData);
      console.log('✅ VOLUNTEER: Activity created successfully:', result);

      alert('¡Actividad creada exitosamente! Todos los usuarios ahora podrán verla.');

      // Reset form
      setActivityFormData({
        title: '',
        description: '',
        detailed_description: '',
        location: '',
        start_date: '',
        end_date: '',
        max_participants: 10,
        image_url: '',
        requirements: [],
        benefits: [],
        category_id: '',
        status: 'active',
        priority: 'medium'
      });
      resetImageStates();
      setShowCreateActivityModal(false);

      // Reload activities
      await loadMyVolunteerActivities();
      await loadDashboardData();
    } catch (error) {
      console.error('❌ VOLUNTEER: Error creating activity:', error);
      alert('Error al crear la actividad: ' + error.message);
    }
  };

  const handleUpdateVolunteerActivity = async (e) => {
    e.preventDefault();

    if (!editingVolunteerActivity) return;

    // Validation
    if (!activityFormData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    if (!activityFormData.description.trim()) {
      alert('La descripción es requerida');
      return;
    }
    if (!activityFormData.location.trim()) {
      alert('La ubicación es requerida');
      return;
    }
    if (!activityFormData.start_date) {
      alert('La fecha de inicio es requerida');
      return;
    }

    try {
      console.log('📝 VOLUNTEER: Updating activity:', editingVolunteerActivity.id);

      // Prepare update data - only include fields that exist in Supabase
      const updateData = {
        title: activityFormData.title,
        description: activityFormData.description,
        detailed_description: activityFormData.detailed_description,
        location: activityFormData.location,
        requirements: activityFormData.requirements.filter(r => r.trim()),
        benefits: activityFormData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(activityFormData.max_participants) || null,
        date_start: activityFormData.start_date,
        date_end: activityFormData.end_date || activityFormData.start_date,
        category_id: activityFormData.category_id ? parseInt(activityFormData.category_id) : null,
        status: activityFormData.status || 'active',
        priority: activityFormData.priority || 'medium',
        image_url: activityFormData.image_url || null
      };

      console.log('🚀 VOLUNTEER: Updating activity with data:', updateData);
      const result = await activitiesAPI.updateActivity(editingVolunteerActivity.id, updateData);
      console.log('✅ VOLUNTEER: Activity updated successfully:', result);

      alert('¡Actividad actualizada exitosamente!');

      // Reset form
      setActivityFormData({
        title: '',
        description: '',
        detailed_description: '',
        location: '',
        start_date: '',
        end_date: '',
        max_participants: 10,
        image_url: '',
        requirements: [],
        benefits: [],
        category_id: '',
        status: 'active',
        priority: 'medium'
      });
      setEditingVolunteerActivity(null);
      setShowCreateActivityModal(false);

      // Reload activities
      await loadMyVolunteerActivities();
    } catch (error) {
      console.error('❌ VOLUNTEER: Error updating activity:', error);
      alert('Error al actualizar la actividad: ' + error.message);
    }
  };

  const handleEditVolunteerActivity = (activity) => {
    setEditingVolunteerActivity(activity);
    setActivityFormData({
      title: activity.title,
      description: activity.description,
      detailed_description: activity.detailed_description || '',
      location: activity.location,
      start_date: activity.start_date ? activity.start_date.split('T')[0] : (activity.date_start ? activity.date_start.split('T')[0] : ''),
      end_date: activity.end_date ? activity.end_date.split('T')[0] : (activity.date_end ? activity.date_end.split('T')[0] : ''),
      max_participants: activity.max_volunteers || activity.max_participants || 10,
      image_url: activity.image_url || '',
      requirements: activity.requirements || [],
      benefits: activity.benefits || [],
      category_id: activity.category_id || '',
      status: activity.status || 'active',
      priority: activity.priority || 'medium'
    });
    setShowCreateActivityModal(true);
  };

  const handleDeleteVolunteerActivity = async (activityId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;

    try {
      console.log('🗑️ VOLUNTEER: Deleting activity:', activityId);

      const result = await activitiesAPI.deleteActivity(activityId);
      console.log('✅ VOLUNTEER: Activity deleted successfully:', result);

      alert('Actividad eliminada exitosamente');

      // Reload activities
      await loadMyVolunteerActivities();
      await loadDashboardData();
    } catch (error) {
      console.error('❌ VOLUNTEER: Error deleting activity:', error);
      alert('Error al eliminar la actividad: ' + error.message);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      console.log('✅ VOLUNTEER: Approving request:', requestId);

      // Use Supabase to approve request
      await activityRegistrationsService.approveRequest(requestId);

      alert('✅ Solicitud aprobada exitosamente');
      await loadMyVolunteerActivities();
    } catch (error) {
      console.error('❌ VOLUNTEER: Error approving request:', error);
      alert('Error al aprobar solicitud: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('❌ VOLUNTEER: Rejecting request:', requestId);

      // Use Supabase to reject request
      await activityRegistrationsService.rejectRequest(requestId);

      alert('❌ Solicitud rechazada');
      await loadMyVolunteerActivities();
    } catch (error) {
      console.error('❌ VOLUNTEER: Error rejecting request:', error);
      alert('Error al rechazar solicitud: ' + error.message);
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
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'activities', label: 'Mis Actividades', icon: Calendar },
              { id: 'available', label: 'Actividades Disponibles', icon: Users },
              { id: 'my-created-activities', label: 'Crear Mis Actividades', icon: Plus, badge: activityRequests.filter(r => r.status === 'pending').length || null },
              { id: 'notifications', label: 'Notificaciones', icon: Bell, badge: unreadCount },
              { id: 'profile', label: 'Mi Perfil', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
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

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay notificaciones
                </h3>
                <p className="text-gray-600">
                  Cuando tengas notificaciones sobre tus solicitudes de actividades, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const isUnread = !notification.read;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isUnread
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'request_approved' && (
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {notification.type === 'request_rejected' && (
                            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                              <X className="h-4 w-4 text-red-600" />
                            </div>
                          )}
                          {notification.type === 'activity_updated' && (
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {notification.type === 'volunteer_request' && (
                            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-orange-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              isUnread ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isUnread && (
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Marcar como leída
                                </button>
                              )}
                            </div>
                          </div>
                          <p className={`mt-1 text-sm ${
                            isUnread ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>

                          {/* Badge para indicar estado */}
                          {notification.type === 'request_approved' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                              ✅ Solicitud Aprobada
                            </span>
                          )}
                          {notification.type === 'request_rejected' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                              ❌ Solicitud Rechazada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Created Activities Tab */}
        {activeTab === 'my-created-activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mis Actividades Creadas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Actividades que has creado para que otros se unan
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingVolunteerActivity(null);
                  setActivityFormData({
                    title: '',
                    description: '',
                    detailed_description: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    max_participants: 10,
                    image_url: '',
                    requirements: [],
                    benefits: []
                  });
                  setShowCreateActivityModal(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Crear Nueva Actividad</span>
              </button>
            </div>

            {/* Activity Cards Grid */}
            {myVolunteerActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No has creado actividades aún
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera actividad y permite que otros visitantes se unan
                </p>
                <button
                  onClick={() => setShowCreateActivityModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Mi Primera Actividad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVolunteerActivities.map((activity) => {
                  const activityPendingRequests = activityRequests.filter(
                    r => r.activity_id === activity.id && r.status === 'pending'
                  );
                  const activityApprovedRequests = activityRequests.filter(
                    r => r.activity_id === activity.id && r.status === 'approved'
                  );

                  return (
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
                        {activityPendingRequests.length > 0 && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                              <Bell className="h-3 w-3 mr-1" />
                              {activityPendingRequests.length} solicitudes
                            </span>
                          </div>
                        )}
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
                          {(activity.date_start || activity.start_date) && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              {new Date(activity.date_start || activity.start_date).toLocaleDateString('es-ES')}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-2" />
                            {activity.current_volunteers || activity.current_participants || 0}/{activity.max_volunteers || activity.max_participants || '∞'} participantes
                          </div>
                        </div>

                        {/* Requests Section */}
                        {activityPendingRequests.length > 0 && (
                          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <h4 className="text-sm font-semibold text-orange-800 mb-2">
                              Solicitudes pendientes ({activityPendingRequests.length})
                            </h4>
                            <div className="space-y-2">
                              {activityPendingRequests.slice(0, 2).map((request) => (
                                <div key={request.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={request.users?.avatar_url || '/default-avatar.jpg'}
                                      alt={request.users?.first_name}
                                      className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-gray-700">
                                      {request.users?.first_name} {request.users?.last_name}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleApproveRequest(request.id)}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                                      title="Aprobar"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(request.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      title="Rechazar"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {activityPendingRequests.length > 2 && (
                                <p className="text-xs text-orange-600">
                                  +{activityPendingRequests.length - 2} más...
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Approved participants */}
                        {activityApprovedRequests.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-1">Participantes confirmados:</p>
                            <div className="flex -space-x-2">
                              {activityApprovedRequests.slice(0, 5).map((request) => (
                                <img
                                  key={request.id}
                                  src={request.users?.avatar_url || '/default-avatar.jpg'}
                                  alt={request.users?.first_name}
                                  className="w-8 h-8 rounded-full border-2 border-white"
                                  title={`${request.users?.first_name} ${request.users?.last_name}`}
                                />
                              ))}
                              {activityApprovedRequests.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-600">
                                    +{activityApprovedRequests.length - 5}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditVolunteerActivity(activity)}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteVolunteerActivity(activity.id)}
                            className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar</span>
                          </button>
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
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedAvatar(null);
                        setAvatarPreview(null);
                      }}
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
                      src={avatarPreview || userProfile.avatar_url || '/grupo-canadienses.jpg'}
                      alt={userProfile.first_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                    />
                    {isEditing && (
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera className="h-4 w-4 text-white" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                    {!isEditing && (
                      <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    )}
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
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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

                      {/* Comments List with Nested Replies */}
                      <div className="space-y-4">
                        {comments.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No hay comentarios aún</p>
                            <p className="text-gray-400 text-sm mt-1">¡Sé el primero en compartir tu experiencia!</p>
                          </div>
                        ) : (
                          (() => {
                            const { mainComments, replies } = organizeComments(comments);
                            const commentsLimit = commentsToShow[selectedActivity.id] || 3;
                            const visibleMainComments = mainComments.slice(0, commentsLimit);

                            return visibleMainComments.map((comment) => (
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
                                      <button
                                        onClick={() => handleToggleReply(comment.id)}
                                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>Responder</span>
                                      </button>
                                      <span className="text-xs text-gray-400">
                                        {new Date(comment.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>

                                    {/* Reply Input */}
                                    {commentReplies[comment.id] && (
                                      <div className="mt-3 ml-2">
                                        <div className="flex space-x-2">
                                          <img
                                            src={user.avatar_url || '/grupo-canadienses.jpg'}
                                            alt={user.first_name}
                                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                          />
                                          <div className="flex-1 flex space-x-2">
                                            <input
                                              type="text"
                                              value={replyInputs[comment.id] || ''}
                                              onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                                              placeholder={`Responder a ${comment.user?.first_name}...`}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleSubmitReply(comment.id, selectedActivity.id, comment);
                                                }
                                              }}
                                              className="flex-1 px-3 py-1 border border-gray-300 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                              onClick={() => handleSubmitReply(comment.id, selectedActivity.id, comment)}
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
                                      <div className="ml-8 mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                                        {replies[comment.id].map(reply => {
                                          const replyUser = reply.user || { first_name: 'Usuario', last_name: 'Anónimo' };
                                          return (
                                            <div key={reply.id} className="flex space-x-2">
                                              <div className="flex-shrink-0">
                                                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                                  {replyUser?.first_name?.charAt(0) || 'A'}
                                                </div>
                                              </div>
                                              <div className="flex-1">
                                                <div className="bg-gray-50 rounded-2xl px-3 py-2">
                                                  <div className="text-sm font-medium text-gray-900">
                                                    <span className="text-blue-600">@{reply.mentionedUser}</span>
                                                    <span className="text-gray-600 ml-1">{replyUser ? `${replyUser.first_name} ${replyUser.last_name}` : 'Usuario Anónimo'}</span>
                                                  </div>
                                                  <div className="text-sm text-gray-700">{reply.replyText}</div>
                                                </div>
                                                <div className="flex items-center space-x-3 mt-1 px-2">
                                                  <button
                                                    onClick={() => handleLikeComment(reply.id)}
                                                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                                                  >
                                                    <Heart className={`h-3 w-3 ${reply.liked ? 'fill-current text-red-500' : ''}`} />
                                                    <span>{reply.likes || 0}</span>
                                                  </button>
                                                  <span className="text-xs text-gray-400">
                                                    {(() => {
                                                      const now = new Date();
                                                      const replyDate = new Date(reply.created_at);
                                                      const diffInMinutes = Math.floor((now - replyDate) / (1000 * 60));

                                                      if (diffInMinutes < 1) return 'Ahora';
                                                      if (diffInMinutes < 60) return `${diffInMinutes}m`;
                                                      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
                                                      return replyDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                                    })()}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ));
                          })()
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

      {/* CREATE/EDIT ACTIVITY MODAL */}
      {showCreateActivityModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingVolunteerActivity ? 'Editar Actividad' : 'Crear Nueva Actividad'}
                    </h3>
                    <p className="text-blue-100 text-xs">
                      {editingVolunteerActivity ? 'Modifica los detalles' : 'Crea una oportunidad para la comunidad'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateActivityModal(false);
                    setEditingVolunteerActivity(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              <form onSubmit={editingVolunteerActivity ? handleUpdateVolunteerActivity : handleCreateVolunteerActivity} className="space-y-4">
                {/* Basic Info */}
                <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Información Básica
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Título de la Actividad *
                      </label>
                      <input
                        type="text"
                        required
                        value={activityFormData.title}
                        onChange={(e) => setActivityFormData({...activityFormData, title: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm"
                        placeholder="Ej: Taller de Alfabetización Digital"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Descripción Breve *
                      </label>
                      <textarea
                        required
                        rows="2"
                        value={activityFormData.description}
                        onChange={(e) => setActivityFormData({...activityFormData, description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm resize-none"
                        placeholder="Describe brevemente el propósito..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Descripción Detallada
                      </label>
                      <textarea
                        rows="3"
                        value={activityFormData.detailed_description}
                        onChange={(e) => setActivityFormData({...activityFormData, detailed_description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm resize-none"
                        placeholder="Objetivos específicos, metodología, beneficiarios..."
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Dates */}
                <div className="bg-purple-50 rounded-md p-4 border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ubicación y Fechas
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ubicación *
                      </label>
                      <input
                        type="text"
                        required
                        value={activityFormData.location}
                        onChange={(e) => setActivityFormData({...activityFormData, location: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                        placeholder="Ej: Guatemala Ciudad, Zona 1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          required
                          value={activityFormData.start_date}
                          onChange={(e) => setActivityFormData({...activityFormData, start_date: e.target.value})}
                          className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de Fin
                        </label>
                        <input
                          type="date"
                          value={activityFormData.end_date}
                          onChange={(e) => setActivityFormData({...activityFormData, end_date: e.target.value})}
                          className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                          min={activityFormData.start_date || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Máximo de Participantes
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={activityFormData.max_participants}
                        onChange={(e) => setActivityFormData({...activityFormData, max_participants: parseInt(e.target.value)})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Número máximo de personas que pueden participar</p>
                    </div>
                  </div>
                </div>

                {/* Category, Status & Priority */}
                <div className="bg-green-50 rounded-md p-4 border border-green-200">
                  <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Categoría
                      </label>
                      <select
                        value={activityFormData.category_id || ''}
                        onChange={(e) => setActivityFormData({...activityFormData, category_id: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                      >
                        <option value="">Sin categoría</option>
                        <option value="1">🌱 Medio Ambiente</option>
                        <option value="2">🍞 Alimentación</option>
                        <option value="3">📚 Educación</option>
                        <option value="4">❤️ Salud</option>
                        <option value="5">🏠 Vivienda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={activityFormData.status || 'active'}
                        onChange={(e) => setActivityFormData({...activityFormData, status: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                      >
                        <option value="planning">Planificación</option>
                        <option value="active">Activa</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prioridad
                      </label>
                      <select
                        value={activityFormData.priority || 'medium'}
                        onChange={(e) => setActivityFormData({...activityFormData, priority: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image y Opciones */}
                <div className="bg-orange-50 rounded-md p-4 border border-orange-200">
                  <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Imagen de la Actividad
                  </h4>

                  {/* Opciones de imagen */}
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        imageUploadMode === 'url'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-medium">URL de Imagen</div>
                      <div className="text-xs mt-1">Desde internet</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('file')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        imageUploadMode === 'file'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-medium">Subir Archivo</div>
                      <div className="text-xs mt-1">Desde computadora</div>
                    </button>
                  </div>

                  {/* URL Input */}
                  {imageUploadMode === 'url' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={activityFormData.image_url}
                        onChange={(e) => setActivityFormData({...activityFormData, image_url: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                      />
                      {activityFormData.image_url && (
                        <div className="mt-3">
                          <img
                            src={activityFormData.image_url}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md"
                            onError={(e) => {
                              e.target.src = '/grupo-canadienses.jpg';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Upload */}
                  {imageUploadMode === 'file' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Seleccionar archivo
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Click para subir</span> o arrastra el archivo
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP hasta 5MB</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                      {(imagePreview || selectedFile) && (
                        <div className="mt-3 relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-xs text-gray-600 mt-2">
                            📄 {selectedFile?.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateActivityModal(false);
                      setEditingVolunteerActivity(null);
                      resetImageStates();
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingVolunteerActivity ? 'Actualizar Actividad' : 'Crear Actividad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;