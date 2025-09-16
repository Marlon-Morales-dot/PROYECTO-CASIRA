import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import RoleChangeModal from './RoleChangeModal.jsx';

const GlobalRoleChangeModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔧 GlobalRoleChangeModal: Configurando listeners de eventos');

    const handleRoleChange = (event) => {
      const { userEmail, oldRole, newRole } = event.detail;

      console.log('🔔 GlobalRoleChangeModal: Evento role-changed recibido:', { userEmail, oldRole, newRole });
      console.log('🔔 GlobalRoleChangeModal: Usuario actual:', user?.email);

      // Solo mostrar modal si es el usuario actual Y si no ya hay un modal abierto
      if (user && user.email === userEmail && !showModal) {
        console.log('✅ GlobalRoleChangeModal: ¡ES EL USUARIO ACTUAL! Mostrando modal');

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

        console.log('🎯 GlobalRoleChangeModal: Modal configurado para mostrar');
      } else if (showModal) {
        console.log('⚠️ GlobalRoleChangeModal: Modal ya está abierto, ignorando evento duplicado');
      } else {
        console.log('❌ GlobalRoleChangeModal: No es el usuario actual, ignorando evento');
      }
    };

    // Solo escuchar role-changed que viene de AdminService
    window.addEventListener('role-changed', handleRoleChange);

    // EVENTO DE PRUEBA ELIMINADO - causaba bucle infinito

    return () => {
      console.log('🔧 GlobalRoleChangeModal: Removiendo listeners de eventos');
      window.removeEventListener('role-changed', handleRoleChange);
    };
  }, [user, showModal]);

  const handleAccept = () => {
    console.log('✅ GlobalRoleChangeModal: Usuario aceptó el cambio de rol');

    const roleRoutes = {
      'admin': '/admin/dashboard',
      'volunteer': '/volunteer/dashboard',
      'visitor': '/dashboard'
    };

    const newRoute = roleRoutes[roleChange?.newRole] || '/dashboard';
    console.log(`🚀 GlobalRoleChangeModal: Navegando a ${newRoute}`);

    setShowModal(false);
    setRoleChange(null);

    // Navegar después de un breve delay
    setTimeout(() => {
      window.location.href = newRoute;
    }, 300);
  };

  const handleClose = () => {
    console.log('❌ GlobalRoleChangeModal: Usuario canceló el cambio de rol');
    setShowModal(false);
    setRoleChange(null);
  };

  console.log('🔍 GlobalRoleChangeModal: Estado actual:', { showModal, roleChange, user: user?.email });

  return (
    <RoleChangeModal
      isOpen={showModal}
      onAccept={handleAccept}
      onClose={handleClose}
      roleChange={roleChange}
    />
  );
};

export default GlobalRoleChangeModal;