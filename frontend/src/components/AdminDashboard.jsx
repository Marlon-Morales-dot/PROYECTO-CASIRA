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
      
      setShowCreateForm(false);
      await loadAdminData(); // Reload activities
      alert('¡Actividad creada exitosamente!');
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error al crear la actividad: ' + error.message);
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
                              onClick={() => setEditingActivity(activity)}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Actividad</h3>
              <form onSubmit={handleCreateActivity} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Máx. Voluntarios</label>
                    <input
                      type="number"
                      value={formData.max_volunteers}
                      onChange={(e) => setFormData({...formData, max_volunteers: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Crear Actividad
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