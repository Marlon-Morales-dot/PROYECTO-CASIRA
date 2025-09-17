import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners para usuario:', user?.email);

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

        setShowModal(true);
        setRenderKey(prev => prev + 1);

        console.log('✅ Modal configurado y mostrado');
      } else {
        console.log('❌ Evento no es para mí:', {
          userEmail,
          currentUser: user?.email,
          hasUser: !!user
        });
      }
    };

    window.addEventListener('role-changed', handleRoleChange);

    return () => {
      window.removeEventListener('role-changed', handleRoleChange);
    };
  }, [user]);

  const handleAccept = () => {
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

    // Forzar actualización inmediata del usuario en el contexto
    window.dispatchEvent(new CustomEvent('force-user-refresh'));

    // Redirección inmediata con fallback
    setTimeout(() => {
      setShowModal(false);
      setRoleChange(null);

      // Intentar navegación con React Router primero
      try {
        window.history.pushState(null, null, newRoute);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (error) {
        // Fallback a location.href
        window.location.href = newRoute;
      }
    }, 1500); // Dar tiempo para que se vea el mensaje de redirección
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
    modalShouldShow: showModal && roleChange
  });

  return (
    <RoleChangeModal
      key={`modal-${renderKey}-${showModal}`}
      isOpen={showModal}
      onAccept={handleAccept}
      onClose={handleClose}
      roleChange={roleChange}
    />
  );
};

export default GlobalRoleChangeModal;