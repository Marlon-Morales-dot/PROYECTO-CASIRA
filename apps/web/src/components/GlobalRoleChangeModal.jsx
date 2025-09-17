import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const { user, updateUser } = useAuth();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners para usuario:', user?.email);


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

          // Resto de la lógica igual...
          const recentRoleChanges = notifications.filter(notif => {
            const isRoleChange = notif.type === 'role_change';
            const isRecent = new Date() - new Date(notif.created_at) < 120000; // 2 minutos
            const isUnread = !notif.read;
            const notShownYet = !shownNotifications.has(notif.id);
            console.log(`🔍 Checking notification:`, {
              id: notif.id,
              type: notif.type,
              isRoleChange,
              created: notif.created_at,
              isRecent,
              isUnread,
              notShownYet,
              title: notif.title
            });
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

      // Verificar notificaciones cada 2 segundos para tiempo real
      notificationInterval = setInterval(checkNotificationsWithCorrectId, 2000);
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
        isValidUUID,
        isGoogleUser,
        provider: user?.provider,
        auth_provider: user?.auth_provider
      });
      console.log('🎯 ¿Son iguales?', user?.email === userEmail);
      console.log('📱 Estado del modal:', { showModal, roleChange: !!roleChange });

      // Solo procesar si es para el usuario actual y no está ya mostrando
      if (user && user.email === userEmail && !showModal) {
        console.log('✅ ¡EVENTO ES PARA MÍ! Mostrando modal... (Tipo:', isGoogleUser ? 'Google' : 'CASIRA', ')');

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
      if (updateUser && user) {
        await updateUser({ ...user, role: roleChange.newRole });
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

    // Redirección inmediata con fallback
    setTimeout(() => {
      setShowModal(false);
      setRoleChange(null);
      // Limpiar notificaciones mostradas para futuras notificaciones
      setShownNotifications(new Set());

      // Forzar recarga completa de la página para asegurar que todo se actualice
      console.log('🔄 GlobalRoleChangeModal: Redirigiendo y refrescando...');
      window.location.href = newRoute;
    }, 1000); // Reducir tiempo de espera
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

  // RENDERIZAR DIRECTAMENTE SIN COMPONENTE HIJO PARA DEBUG
  if (showModal && roleChange) {
    console.log('🎭 GlobalRoleChangeModal: RENDERIZANDO MODAL DIRECTO');
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          backgroundColor: 'rgba(255, 0, 0, 0.8)', // ROJO PARA VER
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            border: '5px solid #00ff00' // VERDE PARA VER
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
            🎉 ¡TU ROL HA SIDO ACTUALIZADO!
          </h1>
          <p style={{ marginBottom: '20px' }}>
            Ahora eres: {roleChange.newRole}
          </p>
          <button
            onClick={handleAccept}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ¡ACEPTAR Y CONTINUAR!
          </button>
        </div>
      </div>
    );
  }

  console.log('🚫 GlobalRoleChangeModal: NO renderizando modal');
  return null;
};

export default GlobalRoleChangeModal;