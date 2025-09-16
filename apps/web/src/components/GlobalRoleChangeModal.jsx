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

      // Solo mostrar modal si es el usuario actual
      if (user && user.email === userEmail) {
        console.log('✅ GlobalRoleChangeModal: ¡ES EL USUARIO ACTUAL! Mostrando modal');

        setRoleChange({
          oldRole,
          newRole,
          userEmail,
          title: '¡Tu rol ha sido actualizado!',
          message: `Tu rol ha cambiado de ${oldRole} a ${newRole}`
        });

        setShowModal(true);

        console.log('🎯 GlobalRoleChangeModal: Modal configurado para mostrar');
      } else {
        console.log('❌ GlobalRoleChangeModal: No es el usuario actual, ignorando evento');
      }
    };

    const handleRoleNotification = (event) => {
      const { userEmail, oldRole, newRole, title, message } = event.detail;

      console.log('🔔 GlobalRoleChangeModal: Evento casira-role-notification recibido:', { userEmail, oldRole, newRole });

      if (user && user.email === userEmail) {
        console.log('✅ GlobalRoleChangeModal: Mostrando modal desde casira-role-notification');

        setRoleChange({
          oldRole,
          newRole,
          userEmail,
          title,
          message
        });

        setShowModal(true);
      }
    };

    // Agregar listeners para ambos tipos de eventos
    window.addEventListener('role-changed', handleRoleChange);
    window.addEventListener('casira-role-notification', handleRoleNotification);

    // Test: disparar evento después de 2 segundos para prueba
    if (user) {
      setTimeout(() => {
        console.log('🧪 GlobalRoleChangeModal: Disparando evento de prueba');
        window.dispatchEvent(new CustomEvent('role-changed', {
          detail: {
            userEmail: user.email,
            oldRole: 'visitor',
            newRole: 'volunteer'
          }
        }));
      }, 2000);
    }

    return () => {
      console.log('🔧 GlobalRoleChangeModal: Removiendo listeners de eventos');
      window.removeEventListener('role-changed', handleRoleChange);
      window.removeEventListener('casira-role-notification', handleRoleNotification);
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