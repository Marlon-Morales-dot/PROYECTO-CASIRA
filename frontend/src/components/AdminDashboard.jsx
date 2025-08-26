import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { activitiesAPI, categoriesAPI, statsAPI } from '@/lib/api.js';

const AdminDashboard = ({ user, onLogout }) => {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('activities');
  const [isLoading, setIsLoading] = useState(true);

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
    budget: '',
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

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      const [activitiesData, categoriesData, statsData] = await Promise.all([
        activitiesAPI.getPublicActivities(),
        categoriesAPI.getAllCategories(),
        statsAPI.getDashboardStats()
      ]);
      
      setActivities(activitiesData || []);
      setCategories(categoriesData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Error loading admin data:', error);
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
        setFormData(prev => ({ ...prev, image_url: e.target.result }));
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
    try {
      
      const activityData = {
        ...formData,
        created_by: user.id,
        requirements: formData.requirements.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(formData.max_volunteers) || null,
        budget: parseFloat(formData.budget) || null
      };

      await activitiesAPI.createActivity(activityData);
      
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
      setShowCreateForm(false);
      await loadAdminData(); // Reload activities
      alert('¡Actividad creada exitosamente!');
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error al crear la actividad: ' + error.message);
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
      budget: activity.budget || '',
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
    try {
      const activityData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        max_volunteers: parseInt(formData.max_volunteers) || null,
        budget: parseFloat(formData.budget) || null
      };

      await activitiesAPI.updateActivity(editingActivity.id, activityData);
      
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
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;
    
    try {
      await activitiesAPI.deleteActivity(activityId);
      await loadAdminData();
      alert('Actividad eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error al eliminar la actividad: ' + error.message);
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

  const tabs = [
    { id: 'activities', label: 'Actividades', icon: Calendar },
    { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Users },
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
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="AMISTAD CASIRA" className="h-10 w-auto object-contain mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">AMISTAD CASIRA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Administrador: {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active_projects}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed_projects}</p>
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
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
                      {activities.map((activity) => (
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
                            {activity.current_volunteers || 0} / {activity.max_volunteers || '∞'}
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
                      ))}
                    </tbody>
                  </table>
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
                        <span className="font-semibold">{activities.length}</span>
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
                <h3 className="text-lg font-medium text-gray-900 mb-6">Gestión de Usuarios</h3>
                <p className="text-gray-600">Funcionalidad de gestión de usuarios en desarrollo.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración del Sistema</h3>
                <p className="text-gray-600">Configuraciones del sistema en desarrollo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Activity Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingActivity ? 'Editar Actividad' : 'Crear Nueva Actividad'}
              </h3>
              <form onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="planning">Planificación</option>
                      <option value="active">Activa</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Máx. Voluntarios</label>
                    <input
                      type="number"
                      value={formData.max_volunteers}
                      onChange={(e) => setFormData({...formData, max_volunteers: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Presupuesto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Imagen de la Actividad</label>
                  
                  {/* Image option selector */}
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageOption"
                        value="url"
                        checked={imageOption === 'url'}
                        onChange={() => handleImageOptionChange('url')}
                        className="mr-2"
                      />
                      URL de Imagen
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageOption"
                        value="upload"
                        checked={imageOption === 'upload'}
                        onChange={() => handleImageOptionChange('upload')}
                        className="mr-2"
                      />
                      Subir desde Equipo
                    </label>
                  </div>

                  {/* URL Input */}
                  {imageOption === 'url' && (
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  )}

                  {/* File Upload */}
                  {imageOption === 'upload' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, WebP hasta 5MB
                      </p>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(imagePreview || (imageOption === 'url' && formData.image_url)) && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Vista previa"
                        className="h-32 w-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                    Destacar en portada
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingActivity ? 'Actualizar Actividad' : 'Crear Actividad'}
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