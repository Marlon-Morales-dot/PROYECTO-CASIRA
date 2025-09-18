import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners para usuario:', user?.email);

    // Verificar que el usuario existe antes de proceder
    if (!user) {
      console.log('⚠️ GlobalRoleChangeModal: No hay usuario, saltando configuración');
      return () => {}; // Return empty cleanup function
    }

    // Verificar si usuario tiene UUID válido para Supabase o necesita sincronización
    let notificationInterval = null;
    const isValidUUID = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);
    const isGoogleUser = user?.provider === 'google' || user?.auth_provider === 'google' || user?.google_id;
    const hasSupabaseId = user?.supabase_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.supabase_id);

    console.log('🔍 GlobalRoleChangeModal: Análisis de usuario:', {
      email: user?.email,
      id: user?.id,
      supabase_id: user?.supabase_id,
      provider: user?.provider,
      auth_provider: user?.auth_provider,
      google_id: user?.google_id,
      isValidUUID,
      isGoogleUser,
      hasSupabaseId,
      userType: isValidUUID ? 'supabase' : (isGoogleUser ? (hasSupabaseId ? 'google-synced' : 'google-local') : 'demo')
    });

    // Usuarios que pueden recibir notificaciones de Supabase
    const canReceiveSupabaseNotifications = isValidUUID || hasSupabaseId;
    const userIdForSupabase = hasSupabaseId ? user.supabase_id : user.id;

    if (canReceiveSupabaseNotifications) {
      console.log('✅ Usuario con acceso a Supabase detectado, iniciando verificación de notificaciones');
      console.log('🆔 Usando ID:', userIdForSupabase, 'para consultas Supabase');

      // Crear función de verificación que use el ID correcto
      const checkNotificationsWithCorrectId = async () => {
        if (!userIdForSupabase) return;

        // Validar que el ID sea UUID válido antes de consultar
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdForSupabase)) {
          console.log('⚠️ ID no es UUID válido para Supabase:', userIdForSupabase);
          return;
        }

        try {
          // Usar el ID correcto para la consulta
          const { supabaseNotificationsAPI } = await import('../lib/supabase-api.js');
          const notifications = await supabaseNotificationsAPI.getUserNotifications(userIdForSupabase);

          // Filtrar notificaciones relevantes
          const recentRoleChanges = notifications.filter(notif => {
            const isRoleChange = notif.type === 'role_change';
            const isRecent = new Date() - new Date(notif.created_at) < 300000; // 5 minutos
            const isUnread = !notif.read;
            const notShownYet = !shownNotifications.has(notif.id);

            // Solo hacer log si pasa los filtros básicos para reducir spam
            if (isRoleChange && isRecent && isUnread && notShownYet) {
              console.log(`🔍 Checking valid notification:`, {
                id: notif.id,
                type: notif.type,
                created: notif.created_at,
                title: notif.title
              });
            }

            return isRoleChange && isRecent && isUnread && notShownYet;
          });

          if (recentRoleChanges.length > 0) {
            const latestChange = recentRoleChanges[0];
            const data = typeof latestChange.data === 'string'
              ? JSON.parse(latestChange.data)
              : latestChange.data;

            console.log('🔔 GlobalRoleChangeModal: Notificación de cambio de rol detectada:', latestChange);

            const roleNames = {
              'admin': 'Administrador',
              'volunteer': 'Voluntario',
              'visitor': 'Visitante'
            };

            setRoleChange({
              oldRole: data.old_role || 'visitor',
              newRole: data.new_role,
              userEmail: user.email,
              title: '¡Tu rol ha sido actualizado!',
              message: `Ahora eres ${roleNames[data.new_role]}. Serás redirigido a tu nueva área de trabajo.`
            });

            setShowModal(true);
            setRenderKey(prev => prev + 1);

            // Marcar esta notificación como ya mostrada para evitar bucle infinito
            setShownNotifications(prev => new Set([...prev, latestChange.id]));

            console.log('✅ GlobalRoleChangeModal: Modal mostrado basado en notificación de Supabase');

            // Marcar notificación como leída
            await supabaseNotificationsAPI.markAsRead(latestChange.id);
          }
        } catch (error) {
          console.error('❌ Error checking notifications for modal:', error);
        }
      };

      // Verificar notificaciones cada 5 segundos para reducir carga
      notificationInterval = setInterval(checkNotificationsWithCorrectId, 5000);
      // Verificar inmediatamente
      checkNotificationsWithCorrectId();
    } else if (isGoogleUser) {
      console.log('📱 Usuario de Google local detectado, usando solo eventos directos (sin polling Supabase)');
      console.log('💡 Sugerencia: Sincronizar usuario de Google en Supabase para notificaciones en tiempo real');
    } else {
      console.log('⚠️ Usuario demo detectado, usando solo eventos directos (sin polling Supabase)');
    }

    // MÚLTIPLES LISTENERS PARA GARANTIZAR QUE EL MODAL APAREZCA
    const handleRoleChange = (event) => {
      console.log('🔔 GlobalRoleChangeModal: EVENTO RECIBIDO:', event.detail);

      const { userEmail, oldRole, newRole } = event.detail;

      // DEPURACIÓN DETALLADA
      console.log('📧 Email del evento:', userEmail);
      console.log('👤 Email del usuario actual:', user?.email);
      console.log('🔍 Tipo de usuario actual:', {
        hasUser: !!user,
        hasId: !!user?.id,
        provider: user?.provider,
        auth_provider: user?.auth_provider
      });
      console.log('🎯 ¿Son iguales?', user?.email === userEmail);
      console.log('📱 Estado del modal:', { showModal, roleChange: !!roleChange });

      // Solo procesar si es para el usuario actual y no está ya mostrando
      if (user && user.email === userEmail && !showModal) {
        console.log('✅ ¡EVENTO ES PARA MÍ! Mostrando modal...');

        const roleNames = {
          'admin': 'Administrador',
          'volunteer': 'Voluntario',
          'visitor': 'Visitante'
        };

        setRoleChange({
          oldRole,
          newRole,
          userEmail,
          title: '¡Tu rol ha sido actualizado!',
          message: `Ahora eres ${roleNames[newRole]}. Serás redirigido a tu nueva área de trabajo.`
        });

        console.log('🎯 GlobalRoleChangeModal: A punto de mostrar modal...');
        setShowModal(true);
        setRenderKey(prev => prev + 1);

        console.log('✅ Modal configurado y mostrado');
        console.log('🔍 Verificando estado después de setShowModal:', { showModal: true, roleChange });
      } else {
        console.log('❌ Evento no es para mí o modal ya está mostrando:', {
          userEmail,
          currentUser: user?.email,
          hasUser: !!user,
          showModal,
          emailsMatch: user?.email === userEmail,
          reason: !user ? 'sin usuario' : (user.email !== userEmail ? 'email diferente' : 'modal ya mostrando')
        });
      }
    };

    // LISTENER ADICIONAL PARA NOTIFICACIONES CASIRA
    const handleCasiraNotification = (event) => {
      console.log('🔔 GlobalRoleChangeModal: NOTIFICACIÓN CASIRA RECIBIDA:', event.detail);

      const { userEmail, newRole, oldRole, type } = event.detail;

      if (type === 'role_change' && user && user.email === userEmail && !showModal) {
        console.log('✅ ¡NOTIFICACIÓN CASIRA ES PARA MÍ! Mostrando modal...');

        const roleNames = {
          'admin': 'Administrador',
          'volunteer': 'Voluntario',
          'visitor': 'Visitante'
        };

        setRoleChange({
          oldRole: oldRole || 'visitor',
          newRole,
          userEmail,
          title: '¡Tu rol ha sido actualizado!',
          message: `Ahora eres ${roleNames[newRole]}. Serás redirigido a tu nueva área de trabajo.`
        });

        console.log('🎯 GlobalRoleChangeModal: A punto de mostrar modal CASIRA...');
        setShowModal(true);
        setRenderKey(prev => prev + 1);

        console.log('✅ Modal CASIRA configurado y mostrado');
        console.log('🔍 Verificando estado después de setShowModal CASIRA:', { showModal: true, roleChange });
      }
    };

    // FUNCIÓN DE FORZAR MODAL PARA DEBUG
    window.forceRoleChangeModal = (newRole = 'volunteer') => {
      console.log('🧪 FORZANDO MODAL PARA DEBUG');

      const roleNames = {
        'admin': 'Administrador',
        'volunteer': 'Voluntario',
        'visitor': 'Visitante'
      };

      setRoleChange({
        oldRole: 'visitor',
        newRole: newRole,
        userEmail: user?.email || 'test@test.com',
        title: '¡Tu rol ha sido actualizado!',
        message: `Ahora eres ${roleNames[newRole]}. Serás redirigido a tu nueva área de trabajo.`
      });

      console.log('🎯 GlobalRoleChangeModal: A punto de mostrar modal FORZADO...');
      setShowModal(true);
      setRenderKey(prev => prev + 1);

      console.log('✅ Modal FORZADO configurado y mostrado');
      console.log('🔍 Verificando estado después de setShowModal FORZADO:', { showModal: true, roleChange });
    };

    // LISTENER ADICIONAL PARA FORZAR MODAL
    const handleForceModal = (event) => {
      console.log('🔔 GlobalRoleChangeModal: FORCE MODAL RECIBIDO:', event.detail);

      const { userEmail, newRole, oldRole } = event.detail;

      if (user && user.email === userEmail && !showModal) {
        console.log('✅ ¡FORCE MODAL ES PARA MÍ! Mostrando modal...');

        const roleNames = {
          'admin': 'Administrador',
          'volunteer': 'Voluntario',
          'visitor': 'Visitante'
        };

        setRoleChange({
          oldRole: oldRole || 'visitor',
          newRole,
          userEmail,
          title: '¡Tu rol ha sido actualizado!',
          message: `Ahora eres ${roleNames[newRole]}. Serás redirigido a tu nueva área de trabajo.`
        });

        console.log('🎯 GlobalRoleChangeModal: A punto de mostrar modal FORCE...');
        setShowModal(true);
        setRenderKey(prev => prev + 1);

        console.log('✅ Modal FORCE configurado y mostrado');
        console.log('🔍 Verificando estado después de setShowModal FORCE:', { showModal: true, roleChange });
      }
    };

    // REGISTRAR TODOS LOS LISTENERS
    window.addEventListener('role-changed', handleRoleChange);
    window.addEventListener('casira-role-notification', handleCasiraNotification);
    window.addEventListener('force-role-modal', handleForceModal);

    return () => {
      // Limpiar intervalo de notificaciones (solo si existe)
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }

      // Limpiar listeners de eventos
      window.removeEventListener('role-changed', handleRoleChange);
      window.removeEventListener('casira-role-notification', handleCasiraNotification);
      window.removeEventListener('force-role-modal', handleForceModal);
      delete window.forceRoleChangeModal;
    };
  }, [user]);

  const handleAccept = async () => {
    console.log('✅ GlobalRoleChangeModal: Usuario aceptó el cambio de rol');

    const roleRoutes = {
      'admin': '/admin/dashboard',
      'volunteer': '/volunteer/dashboard',
      'visitor': '/dashboard'
    };

    const newRoute = roleRoutes[roleChange?.newRole] || '/dashboard';
    console.log(`🚀 GlobalRoleChangeModal: Navegando a ${newRoute}`);

    // Mostrar indicador de redirección
    const roleNames = {
      'admin': 'Panel de Administración',
      'volunteer': 'Panel de Voluntario',
      'visitor': 'Panel de Visitante'
    };

    // Actualizar el modal para mostrar estado de redirección
    setRoleChange(prev => ({
      ...prev,
      redirecting: true,
      redirectMessage: `Redirigiendo al ${roleNames[roleChange?.newRole] || 'panel correspondiente'}...`
    }));

    try {
      // ACTUALIZAR USUARIO EN EL CONTEXTO INMEDIATAMENTE
      console.log('🔄 GlobalRoleChangeModal: Actualizando usuario en contexto...');

      // Actualizar el contexto de auth directamente
      if (updateUserProfile && user) {
        await updateUserProfile({ role: roleChange.newRole });
        console.log('✅ GlobalRoleChangeModal: Usuario actualizado en contexto');
      }

      // DISPARAR EVENTO DE ACTUALIZACIÓN FORZADA
      window.dispatchEvent(new CustomEvent('force-user-refresh', {
        detail: {
          newRole: roleChange.newRole,
          userEmail: user?.email
        }
      }));

      // DISPARAR EVENTO DE ACTUALIZACIÓN INMEDIATA DEL DASHBOARD
      window.dispatchEvent(new CustomEvent('dashboard-role-updated', {
        detail: {
          newRole: roleChange.newRole,
          oldRole: roleChange.oldRole,
          userEmail: user?.email
        }
      }));

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
    }

    // Cerrar modal primero
    setShowModal(false);
    setRoleChange(null);
    setShownNotifications(new Set());

    // Solo navegar si es necesario cambiar la ruta
    const currentPath = window.location.pathname;
    if (currentPath !== newRoute) {
      console.log('🔄 GlobalRoleChangeModal: Navegando con React Router de', currentPath, 'a', newRoute);
      navigate(newRoute, { replace: true });
    } else {
      console.log('🔄 GlobalRoleChangeModal: Ya estamos en la ruta correcta, solo forzando actualización');
    }
  };

  const handleClose = () => {
    console.log('❌ GlobalRoleChangeModal: Usuario canceló el cambio de rol');
    setShowModal(false);
    setRoleChange(null);
    // Limpiar notificaciones mostradas para futuras notificaciones
    setShownNotifications(new Set());
  };

  console.log('🔍 GlobalRoleChangeModal: Estado actual:', {
    showModal,
    roleChange,
    user: user?.email,
    renderKey,
    hasUser: !!user,
    modalShouldShow: showModal && roleChange,
    showModalValue: showModal,
    roleChangeValue: roleChange,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  // LOGGING ADICIONAL PARA DEBUG
  console.log('🔍 GlobalRoleChangeModal: Valores individuales:', {
    showModal: showModal,
    roleChange: roleChange,
    'showModal && roleChange': showModal && roleChange,
    'Boolean(showModal)': Boolean(showModal),
    'Boolean(roleChange)': Boolean(roleChange)
  });

  // RENDERIZAR MODAL CON DISEÑO MEJORADO
  if (showModal && roleChange) {
    console.log('🎭 GlobalRoleChangeModal: RENDERIZANDO MODAL DIRECTO');

    const roleNames = {
      'admin': 'Administrador',
      'volunteer': 'Voluntario',
      'visitor': 'Visitante'
    };

    const roleIcons = {
      'admin': '👑',
      'volunteer': '🤝',
      'visitor': '👋'
    };

    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
          {/* Header con gradiente azul */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-center">
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="CASIRA Logo"
                className="w-16 h-16 mx-auto mb-2 bg-white rounded-full p-2 shadow-lg"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Rol Actualizado!
            </h2>
            <div className="text-blue-100 text-sm">
              Tu acceso ha sido modificado
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Cambio de rol visual */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {roleIcons[roleChange.oldRole] || '👤'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {roleNames[roleChange.oldRole] || roleChange.oldRole}
                  </div>
                </div>

                <div className="text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {roleIcons[roleChange.newRole] || '👤'}
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {roleNames[roleChange.newRole] || roleChange.newRole}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {roleChange.message || `Ahora tienes acceso como ${roleNames[roleChange.newRole]}. Serás redirigido a tu nueva área de trabajo.`}
                </p>
              </div>

              {roleChange.redirecting && (
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">
                    {roleChange.redirectMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                disabled={roleChange.redirecting}
              >
                Cancelar
              </button>
              <button
                onClick={handleAccept}
                disabled={roleChange.redirecting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {roleChange.redirecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirigiendo...
                  </span>
                ) : (
                  'Aceptar y Continuar'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🚫 GlobalRoleChangeModal: NO renderizando modal');
  return null;
};

export default GlobalRoleChangeModal;