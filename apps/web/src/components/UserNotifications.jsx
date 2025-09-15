import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, X, AlertCircle, Heart, MessageCircle, Users, Award, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseAPI } from '../lib/supabase-api.js';

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
      console.log('🔄 NOTIF: Loading notifications from Supabase for user:', user.email);
      
      // Obtener el ID del usuario en Supabase (puede ser UUID o email)
      let supabaseUserId = user.supabase_id || user.id;
      
      // Para usuarios de Google, usar email si el ID no es UUID válido
      if (!supabaseUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supabaseUserId)) {
        supabaseUserId = user.email;
      }
      
      console.log('🆔 NOTIF: Using Supabase user ID:', supabaseUserId);
      
      // 1. Obtener notificaciones directas del usuario desde Supabase
      let userNotifications = [];
      try {
        const directNotifications = await supabaseAPI.notifications.getUserNotifications(supabaseUserId);
        console.log('📨 NOTIF: Found direct notifications:', directNotifications.length);
        userNotifications.push(...directNotifications);
      } catch (error) {
        console.warn('⚠️ NOTIF: Error loading direct notifications:', error);
      }
      
      // 2. Obtener solicitudes de voluntario y convertirlas en notificaciones
      try {
        // Buscar solicitudes del usuario por email (para usuarios de Google)
        const { supabase } = await import('../lib/supabase-singleton.js');
        const { data: volunteerRequests, error } = await supabase
          .from('volunteer_requests')
          .select(`
            *,
            activity:activities!volunteer_requests_activity_id_fkey(*)
          `)
          .or(`user_id.eq.${supabaseUserId},user_id.eq.${user.email}`)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ NOTIF: Error fetching volunteer requests:', error);
        } else {
          console.log('📋 NOTIF: Found volunteer requests:', volunteerRequests?.length || 0);
          
          // Convertir solicitudes a notificaciones
          const requestNotifications = (volunteerRequests || []).map(request => ({
            id: `volunteer-request-${request.id}`,
            type: request.status === 'approved' ? 'request_approved' : 
                  request.status === 'rejected' ? 'request_rejected' : 'request_pending',
            title: request.status === 'approved' ? '✅ ¡Solicitud Aprobada!' : 
                   request.status === 'rejected' ? '❌ Solicitud Rechazada' :
                   '⏳ Solicitud en Revisión',
            message: request.status === 'approved' ? 
              `Tu solicitud para "${request.activity?.title || 'la actividad'}" ha sido aprobada. ¡Bienvenido al equipo!` :
              request.status === 'rejected' ?
              `Tu solicitud para "${request.activity?.title || 'la actividad'}" no fue aprobada.` :
              `Tu solicitud para "${request.activity?.title || 'la actividad'}" está siendo revisada por nuestro equipo.`,
            created_at: request.created_at,
            read: false,
            activity: request.activity,
            status: request.status,
            volunteer_request_id: request.id
          }));
          
          userNotifications.push(...requestNotifications);
        }
      } catch (error) {
        console.warn('⚠️ NOTIF: Error loading volunteer requests:', error);
      }
      
      // 3. Obtener participaciones confirmadas para mostrar responsabilidades
      try {
        const { supabase } = await import('../lib/supabase-singleton.js');
        const { data: participations, error } = await supabase
          .from('activity_participants')
          .select(`
            *,
            activity:activities!activity_participants_activity_id_fkey(*)
          `)
          .or(`user_id.eq.${supabaseUserId},user_id.eq.${user.email}`)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });
        
        if (!error && participations) {
          console.log('🎯 NOTIF: Found confirmed participations:', participations.length);
          
          // Crear notificaciones de responsabilidades solo para voluntarios
          if (user.role === 'volunteer') {
            const responsibilityNotifications = participations.map(participation => ({
              id: `responsibility-${participation.id}`,
              type: 'responsibility',
              title: '📋 Tienes Responsabilidades Pendientes',
              message: `Como voluntario confirmado en "${participation.activity?.title}", tienes tareas asignadas que requieren tu atención.`,
              created_at: participation.created_at,
              read: false,
              activity: participation.activity,
              status: 'confirmed'
            }));
            
            userNotifications.push(...responsibilityNotifications);
          }
        }
      } catch (error) {
        console.warn('⚠️ NOTIF: Error loading participations:', error);
      }
      
      // 4. Agregar notificaciones de engagement social (solo si no es admin)
      if (user.role !== 'admin') {
        const socialNotifications = [
          {
            id: 'social-1',
            type: 'social',
            title: '❤️ Tu Participación Está Generando Impacto',
            message: 'Tus contribuciones han recibido reconocimiento de la comunidad. ¡Sigue participando!',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            read: false
          },
          {
            id: 'social-2',
            type: 'social',
            title: '💬 Interacciones de la Comunidad',
            message: 'La comunidad ha mostrado interés en las actividades donde participas.',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            read: false
          }
        ];
        
        userNotifications.push(...socialNotifications);
      }
      
      // Eliminar duplicados por ID
      const uniqueNotifications = userNotifications.reduce((acc, notification) => {
        if (!acc.find(n => n.id === notification.id)) {
          acc.push(notification);
        }
        return acc;
      }, []);
      
      // Ordenar por fecha (más recientes primero)
      uniqueNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setNotifications(uniqueNotifications);
      setUnreadCount(uniqueNotifications.filter(n => !n.read).length);
      
      console.log('✅ NOTIF: Loaded notifications from Supabase:', uniqueNotifications.length);
      
    } catch (error) {
      console.error('❌ NOTIF: Error loading user notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
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
      <motion.div 
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50"
      >
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-gradient-to-r from-blue-600 to-purple-600 border-t-transparent rounded-full mx-auto mb-3"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm font-medium"
          >
            ✨ Cargando tus notificaciones...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={unreadCount > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            <Bell className="h-5 w-5 text-blue-600" />
          </motion.div>
          <h3 className="font-bold text-gray-900">🔔 Notificaciones</h3>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <motion.button
              onClick={markAllAsRead}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-md hover:bg-blue-100 transition-all"
            >
              ✅ Marcar todo
            </motion.button>
          )}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-red-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500 hover:text-red-600" />
          </motion.button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            </motion.div>
            <h4 className="text-gray-600 font-bold mb-2">📭 Todo tranquilo por aquí</h4>
            <p className="text-gray-500 text-sm">Te avisaremos cuando tengas actualizaciones importantes. ¡Sigue participando activamente!</p>
          </motion.div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  className={`p-4 cursor-pointer transition-all duration-300 rounded-lg mx-2 my-1 ${
                    !notification.read ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                <div className="flex space-x-3">
                  <motion.div 
                    className="flex-shrink-0 mt-1"
                    whileHover={{ scale: 1.2, rotate: 15 }}
                  >
                    {getNotificationIcon(notification.type)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-gray-900">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2 bg-gray-100 px-2 py-1 rounded-full">
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
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium"
                        >
                          📋 Ver Tareas
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all font-medium"
                        >
                          💬 Contactar
                        </motion.button>
                      </div>
                    )}
                    
                    {notification.type === 'request_approved' && (
                      <div className="mt-3">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium"
                        >
                          🎯 Ver Actividad
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200"
      >
        <div className="text-center">
          <motion.p 
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            className="text-xs text-gray-600 font-medium"
          >
            {user.role === 'visitor' && (
              <>
                ✨ <strong>¡Bienvenido!</strong> Una vez aprobado, desbloquearás funciones increíbles.
              </>
            )}
            {user.role === 'volunteer' && (
              <>
                🌟 <strong>¡Eres increíble!</strong> Tu participación está creando un impacto real.
              </>
            )}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserNotifications;