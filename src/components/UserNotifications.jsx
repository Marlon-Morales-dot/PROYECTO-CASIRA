import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, X, AlertCircle, Heart, MessageCircle, Users } from 'lucide-react';
import { notificationsAPI, volunteersAPI, dataStore } from '@/lib/api.js';

const UserNotifications = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserNotifications();
    }
  }, [user]);

  const loadUserNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Cargar notificaciones específicas del usuario
      let userNotifications = [];
      
      // Si es visitante, obtener estado de sus solicitudes
      if (user.role === 'visitor') {
        const registrations = await volunteersAPI.getUserRegistrations(user.id);
        
        userNotifications = registrations.map(registration => {
          const activity = dataStore?.activities?.find(a => a.id == registration.activity_id);
          
          return {
            id: `reg-${registration.id}`,
            type: registration.status === 'confirmed' ? 'request_approved' : 'request_pending',
            title: registration.status === 'confirmed' ? 
              '✅ ¡Solicitud Aprobada!' : 
              '⏳ Solicitud en Revisión',
            message: registration.status === 'confirmed' ? 
              `Tu solicitud para "${activity?.title || 'la actividad'}" ha sido aprobada. ¡Bienvenido al equipo!` :
              `Tu solicitud para "${activity?.title || 'la actividad'}" está siendo revisada por nuestro equipo.`,
            created_at: registration.registration_date,
            read: false,
            activity: activity,
            status: registration.status
          };
        });
      }
      
      // Si es voluntario, mostrar responsabilidades y actualizaciones
      if (user.role === 'volunteer' || user.role === 'donor') {
        const registrations = await volunteersAPI.getUserRegistrations(user.id);
        
        // Notificaciones de responsabilidades
        const responsibilityNotifications = registrations
          .filter(r => r.status === 'confirmed')
          .map(registration => {
            const activity = dataStore?.activities?.find(a => a.id == registration.activity_id);
            
            return {
              id: `resp-${registration.id}`,
              type: 'responsibility',
              title: '📋 Tienes Responsabilidades Pendientes',
              message: `Como voluntario confirmado en "${activity?.title}", tienes tareas asignadas que requieren tu atención.`,
              created_at: registration.registration_date,
              read: false,
              activity: activity,
              status: registration.status
            };
          });
        
        userNotifications.push(...responsibilityNotifications);
      }
      
      // Agregar notificaciones sociales (likes, comentarios)
      const socialNotifications = [
        {
          id: 'social-1',
          type: 'social',
          title: '❤️ Tu Participación Está Generando Impacto',
          message: 'Tus contribuciones han recibido 15 me gusta esta semana. ¡La comunidad aprecia tu compromiso!',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 'social-2',
          type: 'social',
          title: '💬 Nuevos Comentarios en tus Actividades',
          message: '3 personas han comentado en las actividades donde participas. ¡Ve las conversaciones!',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: false
        }
      ];
      
      if (user.role !== 'admin') {
        userNotifications.push(...socialNotifications);
      }
      
      // Ordenar por fecha (más recientes primero)
      userNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
      
      console.log('Loaded user notifications:', userNotifications.length);
      
    } catch (error) {
      console.error('Error loading user notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'request_pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'responsibility':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'social':
        return <Heart className="h-5 w-5 text-pink-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
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
      <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Marcar todo como leído
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-600 font-medium mb-2">No hay notificaciones</h4>
            <p className="text-gray-500 text-sm">Te notificaremos cuando tengas actualizaciones importantes.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Activity Info */}
                    {notification.activity && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <div className="flex items-center space-x-2">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{notification.activity.title}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">{notification.activity.location}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons for certain notifications */}
                    {notification.type === 'responsibility' && (
                      <div className="mt-3 flex space-x-2">
                        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                          Ver Tareas
                        </button>
                        <button className="text-xs border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                          Contactar Coordinador
                        </button>
                      </div>
                    )}
                    
                    {notification.type === 'request_approved' && (
                      <div className="mt-3">
                        <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                          Ver Detalles de la Actividad
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {user.role === 'visitor' && (
              <>
                💡 <strong>Tip:</strong> Una vez aprobado, tendrás acceso a más funciones y responsabilidades.
              </>
            )}
            {user.role === 'volunteer' && (
              <>
                🎯 <strong>Recuerda:</strong> Tu participación activa es clave para el éxito de los proyectos.
              </>
            )}
            {user.role === 'donor' && (
              <>
                📊 <strong>Impacto:</strong> Tus contribuciones están generando cambios reales en la comunidad.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;