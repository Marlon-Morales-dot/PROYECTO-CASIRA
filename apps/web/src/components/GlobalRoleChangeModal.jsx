import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners para usuario:', user?.email);

    // MÚLTIPLES LISTENERS PARA GARANTIZAR QUE EL MODAL APAREZCA
    const handleRoleChange = (event) => {
      console.log('🔔 GlobalRoleChangeModal: EVENTO RECIBIDO:', event.detail);

      const { userEmail, oldRole, newRole } = event.detail;

      // DEPURACIÓN DETALLADA
      console.log('📧 Email del evento:', userEmail);
      console.log('👤 Email del usuario actual:', user?.email);
      console.log('🎯 ¿Son iguales?', user?.email === userEmail);

      // Solo procesar si es para el usuario actual
      if (user && user.email === userEmail) {
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
        console.log('❌ Evento no es para mí:', {
          userEmail,
          currentUser: user?.email,
          hasUser: !!user
        });
      }
    };

    // LISTENER ADICIONAL PARA NOTIFICACIONES CASIRA
    const handleCasiraNotification = (event) => {
      console.log('🔔 GlobalRoleChangeModal: NOTIFICACIÓN CASIRA RECIBIDA:', event.detail);

      const { userEmail, newRole, type } = event.detail;

      if (type === 'role_change' && user && user.email === userEmail) {
        console.log('✅ ¡NOTIFICACIÓN CASIRA ES PARA MÍ! Mostrando modal...');

        const roleNames = {
          'admin': 'Administrador',
          'volunteer': 'Voluntario',
          'visitor': 'Visitante'
        };

        setRoleChange({
          oldRole: 'visitor', // Por defecto
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

      if (user && user.email === userEmail) {
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

      // Forzar recarga completa de la página para asegurar que todo se actualice
      console.log('🔄 GlobalRoleChangeModal: Redirigiendo y refrescando...');
      window.location.href = newRoute;
    }, 1000); // Reducir tiempo de espera
  };

  const handleClose = () => {
    console.log('❌ GlobalRoleChangeModal: Usuario canceló el cambio de rol');
    setShowModal(false);
    setRoleChange(null);
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