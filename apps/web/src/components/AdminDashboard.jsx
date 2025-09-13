import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Users, Calendar, BarChart3, Settings, RotateCcw, Bell, CheckCircle, XCircle, AlertCircle, RefreshCw, X, Globe, Shield, Activity, MapPin } from 'lucide-react';
import { activitiesAPI, categoriesAPI, statsAPI, resetDataToDefaults, forceRefreshData, cleanStorageData, notificationsAPI, volunteersAPI, usersAPI, dataStore } from '../lib/api.js';
import adminService from '../lib/services/admin.service.js';
import LogoutButton from './LogoutButton.jsx';
import e from 'cors';

const AdminDashboard = ({ user, onLogout }) => {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('activities');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'online', 'offline', 'checking'
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // New states for registrations/notifications management
  const [notifications, setNotifications] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
  
    title: '',
    description: '',
    detailed_description: '',
    category_id: '',
    status: 'planning',
    priority: 'medium',
    location: '',
    start_date: '',
    end_date: '',
    max_volunteers: '',
    image_url: '',
    requirements: [],
    benefits: [],
    visibility: 'public',
    featured: false
  });

  // Image handling states
  const [imageOption, setImageOption] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    loadAdminData();

    // IMPORTANTE: Suscribirse a cambios en el dataStore para actualizar la UI automáticamente
    const handleDataStoreChange = () => {
      console.log('📊 DataStore changed, reloading admin data...');
      loadAdminData();
    };

    // Agregar listener al dataStore
    dataStore.addListener(handleDataStoreChange);

    // Cleanup: remover listener al desmontar el componente
    return () => {
      dataStore.removeListener(handleDataStoreChange);
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('https://proyecto-casira.onrender.com/api/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      
      if (response.ok) {
        setConnectionStatus('online');
        console.log('Backend connection: ONLINE');
      } else {
        setConnectionStatus('offline');
        console.log('Backend connection: OFFLINE');
      }
    } catch (error) {
      setConnectionStatus('offline');
      console.log('Backend connection: OFFLINE', error.message);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // FORCE SUPABASE CONNECTION - Real admin functionality
      console.log('🚀 AdminDashboard: Loading data from Supabase ONLY...');
      
      // Cargar solicitudes de voluntarios desde Supabase usando el nuevo handler
      const { getPendingVolunteerRequests } = await import('../lib/volunteer-request-handler.js');
      const pendingRequests = await getPendingVolunteerRequests();
      
      const [activitiesData, categoriesData, statsData, notificationsData, usersData] = await Promise.all([
        activitiesAPI.getAllActivities(), // Force Supabase - getAllActivities connects to Supabase
        categoriesAPI.getAllCategories(),
        adminService.getAdminStats(),     // Usar el nuevo servicio de admin
        adminService.getAllNotifications(), // Usar el nuevo servicio de admin
        adminService.getAllUsers()          // Usar el nuevo servicio de admin
      ]);
      
      setActivities(activitiesData || []);
      setCategories(categoriesData || []);
      setStats(statsData || {});
      setNotifications(notificationsData || []);
      setRegistrations(pendingRequests || []);
      setAllUsers(usersData || []);
      
      console.log('Admin data loaded successfully:', {
        activities: activitiesData?.length || 0,
        categories: categoriesData?.length || 0,
        notifications: notificationsData?.length || 0,
        registrations: pendingRequests?.length || 0,
        users: usersData?.length || 0
      });
      
      // Log users by role for debugging
      if (Array.isArray(usersData)) {
        const usersByRole = usersData.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        console.log('Users by role:', usersByRole);
        console.log('All users:', usersData.map(u => ({ id: u.id, name: u.first_name + ' ' + u.last_name, role: u.role })));
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Show user-friendly error without breaking the UI
      alert('Algunos datos pueden estar desactualizados. La aplicación funcionará con datos locales.');
    } finally {
      setIsLoading(false);
    }
  };

  // Image handling functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB permitido.');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        // Don't set image_url yet - will be set after Supabase upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageOptionChange = (option) => {
    setImageOption(option);
    setSelectedFile(null);
    setImagePreview(null);
    
    if (option === 'url') {
      // Keep the current URL if it exists
    } else {
      // Clear URL when switching to upload
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const resetImageStates = () => {
    setImageOption('url');
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isCreating) {
      console.log('⚠️ Activity creation already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsCreating(true);
    
    // Validation
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    if (!formData.description.trim()) {
      alert('La descripción es requerida');
      return;
    }
    if (!formData.location.trim()) {
      alert('La ubicación es requerida');
      return;
    }
    if (!formData.start_date) {
      alert('La fecha de inicio es requerida');
      return;
    }
    if (formData.end_date && formData.start_date > formData.end_date) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }
    
    try {
      // Get current user ID for activity creation
      let userId = user?.supabase_id || user?.id;
      console.log('🔍 Current user for activity creation:', {
        user: user,
        userId: userId,
        email: user?.email
      });

      // Ensure we have admin access
      if (user?.role !== 'admin') {
        throw new Error('Solo los administradores pueden crear actividades');
      }

      // Handle image - either URL or file upload to Supabase Storage
      let finalImageUrl = formData.image_url || '/grupo-canadienses.jpg';
      
      if (selectedFile) {
        try {
          console.log('📷 Uploading image file to Supabase Storage...');
          // Import the storage API directly from supabase
          const { storageAPI } = await import('../lib/supabase-singleton.js');
          
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `activity_${timestamp}_${selectedFile.name}`;
          
          // Upload to Supabase Storage
          const uploadResult = await storageAPI.uploadImage(
            selectedFile, 
            userId, 
            null, // activity_id will be null for new activities
            filename
          );
          
          finalImageUrl = uploadResult.url;
          console.log('✅ Image file uploaded successfully:', finalImageUrl);
        } catch (uploadError) {
          console.error('❌ Image file upload failed:', uploadError);
          // Use preview as fallback for now
          finalImageUrl = imagePreview || formData.image_url || '/grupo-canadienses.jpg';
          console.log('⚠️ Using fallback image URL:', finalImageUrl);
        }
      } else if (formData.image_url && formData.image_url.startsWith('http')) {
        // URL provided - validate it before using
        console.log('🔗 Validating provided image URL:', formData.image_url);
        const { storageAPI } = await import('../lib/supabase-singleton.js');
        finalImageUrl = await storageAPI.getWorkingImageUrl(formData.image_url);
        console.log('✅ Using validated image URL:', finalImageUrl);
      }

      // Prepare activity data with proper date formatting and user ID
      const activityData = {
        ...formData,
        created_by: userId, // Use current user ID
        requirements: formData.requirements.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(formData.max_volunteers) || null,
        // Ensure proper date format
        date_start: formData.start_date, // Supabase uses date_start
        date_end: formData.end_date || formData.start_date, // Supabase uses date_end
        // Use uploaded image URL or fallback
        image_url: finalImageUrl,
        current_volunteers: 0,
        // Ensure proper category assignment
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        // Force public visibility and active status for new activities
        visibility: 'public',
        status: formData.status || 'active'
      };

      console.log('🚀 Creating activity with enhanced data:', activityData);
      const result = await activitiesAPI.createActivity(activityData);
      console.log('✅ Activity created successfully:', result);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        detailed_description: '',
        category_id: '',
        status: 'planning',
        priority: 'medium',
        location: '',
        start_date: '',
        end_date: '',
        max_volunteers: '',
        image_url: '',
        requirements: [],
        benefits: [],
        visibility: 'public',
        featured: false
      });
      
      resetImageStates();
      setShowCreateForm(false);
      await loadAdminData(); // Reload activities
      alert('¡Actividad creada exitosamente! La actividad está ahora disponible para voluntarios.');
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error al crear la actividad. Por favor, intenta nuevamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      detailed_description: activity.detailed_description || '',
      category_id: activity.category_id || '',
      status: activity.status || 'planning',
      priority: activity.priority || 'medium',
      location: activity.location || '',
      start_date: activity.start_date || '',
      end_date: activity.end_date || '',
      max_volunteers: activity.max_volunteers || '',
      image_url: activity.image_url || '',
      requirements: activity.requirements || [],
      benefits: activity.benefits || [],
      visibility: activity.visibility || 'public',
      featured: activity.featured || false
    });

    // Set image states for editing
    if (activity.image_url) {
      if (activity.image_url.startsWith('data:')) {
        setImageOption('upload');
        setImagePreview(activity.image_url);
      } else {
        setImageOption('url');
      }
    } else {
      resetImageStates();
    }
    
    setShowCreateForm(true);
  };

  const handleUpdateActivity = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isCreating) {
      console.log('⚠️ Activity update already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Ensure user has admin access
      if (user?.role !== 'admin') {
        throw new Error('Solo los administradores pueden actualizar actividades');
      }

      // Get user ID for image uploads
      const userId = user?.id;

      // Handle image - either URL or file upload to Supabase Storage (same logic as create)
      let finalImageUrl = formData.image_url || editingActivity.image_url || '/grupo-canadienses.jpg';
      
      if (selectedFile) {
        try {
          console.log('📷 Uploading new image file to Supabase Storage for update...');
          // Import the storage API directly from supabase
          const { storageAPI } = await import('../lib/supabase-singleton.js');
          
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `activity_update_${timestamp}_${selectedFile.name}`;
          
          // Upload to Supabase Storage using the existing activity ID
          const uploadResult = await storageAPI.uploadImage(
            selectedFile, 
            userId, 
            editingActivity.id, // Use existing activity ID for proper folder
            filename
          );
          
          finalImageUrl = uploadResult.url;
          console.log('✅ Image file uploaded successfully for update:', finalImageUrl);
        } catch (uploadError) {
          console.error('❌ Image file upload failed during update:', uploadError);
          // Use preview as fallback for now
          finalImageUrl = imagePreview || formData.image_url || editingActivity.image_url || '/grupo-canadienses.jpg';
          console.log('⚠️ Using fallback image URL for update:', finalImageUrl);
        }
      } else if (formData.image_url && formData.image_url.startsWith('http')) {
        // URL provided - validate it before using (same as create)
        console.log('🔗 Validating provided image URL for update:', formData.image_url);
        const { storageAPI } = await import('../lib/supabase-singleton.js');
        finalImageUrl = await storageAPI.getWorkingImageUrl(formData.image_url);
        console.log('✅ Using validated image URL for update:', finalImageUrl);
      }

      // Use category_id directly
      const finalCategoryId = formData.category_id;

      const activityData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(formData.max_volunteers) || null,
        budget: parseFloat(formData.budget) || 0,
        // Ensure proper date fields for Supabase
        date_start: formData.start_date,
        date_end: formData.end_date || formData.start_date,
        // Use processed image URL
        image_url: finalImageUrl,
        category_id: finalCategoryId,
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Updating activity:', editingActivity.id, 'with data:', activityData);
      const result = await activitiesAPI.updateActivity(editingActivity.id, activityData);
      console.log('✅ Activity updated successfully:', result);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        detailed_description: '',
        category_id: '',
        status: 'planning',
        priority: 'medium',
        location: '',
        start_date: '',
        end_date: '',
        max_volunteers: '',
        budget: '',
        image_url: '',
        requirements: [],
        benefits: [],
        visibility: 'public',
        featured: false
      });
      
      resetImageStates();
      setEditingActivity(null);
      setShowCreateForm(false);
      await loadAdminData(); // Reload activities
      alert('¡Actividad actualizada exitosamente!');
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Error al actualizar la actividad: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    // Ensure user has admin access
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden eliminar actividades');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.')) return;
    
    try {
      console.log('🗑️ Deleting activity:', activityId);
      const result = await activitiesAPI.deleteActivity(activityId);
      console.log('✅ Activity deleted successfully:', result);
      
      await loadAdminData();
      alert('✅ Actividad eliminada exitosamente de Supabase');
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      alert('❌ Error al eliminar la actividad: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setShowCreateForm(false);
    resetImageStates();
    setFormData({
      title: '',
      description: '',
      detailed_description: '',
      category_id: '',
      status: 'planning',
      priority: 'medium',
      location: '',
      start_date: '',
      end_date: '',
      max_volunteers: '',
      budget: '',
      image_url: '',
      requirements: [],
      benefits: [],
      visibility: 'public',
      featured: false
    });
  };

  // Helper function to identify authentication method
  const getAuthMethod = (user) => {
    if (user.provider === 'google' || user.google_id) {
      return {
        type: 'google',
        label: 'Google',
        icon: <Globe className="h-3 w-3" />,
        color: 'bg-red-100 text-red-800',
        description: 'Autenticado con Google'
      };
    } else if (user.provider === 'local' || user.provider === 'supabase' || !user.provider) {
      return {
        type: 'casira',
        label: 'CASIRA',
        icon: <Shield className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-800',
        description: 'Registro directo en CASIRA'
      };
    }
    return {
      type: 'unknown',
      label: 'Desconocido',
      icon: <AlertCircle className="h-3 w-3" />,
      color: 'bg-gray-100 text-gray-800',
      description: 'Método de autenticación desconocido'
    };
  };

  // Enhanced user details handler
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de que quieres resetear todos los datos a los valores por defecto? Esta acción no se puede deshacer.')) {
      resetDataToDefaults();
      loadAdminData(); // Reload data after reset
      alert('Datos reseteados exitosamente');
    }
  };

  // Functions for managing registrations and notifications - SUPABASE ONLY
  const handleApproveVolunteer = async (requestId) => {
    try {
      console.log('🔄 ADMIN: Approving volunteer request in Supabase:', requestId);
      
      // Usar el nuevo servicio de notificaciones que maneja todo en Supabase
      const { default: notificationsService } = await import('../lib/services/notifications.service.js');
      
      const result = await notificationsService.approveVolunteerRequest(requestId);
      console.log('✅ ADMIN: Approval result:', result);
      
      await loadAdminData(); // Reload data from Supabase
      alert('✅ Voluntario aprobado exitosamente. El usuario ha sido notificado y puede comenzar a participar.');
    } catch (error) {
      console.error('❌ ADMIN: Error approving volunteer:', error);
      alert(`Error al aprobar voluntario: ${error.message}`);
    }
  };

  const handleRejectVolunteer = async (requestId, reason = '') => {
    try {
      const rejectionReason = reason || prompt('¿Razón del rechazo? (opcional)\nEsto ayudará al usuario a entender el motivo.') || 'No especificada';
      
      console.log('🔄 ADMIN: Rejecting volunteer request in Supabase:', requestId, 'with reason:', rejectionReason);
      
      // Usar el nuevo servicio de notificaciones que maneja todo en Supabase
      const { default: notificationsService } = await import('../lib/services/notifications.service.js');
      
      const result = await notificationsService.rejectVolunteerRequest(requestId, rejectionReason);
      console.log('✅ ADMIN: Rejection result:', result);
      
      await loadAdminData(); // Reload data from Supabase
      alert('❌ Solicitud rechazada. El usuario ha sido notificado con la razón proporcionada.');
    } catch (error) {
      console.error('❌ ADMIN: Error rejecting volunteer:', error);
      alert(`Error al rechazar voluntario: ${error.message}`);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const user = Array.isArray(allUsers) ? allUsers.find(u => u.id == userId) : null;
      const userName = user ? `${user.first_name} ${user.last_name}` : 'este usuario';
      
      if (!confirm(`¿Estás seguro de que quieres bloquear a ${userName}?\n\nEsta acción impedirá que el usuario acceda al sistema.`)) return;
      
      console.log('Blocking user:', userId);
      await adminService.blockUser(userId);
      await loadAdminData(); // Reload data
      alert(`✅ Usuario ${userName} bloqueado exitosamente.\n\nEl usuario no podrá acceder al sistema hasta que sea desbloqueado.`);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error al bloquear usuario. Por favor, intenta nuevamente.');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const user = Array.isArray(allUsers) ? allUsers.find(u => u.id == userId) : null;
      const userName = user ? `${user.first_name} ${user.last_name}` : 'este usuario';
      
      console.log('Unblocking user:', userId);
      await adminService.unblockUser(userId);
      await loadAdminData(); // Reload data
      alert(`✅ Usuario ${userName} desbloqueado exitosamente.\n\nEl usuario puede acceder normalmente al sistema.`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error al desbloquear usuario. Por favor, intenta nuevamente.');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const user = Array.isArray(allUsers) ? allUsers.find(u => u.id == userId) : null;
      const userName = user ? `${user.first_name} ${user.last_name}` : 'este usuario';
      
      const roleNames = {
        'visitor': 'Visitante',
        'volunteer': 'Voluntario',
        'donor': 'Donante',
        'admin': 'Administrador'
      };
      
      if (!confirm(`¿Cambiar el rol de ${userName} a ${roleNames[newRole] || newRole}?`)) return;
      
      console.log('Changing user role:', userId, 'to', newRole);
      await adminService.updateUserRole(userId, newRole);
      await loadAdminData(); // Reload data
      alert(`✅ Rol de ${userName} cambiado exitosamente a ${roleNames[newRole] || newRole}.`);
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Error al cambiar rol del usuario. Por favor, intenta nuevamente.');
    }
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      const registration = Array.isArray(registrations) ? registrations.find(r => r.id == registrationId) : null;
      let user = null;
      let userName = 'este usuario';
      
      if (registration) {
        if (registration.source === 'localStorage' && registration.user_email) {
          // Use embedded user data for localStorage requests
          userName = registration.user_name || registration.user_email;
        } else {
          // For Supabase requests, find user in allUsers array
          user = Array.isArray(allUsers) ? allUsers.find(u => u.id == registration.user_id || u.email === registration.user_id) : null;
          userName = user ? `${user.first_name} ${user.last_name}` : 'este usuario';
        }
      }
      
      if (!confirm(`¿Estás seguro de que quieres aprobar el registro de ${userName}?`)) return;
      
      console.log('Approving registration:', registrationId);
      await adminService.approveRegistration(registrationId);
      await loadAdminData(); // Reload data
      alert(`✅ Registro de ${userName} aprobado exitosamente.`);
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Error al aprobar registro. Por favor, intenta nuevamente.');
    }
  };

  const handleRejectRegistration = async (registrationId, reason = '') => {
    try {
      const registration = Array.isArray(registrations) ? registrations.find(r => r.id == registrationId) : null;
      let user = null;
      let userName = 'este usuario';
      
      if (registration) {
        if (registration.source === 'localStorage' && registration.user_email) {
          // Use embedded user data for localStorage requests
          userName = registration.user_name || registration.user_email;
        } else {
          // For Supabase requests, find user in allUsers array
          user = Array.isArray(allUsers) ? allUsers.find(u => u.id == registration.user_id || u.email === registration.user_id) : null;
          userName = user ? `${user.first_name} ${user.last_name}` : 'este usuario';
        }
      }
      
      const rejectionReason = reason || prompt('¿Razón del rechazo? (opcional)\nEsto ayudará al usuario a entender el motivo.') || 'No especificada';
      
      if (!confirm(`¿Estás seguro de que quieres rechazar el registro de ${userName}?\n\nRazón: ${rejectionReason}`)) return;
      
      console.log('Rejecting registration:', registrationId, 'Reason:', rejectionReason);
      await adminService.rejectRegistration(registrationId, rejectionReason);
      await loadAdminData(); // Reload data
      alert(`✅ Registro de ${userName} rechazado exitosamente.`);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Error al rechazar registro. Por favor, intenta nuevamente.');
    }
  };

  const handleRemoveFromActivity = async (registrationId, activityId) => {
    try {
      if (!confirm('¿Estás seguro de que quieres remover este usuario de la actividad?')) return;
      await volunteersAPI.removeFromActivity(registrationId, activityId);
      await loadAdminData(); // Reload data
      alert('Usuario removido de la actividad');
    } catch (error) {
      console.error('Error removing user from activity:', error);
      alert('Error al remover usuario: ' + error.message);
    }
  };

  const tabs = [
    { id: 'activities', label: 'Actividades', icon: Calendar },
    { id: 'registrations', label: 'Solicitudes', icon: Bell, badge: Array.isArray(notifications) ? notifications.filter(n => n.status === 'pending').length : 0 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mr-4 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="CASIRA Logo" 
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-sm items-center justify-center hidden">
                    <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">CASIRA Connect</p>
                </div>
              </div>
              {/* Mobile Logout Button */}
              <div className="sm:hidden">
                <LogoutButton 
                  user={user}
                  style="button"
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm btn-touch"
                  showText={false}
                />
              </div>
            </div>
            
            {/* Desktop Right Side */}
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'online' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`}></div>
                <span className="text-xs text-gray-600">
                  {connectionStatus === 'online' ? 'En línea' :
                   connectionStatus === 'offline' ? 'Offline' : 'Verificando...'}
                </span>
                <button
                  onClick={async () => { 
                    setIsSyncing(true);
                    await checkConnectionStatus(); 
                    await loadAdminData(); 
                    setIsSyncing(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50 btn-touch"
                  title="Sincronizar datos"
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <span className="text-sm text-gray-700 hidden lg:block">
                {user?.first_name} {user?.last_name}
              </span>
              <LogoutButton 
                user={user}
                style="button"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 btn-touch"
              />
            </div>
            
            {/* Mobile Connection Status */}
            <div className="flex sm:hidden items-center justify-center space-x-2 bg-gray-50 rounded-lg p-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'online' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <span className="text-xs text-gray-600">
                {connectionStatus === 'online' ? 'En línea' :
                 connectionStatus === 'offline' ? 'Modo Offline' : 'Conectando...'}
              </span>
              <button
                onClick={async () => { 
                  setIsSyncing(true);
                  await checkConnectionStatus(); 
                  await loadAdminData(); 
                  setIsSyncing(false);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50 btn-touch"
                disabled={isSyncing}
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Offline Banner - Mobile Optimized */}
        {connectionStatus === 'offline' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-yellow-800 mb-1">Modo Offline</h3>
                  <p className="text-sm text-yellow-700 leading-relaxed">
                    Trabajando con datos locales. Los cambios se sincronizarán cuando se restablezca la conexión.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => { 
                  setIsSyncing(true);
                  await checkConnectionStatus(); 
                  await loadAdminData(); 
                  setIsSyncing(false);
                }}
                className="sm:ml-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm font-medium disabled:opacity-50 btn-touch flex-shrink-0 transition-colors"
                disabled={isSyncing}
              >
                {isSyncing ? 'Conectando...' : 'Reintentar'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-600">Activas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active_projects || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-600">Completadas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed_projects || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Voluntarios</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_volunteers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Impacto</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lives_transformed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="sm:hidden">
            <nav className="flex overflow-x-auto scrollbar-hide px-1 py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 py-3 px-4 mx-1 rounded-lg font-semibold text-sm flex items-center justify-center relative transition-all duration-200 btn-touch ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-6 lg:space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-semibold text-sm flex items-center relative transition-all duration-200 btn-touch ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 transform translate-y-0.5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'activities' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Gestión de Actividades</h3>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Actividad
                  </button>
                </div>

                {/* Quick Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Activas</p>
                        <p className="text-2xl font-bold text-green-700">
                          {Array.isArray(activities) ? activities.filter(a => a.status === 'active').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-green-200 rounded-lg">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">En Planificación</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {Array.isArray(activities) ? activities.filter(a => a.status === 'planning').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Total Voluntarios</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {Array.isArray(registrations) ? registrations.filter(r => r.status === 'registered').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-200 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activities Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actividad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Voluntarios
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(activities) ? activities.map((activity) => (
                        <tr key={activity.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={activity.image_url || '/logo.png'}
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                                <div className="text-sm text-gray-500">{activity.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activity.status === 'active' ? 'bg-green-100 text-green-800' :
                              activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              activity.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.current_volunteers >= activity.max_volunteers 
                                  ? 'bg-red-100 text-red-800' 
                                  : activity.current_volunteers > (activity.max_volunteers * 0.8) 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {activity.current_volunteers || 0} / {activity.max_volunteers || '∞'}
                              </span>
                              {activity.current_volunteers > 0 && Array.isArray(registrations) && (
                                <div className="ml-2 flex -space-x-1">
                                  {registrations
                                    .filter(r => r.activity_id === activity.id && r.status === 'registered')
                                    .slice(0, 3)
                                    .map((registration, idx) => {
                                      let user = null;
                                      let displayName = 'Usuario';
                                      let firstChar = '?';
                                      
                                      if (registration.source === 'localStorage' && registration.user_email) {
                                        // Use embedded user data for localStorage requests
                                        displayName = registration.user_name || registration.user_email;
                                        firstChar = displayName.charAt(0).toUpperCase();
                                      } else {
                                        // For Supabase requests, find user in allUsers array
                                        user = Array.isArray(allUsers) ? allUsers.find(u => u.id == registration.user_id) : null;
                                        displayName = user ? `${user.first_name} ${user.last_name}` : 'Usuario';
                                        firstChar = user?.first_name?.charAt(0) || '?';
                                      }
                                      
                                      return (
                                        <div key={idx} className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border border-white" title={displayName}>
                                          {firstChar}
                                        </div>
                                      );
                                    })
                                  }
                                  {registrations.filter(r => r.activity_id === activity.id && r.status === 'registered').length > 3 && (
                                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border border-white">
                                      +{registrations.filter(r => r.activity_id === activity.id && r.status === 'registered').length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'No definida'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditActivity(activity)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No hay actividades disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'registrations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Gestión de Solicitudes y Registros</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{Array.isArray(notifications) ? notifications.filter(n => n.status === 'pending').length : 0} pendientes</span>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">📨 Solicitudes Pendientes</h4>
                  {Array.isArray(notifications) && notifications.filter(n => n.status === 'pending').length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700">¡No hay solicitudes pendientes!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(notifications) ? notifications.filter(n => n.status === 'pending').map((notification) => {
                        const user = Array.isArray(allUsers) ? allUsers.find(u => u.id == notification.user_id) : null;
                        const activity = Array.isArray(activities) ? activities.find(a => a.id == notification.activity_id) : null;
                        
                        return (
                          <div key={notification.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                      {user?.first_name?.charAt(0) || '?'}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {user ? `${user.first_name} ${user.last_name}` : 'Usuario Desconocido'}
                                    </h5>
                                    <p className="text-xs text-gray-600">{user?.email}</p>
                                    <div className="mt-1">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user?.role === 'volunteer' ? 'bg-green-100 text-green-800' : 
                                        user?.role === 'visitor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {user?.role || 'unknown'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                <div className="text-xs text-gray-500">
                                  📅 Actividad: <strong>{activity?.title || 'Actividad eliminada'}</strong>
                                </div>
                                <div className="text-xs text-gray-500">
                                  🕒 {new Date(notification.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => handleApproveVolunteer(notification.id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => handleRejectVolunteer(notification.id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-500">No hay solicitudes disponibles</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* All Registrations Table */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">👥 Todos los Registros</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actividad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(registrations) ? registrations.map((registration) => {
                          // For localStorage requests, user data is embedded in the registration object
                          let user = null;
                          if (registration.source === 'localStorage' && registration.user_email) {
                            // Use embedded user data for localStorage requests
                            user = {
                              id: registration.user_id,
                              email: registration.user_email,
                              first_name: registration.user_name?.split(' ')[0] || registration.user_email?.split('@')[0] || 'Usuario',
                              last_name: registration.user_name?.split(' ').slice(1).join(' ') || '',
                              full_name: registration.user_name || registration.user_email,
                              avatar_url: registration.user_avatar,
                              role: 'visitor' // Default role for localStorage users
                            };
                          } else {
                            // For Supabase requests, find user in allUsers array
                            user = Array.isArray(allUsers) ? allUsers.find(u => u.id == registration.user_id || u.email === registration.user_id) : null;
                          }
                          // For localStorage requests, activity data may be embedded
                          let activity = null;
                          if (registration.source === 'localStorage' && registration.activity_title) {
                            // Use embedded activity data for localStorage requests
                            activity = {
                              id: registration.activity_id,
                              title: registration.activity_title,
                              description: `Actividad: ${registration.activity_title}`
                            };
                          } else {
                            // For Supabase requests, find activity in activities array
                            activity = Array.isArray(activities) ? activities.find(a => a.id == registration.activity_id) : null;
                          }
                          
                          return (
                            <tr key={registration.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                      {user?.first_name?.charAt(0) || '?'}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user ? `${user.first_name} ${user.last_name}` : 'Usuario Desconocido'}
                                    </div>
                                    <div className="text-sm text-gray-500">{user?.email}</div>
                                    <div className="mt-1">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user?.role === 'volunteer' ? 'bg-green-100 text-green-800' : 
                                        user?.role === 'visitor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {user?.role || 'unknown'}
                                      </span>
                                      {user?.status === 'blocked' && (
                                        <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                          Bloqueado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{activity?.title || 'Actividad eliminada'}</div>
                                <div className="text-sm text-gray-500">{activity?.location}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  registration.status === 'registered' ? 'bg-green-100 text-green-800' :
                                  registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {registration.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(registration.registration_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {registration.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveRegistration(registration.id)}
                                        className="text-green-600 hover:text-green-900"
                                        title="Aprobar registro"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectRegistration(registration.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Rechazar registro"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleRemoveFromActivity(registration.id, registration.activity_id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Remover de actividad"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  {user?.status === 'blocked' ? (
                                    <button
                                      onClick={() => handleUnblockUser(user.id)}
                                      className="text-green-600 hover:text-green-900"
                                      title="Desbloquear usuario"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBlockUser(user.id)}
                                      className="text-yellow-600 hover:text-yellow-900"
                                      title="Bloquear usuario"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                              No hay registros disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Estadísticas y Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium mb-4">Actividades por Estado</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Activas:</span>
                        <span className="font-semibold">{stats.active_projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completadas:</span>
                        <span className="font-semibold">{stats.completed_projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-semibold">{Array.isArray(activities) ? activities.length : 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium mb-4">Participación</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Voluntarios:</span>
                        <span className="font-semibold">{stats.total_volunteers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vidas Transformadas:</span>
                        <span className="font-semibold">{stats.lives_transformed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{Array.isArray(allUsers) ? allUsers.length : 0} usuarios registrados</span>
                    </div>
                    <button
                      onClick={async () => {
                        setIsSyncing(true);
                        console.log('Forcing data refresh...');
                        forceRefreshData();
                        await loadAdminData();
                        setIsSyncing(false);
                        alert('Datos de usuarios actualizados correctamente. ¡Ahora deberías ver todos los usuarios incluyendo visitantes!');
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Actualizando...' : 'Actualizar Datos'}
                    </button>
                  </div>
                </div>

                {/* Users Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Administradores</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'admin').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-200 rounded-lg">
                        <Settings className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Voluntarios</p>
                        <p className="text-2xl font-bold text-green-700">
                          {Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'volunteer').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-green-200 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Donantes</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'donor').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Visitantes</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'visitor').length : 0}
                        </p>
                      </div>
                      <div className="p-2 bg-yellow-200 rounded-lg">
                        <Users className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Lista de Usuarios</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Autenticación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actividades
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Registro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(allUsers) ? allUsers.map((user) => {
                          const userRegistrations = Array.isArray(registrations) ? registrations.filter(r => r.user_id == user.id) : [];
                          const authMethod = getAuthMethod(user);
                          
                          return (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {user.avatar_url && (user.provider === 'google' || user.google_id) ? (
                                      <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={user.avatar_url}
                                        alt={`${user.first_name} ${user.last_name}`}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${user.avatar_url && (user.provider === 'google' || user.google_id) ? 'hidden' : ''}`}>
                                      {user.first_name?.charAt(0) || '?'}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.first_name} {user.last_name}
                                      {authMethod.type === 'google' && (
                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          <Globe className="h-3 w-3 mr-1" />
                                          G
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    {user.phone && (
                                      <div className="text-xs text-gray-400">{user.phone}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'volunteer' ? 'bg-green-100 text-green-800' :
                                  user.role === 'donor' ? 'bg-blue-100 text-blue-800' :
                                  user.role === 'visitor' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role === 'admin' ? '👑 Admin' :
                                   user.role === 'volunteer' ? '🤝 Voluntario' :
                                   user.role === 'donor' ? '💝 Donante' :
                                   user.role === 'visitor' ? '👀 Visitante' : user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${authMethod.color}`}>
                                    {authMethod.icon}
                                    <span className="ml-1">{authMethod.label}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {user.status === 'blocked' ? '🚫 Bloqueado' : '✅ Activo'}
                                  </span>
                                  {user.blocked_at && (
                                    <span className="text-xs text-gray-400 mt-1">
                                      Desde: {new Date(user.blocked_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <span className="font-medium">{userRegistrations.length}</span>
                                  <span className="ml-1 text-gray-500">actividades</span>
                                  {userRegistrations.length > 0 && (
                                    <div className="ml-2 flex -space-x-1">
                                      {userRegistrations.slice(0, 3).map((reg, idx) => {
                                        const activity = Array.isArray(activities) ? activities.find(a => a.id == reg.activity_id) : null;
                                        return (
                                          <div 
                                            key={idx} 
                                            className="w-4 h-4 bg-blue-500 rounded-full border border-white text-xs"
                                            title={activity?.title || 'Actividad'}
                                          ></div>
                                        );
                                      })}
                                      {userRegistrations.length > 3 && (
                                        <div className="w-4 h-4 bg-gray-400 rounded-full border border-white flex items-center justify-center text-xs text-white">
                                          +{userRegistrations.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {user.role !== 'admin' && (
                                    <>
                                      {user.status === 'blocked' ? (
                                        <button
                                          onClick={() => handleUnblockUser(user.id)}
                                          className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                          title="Desbloquear usuario"
                                        >
                                          Desbloquear
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleBlockUser(user.id)}
                                          className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                                          title="Bloquear usuario"
                                        >
                                          Bloquear
                                        </button>
                                      )}
                                      
                                      {/* Role Change Dropdown */}
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value !== user.role) {
                                            handleChangeUserRole(user.id, e.target.value);
                                            e.target.value = user.role; // Reset select
                                          }
                                        }}
                                        defaultValue={user.role}
                                        className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border-0 cursor-pointer hover:bg-blue-100"
                                        title="Cambiar rol de usuario"
                                      >
                                        <option value={user.role} disabled>Cambiar rol...</option>
                                        {user.role !== 'visitor' && <option value="visitor">👀 Visitante</option>}
                                        {user.role !== 'volunteer' && <option value="volunteer">🤝 Voluntario</option>}
                                        {user.role !== 'donor' && <option value="donor">💝 Donante</option>}
                                      </select>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleViewUserDetails(user)}
                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                    title="Ver detalles"
                                  >
                                    Detalles
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                              No hay usuarios disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración del Sistema</h3>
                
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Gestión de Datos</h4>
                  </div>
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Resetear Datos</h5>
                        <p className="text-sm text-gray-600 mb-3">
                          Restaura todos los datos a los valores por defecto. Esta acción eliminará todas las actividades, posts y cambios personalizados.
                        </p>
                        <div className="space-x-3">
                          <button
                            onClick={handleResetData}
                            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Resetear a Valores por Defecto
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm('⚠️ ¿Estás seguro de limpiar TODOS los datos?\n\nEsto eliminará:\n- Todas las solicitudes procesadas\n- Historial de notificaciones\n- Registros de voluntarios\n\nEsta acción NO se puede deshacer.')) {
                                cleanStorageData();
                                alert('✅ Datos limpiados. La página se recargará.');
                                window.location.reload();
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Limpiar localStorage
                          </button>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Información de Almacenamiento</h5>
                        <p className="text-sm text-gray-600">
                          Los datos se guardan automáticamente en el navegador. Los cambios persisten entre sesiones.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    {selectedUser.avatar_url && (selectedUser.provider === 'google' || selectedUser.google_id) ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover border-2 border-white"
                        src={selectedUser.avatar_url}
                        alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 bg-gradient-to-r from-white to-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white ${selectedUser.avatar_url && (selectedUser.provider === 'google' || selectedUser.google_id) ? 'hidden' : ''}`}>
                      {selectedUser.first_name?.charAt(0) || '?'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <p className="text-blue-100 text-sm">{selectedUser.email}</p>
                    <div className="flex items-center mt-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        selectedUser.role === 'volunteer' ? 'bg-green-100 text-green-800' :
                        selectedUser.role === 'donor' ? 'bg-blue-100 text-blue-800' :
                        selectedUser.role === 'visitor' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.role === 'admin' ? '👑 Admin' :
                         selectedUser.role === 'volunteer' ? '🤝 Voluntario' :
                         selectedUser.role === 'donor' ? '💝 Donante' :
                         selectedUser.role === 'visitor' ? '👀 Visitante' : selectedUser.role}
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        getAuthMethod(selectedUser).color
                      }`}>
                        {getAuthMethod(selectedUser).icon}
                        <span className="ml-1">{getAuthMethod(selectedUser).label}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-white hover:text-gray-200 rounded-full hover:bg-white hover:bg-opacity-10"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Authentication Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Información de Autenticación
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Autenticación</label>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                        getAuthMethod(selectedUser).color
                      }`}>
                        {getAuthMethod(selectedUser).icon}
                        <span className="ml-1">{getAuthMethod(selectedUser).description}</span>
                      </span>
                    </div>
                  </div>
                  {selectedUser.google_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID de Google</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.google_id}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.provider || 'local'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.status === 'blocked' ? '🚫 Bloqueado' : '✅ Activo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'No disponible'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.location || 'No disponible'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Biografía</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.bio || 'No disponible'}</p>
                  </div>
                </div>
              </div>

              {/* Activity Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Actividad en la Plataforma
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Último Acceso</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actividades Registradas</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">
                      {Array.isArray(registrations) ? registrations.filter(r => r.user_id == selectedUser.id).length : 0} actividades
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Information (for Google users) */}
              {(selectedUser.provider === 'google' || selectedUser.google_id) && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-red-600" />
                    Información de Google
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.avatar_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Foto de Perfil</label>
                        <p className="mt-1 text-xs text-gray-500 break-all">{selectedUser.avatar_url}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Verificado</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.verified_email !== undefined ? (selectedUser.verified_email ? '✅ Sí' : '❌ No') : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar
                </button>
                {selectedUser.role !== 'admin' && (
                  <>
                    {selectedUser.status === 'blocked' ? (
                      <button
                        onClick={() => {
                          handleUnblockUser(selectedUser.id);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Desbloquear Usuario
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleBlockUser(selectedUser.id);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Bloquear Usuario
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200">
            {/* Header más compacto */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="CASIRA" 
                      className="w-10 h-10 object-contain drop-shadow-sm"
                      onError={(e) => {
                        // Fallback al icono SVG si el logo no carga
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <svg 
                      className="w-5 h-5 text-white hidden" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ display: 'none' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                    </h3>
                    <p className="text-blue-100 text-xs">
                      {editingActivity ? 'Modifica los detalles' : 'Crea una nueva oportunidad'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6">
              <h3 className="sr-only">
                {editingActivity ? 'Editar Actividad' : 'Crear Nueva Actividad'}
              </h3>
              <form onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity} className="space-y-4">
                {/* Información básica */}
                <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400"
                        placeholder="Ej: Construcción de Escuela Rural"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Descripción Breve *
                      </label>
                      <textarea
                        required
                        rows="2"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
                        placeholder="Describe brevemente el propósito y alcance..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Descripción Detallada
                      </label>
                      <textarea
                        rows="3"
                        value={formData.detailed_description}
                        onChange={(e) => setFormData({...formData, detailed_description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
                        placeholder="Objetivos específicos, metodología, beneficiarios..."
                      />
                    </div>
                  </div>
                </div>

                {/* Configuración */}
                <div className="bg-green-50 rounded-md p-4 border border-green-200">
                  <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Categoría
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 bg-white"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 bg-white"
                      >
                        <option value="planning">📋 Planificación</option>
                        <option value="active">✅ Activa</option>
                        <option value="completed">🎉 Completada</option>
                        <option value="cancelled">❌ Cancelada</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prioridad
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 bg-white"
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">🟡 Media</option>
                        <option value="high">🟠 Alta</option>
                        <option value="urgent">🔴 Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ubicación y fechas */}
                <div className="bg-purple-50 rounded-md p-4 border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ubicación y Cronograma
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ubicación *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400"
                        placeholder="Ej: Guatemala Ciudad, Zona 1, Centro Comunitario"
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
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de Fin
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900"
                          min={formData.start_date || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Máximo de Voluntarios
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.max_volunteers}
                          onChange={(e) => setFormData({...formData, max_volunteers: e.target.value})}
                          className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400"
                          placeholder="Voluntarios ilimitados"
                        />
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-gray-500 pb-3">Dejar vacío para permitir voluntarios ilimitados</p>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-xs text-gray-500">Dejar vacío para permitir voluntarios ilimitados</p>
                    </div>
                  </div>
                </div>

                {/* Imagen y opciones */}
                <div className="bg-orange-50 rounded-md p-4 border border-orange-200">
                  <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Imagen y Opciones
                  </h4>
                  
                  {/* Image option selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="imageOption"
                        value="url"
                        checked={imageOption === 'url'}
                        onChange={() => handleImageOptionChange('url')}
                        className="mr-3 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">URL de Imagen</div>
                        <div className="text-xs text-gray-500">Desde internet</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="imageOption"
                        value="upload"
                        checked={imageOption === 'upload'}
                        onChange={() => handleImageOptionChange('upload')}
                        className="mr-3 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Subir Archivo</div>
                        <div className="text-xs text-gray-500">Desde computadora</div>
                      </div>
                    </label>
                  </div>

                  {/* URL Input */}
                  {imageOption === 'url' && (
                    <div className="mb-4">
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  {imageOption === 'upload' && (
                    <div className="mb-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-2 text-xs text-gray-500">PNG, JPG, WebP hasta 5MB</p>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(imagePreview || (imageOption === 'url' && formData.image_url)) && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                      <div className="flex justify-center">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Vista previa"
                          className="h-32 w-32 object-cover rounded-lg border shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Featured checkbox */}
                  <div className="flex items-center p-3 bg-white rounded-md border border-gray-300">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">Destacar en portada</div>
                      <div className="text-xs text-gray-500">La actividad aparecerá destacada para usuarios</div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-gray-200"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-200 ${
                      isCreating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {isCreating 
                      ? (editingActivity ? '⏳ Actualizando...' : '⏳ Creando...') 
                      : (editingActivity ? '✅ Actualizar Actividad' : '✨ Crear Actividad')
                    }
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

export default AdminDashboard;