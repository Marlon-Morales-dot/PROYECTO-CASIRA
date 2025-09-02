import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, Calendar, MapPin, Users, MessageCircle, Phone, Star, Award } from 'lucide-react';
import { volunteersAPI, activitiesAPI } from '@/lib/api.js';

const VolunteerResponsibilities = ({ user }) => {
  const [responsibilities, setResponsibilities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (user) {
      loadResponsibilities();
    }
  }, [user]);

  const loadResponsibilities = async () => {
    try {
      setIsLoading(true);
      
      // Cargar actividades donde el usuario es voluntario confirmado
      const userRegistrations = await volunteersAPI.getUserRegistrations(user.id);
      const confirmedActivities = userRegistrations.filter(r => r.status === 'confirmed');
      
      // Cargar detalles de las actividades
      const activitiesData = [];
      const responsibilitiesData = [];
      
      for (const registration of confirmedActivities) {
        const activity = await activitiesAPI.getActivityById(registration.activity_id);
        if (activity) {
          activitiesData.push(activity);
          
          // Crear responsabilidades específicas para cada actividad
          const activityTasks = generateActivityTasks(activity, registration);
          responsibilitiesData.push(...activityTasks);
        }
      }
      
      setActivities(activitiesData);
      setResponsibilities(responsibilitiesData);
      
      console.log('Loaded responsibilities for user:', user.first_name);
      console.log('Activities:', activitiesData.length);
      console.log('Tasks:', responsibilitiesData.length);
      
    } catch (error) {
      console.error('Error loading responsibilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateActivityTasks = (activity, registration) => {
    const baseTasks = [
      {
        id: `${activity.id}-orientation`,
        activity_id: activity.id,
        title: 'Asistir a Orientación Inicial',
        description: 'Participar en la sesión de orientación para conocer los objetivos, normas y compañeros del proyecto.',
        type: 'meeting',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días
        status: Math.random() > 0.7 ? 'completed' : 'pending',
        estimated_hours: 2,
        location: activity.location,
        coordinator: 'María González'
      },
      {
        id: `${activity.id}-training`,
        activity_id: activity.id,
        title: 'Completar Capacitación Específica',
        description: `Recibir entrenamiento específico para las tareas de ${activity.title}. Incluye protocolos de seguridad y mejores prácticas.`,
        type: 'training',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 semana
        status: Math.random() > 0.5 ? 'completed' : 'pending',
        estimated_hours: 4,
        location: activity.location,
        coordinator: 'Carlos Martínez'
      },
      {
        id: `${activity.id}-weekly-tasks`,
        activity_id: activity.id,
        title: 'Tareas Semanales del Proyecto',
        description: `Realizar las actividades principales del proyecto ${activity.title}. Incluye trabajo de campo, documentación y coordinación con el equipo.`,
        type: 'field_work',
        priority: 'medium',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 semanas
        status: 'in_progress',
        estimated_hours: 8,
        location: activity.location,
        coordinator: 'Ana López'
      },
      {
        id: `${activity.id}-report`,
        activity_id: activity.id,
        title: 'Entregar Reporte de Progreso',
        description: 'Documentar las actividades realizadas, logros alcanzados y desafíos encontrados durante el periodo.',
        type: 'documentation',
        priority: 'medium',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 semanas
        status: 'pending',
        estimated_hours: 2,
        location: 'Virtual',
        coordinator: 'María González'
      }
    ];

    // Personalizar tareas según el tipo de actividad
    if (activity.title.toLowerCase().includes('reforestación')) {
      baseTasks.push({
        id: `${activity.id}-planting`,
        activity_id: activity.id,
        title: 'Jornada de Plantación de Árboles',
        description: 'Participar en la plantación de árboles nativos. Incluye preparación del terreno, siembra y cuidado inicial.',
        type: 'field_work',
        priority: 'high',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        estimated_hours: 6,
        location: activity.location,
        coordinator: 'Equipo de Medio Ambiente'
      });
    }

    if (activity.title.toLowerCase().includes('educación')) {
      baseTasks.push({
        id: `${activity.id}-teaching`,
        activity_id: activity.id,
        title: 'Sesiones de Enseñanza',
        description: 'Impartir clases de apoyo y refuerzo escolar a niños de la comunidad.',
        type: 'teaching',
        priority: 'high',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        estimated_hours: 10,
        location: activity.location,
        coordinator: 'Coordinación Educativa'
      });
    }

    return baseTasks.map(task => ({ ...task, activity }));
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'training':
        return <Award className="h-5 w-5 text-purple-600" />;
      case 'field_work':
        return <MapPin className="h-5 w-5 text-green-600" />;
      case 'documentation':
        return <MessageCircle className="h-5 w-5 text-orange-600" />;
      case 'teaching':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return `Vencida hace ${Math.abs(diffInDays)} días`;
    if (diffInDays === 0) return 'Vence hoy';
    if (diffInDays === 1) return 'Vence mañana';
    return `Vence en ${diffInDays} días`;
  };

  const markTaskCompleted = (taskId) => {
    setResponsibilities(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: 'completed' } : task
      )
    );
    alert('¡Tarea marcada como completada! 🎉');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando responsabilidades...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = responsibilities.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = responsibilities.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{activities.length}</div>
          <div className="text-blue-100">Proyectos Activos</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{pendingTasks.length}</div>
          <div className="text-yellow-100">Tareas Pendientes</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{completedTasks.length}</div>
          <div className="text-green-100">Tareas Completadas</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {responsibilities.reduce((total, task) => total + (task.estimated_hours || 0), 0)}h
          </div>
          <div className="text-purple-100">Horas Totales</div>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Tareas Pendientes</h3>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingTasks.length} pendientes
            </span>
          </div>
          
          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">{getTaskIcon(task.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' ? 'Pendiente' : 
                           task.status === 'in_progress' ? 'En Progreso' : 
                           task.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      
                      <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDueDate(task.due_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.estimated_hours}h estimadas</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{task.coordinator}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-blue-600">
                        📂 {task.activity.title}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Ver detalles
                    </button>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => markTaskCompleted(task.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Marcar completa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Tareas Completadas</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {completedTasks.length} completadas
            </span>
          </div>
          
          <div className="space-y-3">
            {completedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center space-x-3 py-2 border-b border-gray-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <span className="text-gray-700 line-through">{task.title}</span>
                  <span className="text-xs text-gray-500 ml-2">({task.activity.title})</span>
                </div>
                <span className="text-xs text-gray-400">Completada</span>
              </div>
            ))}
          </div>
          
          {completedTasks.length > 5 && (
            <button className="text-blue-600 hover:text-blue-800 text-sm underline mt-3">
              Ver todas las tareas completadas ({completedTasks.length})
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {responsibilities.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay responsabilidades asignadas</h3>
          <p className="text-gray-500 mb-4">
            Una vez que seas confirmado en actividades, aparecerán aquí tus tareas y responsabilidades específicas.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Explorar Actividades
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">{selectedTask.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Prioridad:</span>
                  <span className="ml-2">{selectedTask.priority}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fecha límite:</span>
                  <span className="ml-2">{formatDueDate(selectedTask.due_date)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Horas estimadas:</span>
                  <span className="ml-2">{selectedTask.estimated_hours}h</span>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Proyecto:</span>
                <span className="ml-2">{selectedTask.activity.title}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Coordinador:</span>
                <span className="ml-2">{selectedTask.coordinator}</span>
              </div>
              
              <div className="flex items-center space-x-3 pt-4">
                {selectedTask.status === 'pending' && (
                  <button
                    onClick={() => {
                      markTaskCompleted(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Marcar como Completada
                  </button>
                )}
                
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Phone className="h-4 w-4" />
                  <span>Contactar Coordinador</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerResponsibilities;