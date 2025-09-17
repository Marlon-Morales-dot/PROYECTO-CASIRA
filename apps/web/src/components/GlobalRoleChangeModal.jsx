import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners de eventos');
    console.log('👤 GlobalRoleChangeModal: Usuario actual registrado:', user?.email);

    const handleRoleChange = (event) => {
      console.log('🔔 GlobalRoleChangeModal: ¡EVENTO RECIBIDO!', event);
      console.log('📦 GlobalRoleChangeModal: Detalles del evento:', event.detail);
      const { userEmail, oldRole, newRole } = event.detail;

      console.log('🔔 GlobalRoleChangeModal: Evento role-changed recibido:', { userEmail, oldRole, newRole });
      console.log('🔔 GlobalRoleChangeModal: Usuario actual:', user?.email);
      console.log('🔔 GlobalRoleChangeModal: Comparación emails:', {
        eventEmail: `"${userEmail}"`,
        currentEmail: `"${user?.email}"`,
        match: user?.email === userEmail
      });

      // Solo mostrar modal si es el usuario actual
      if (user && user.email === userEmail) {
        console.log('✅ GlobalRoleChangeModal: ¡ES EL USUARIO ACTUAL! Mostrando modal');

        const roleNames = {
          'admin': 'Administrador',
          'volunteer': 'Voluntario',
          'visitor': 'Visitante'
        };

        const newRoleChange = {
          oldRole,
          newRole,
          userEmail,
          title: '¡Tu rol ha sido actualizado!',
          message: `Ahora eres ${roleNames[newRole]}. Serás redirigido a tu nueva área de trabajo.`
        };

        console.log('🎯 GlobalRoleChangeModal: Configurando datos del modal:', newRoleChange);

        // FORZAR re-render usando función de estado y key dinámico
        setRoleChange(newRoleChange);
        setShowModal(true);
        setRenderKey(prev => prev + 1);

        // Forzar re-render adicional y actualización del DOM
        setTimeout(() => {
          console.log('🔄 GlobalRoleChangeModal: Forzando segundo render del modal');
          setShowModal(true);
          setRenderKey(prev => prev + 1);
        }, 100);

        // Forzar tercer render para asegurar visibilidad
        setTimeout(() => {
          console.log('🔄 GlobalRoleChangeModal: Forzando tercer render del modal');
          setShowModal(true);
        }, 300);

        console.log('🎯 GlobalRoleChangeModal: Modal configurado para mostrar');
      } else if (!user) {
        console.log('❌ GlobalRoleChangeModal: No hay usuario logueado');
      } else if (user.email !== userEmail) {
        console.log('❌ GlobalRoleChangeModal: Email no coincide');
      } else {
        console.log('❌ GlobalRoleChangeModal: Condición no cumplida para mostrar modal');
      }
    };

    // Solo escuchar role-changed que viene de AdminService
    window.addEventListener('role-changed', handleRoleChange);

    // Función global para pruebas manuales
    window.testRoleChangeModal = () => {
      if (user) {
        console.log('🧪 PRUEBA MANUAL: Disparando evento de prueba');
        window.dispatchEvent(new CustomEvent('role-changed', {
          detail: {
            userEmail: user.email,
            oldRole: 'visitor',
            newRole: 'volunteer'
          }
        }));
      } else {
        console.log('❌ No hay usuario para probar');
      }
    };

    console.log('🧪 Para probar manualmente: ejecuta window.testRoleChangeModal() en la consola');

    return () => {
      console.log('🔧 GlobalRoleChangeModal: Removiendo listeners de eventos');
      window.removeEventListener('role-changed', handleRoleChange);
    };
  }, [user]); // Removí showModal de las dependencias

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