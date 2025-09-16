import { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';

export const useRoleChangeNotification = () => {
  const [showModal, setShowModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleRoleChangeNotification = (event) => {
      const { userEmail, oldRole, newRole, title, message } = event.detail;

      console.log('🔔 useRoleChangeNotification: Evento recibido:', { userEmail, oldRole, newRole });

      // Solo mostrar modal si es el usuario actual
      if (user && user.email === userEmail) {
        console.log('✅ useRoleChangeNotification: Mostrando modal para usuario actual');

        setRoleChange({
          oldRole,
          newRole,
          title,
          message,
          userEmail
        });

        setShowModal(true);
      }
    };

    // Escuchar eventos de cambio de rol
    window.addEventListener('casira-role-notification', handleRoleChangeNotification);

    return () => {
      window.removeEventListener('casira-role-notification', handleRoleChangeNotification);
    };
  }, [user]);

  const handleAccept = () => {
    console.log('✅ useRoleChangeNotification: Usuario aceptó el cambio de rol');

    const roleRoutes = {
      'admin': '/admin/dashboard',
      'volunteer': '/volunteer/dashboard',
      'visitor': '/dashboard'
    };

    const newRoute = roleRoutes[roleChange?.newRole] || '/dashboard';
    console.log(`🚀 useRoleChangeNotification: Navegando a ${newRoute} para rol ${roleChange?.newRole}`);

    setShowModal(false);

    // Disparar navegación después de un breve delay para animación
    setTimeout(() => {
      window.location.href = newRoute;
    }, 300);

    // Limpiar después de la navegación
    setTimeout(() => {
      setRoleChange(null);
    }, 1000);
  };

  const handleClose = () => {
    console.log('❌ useRoleChangeNotification: Usuario canceló el cambio de rol');
    setShowModal(false);
    setRoleChange(null);
  };

  return {
    showModal,
    roleChange,
    handleAccept,
    handleClose
  };
};