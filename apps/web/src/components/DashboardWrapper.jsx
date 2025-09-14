import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import SocialDashboard from './SocialDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import VolunteerDashboard from './VolunteerDashboard.jsx';
import VisitorDashboard from './VisitorDashboard.jsx';

const DashboardWrapper = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Mostrar loading solo mientras se verifica la autenticación
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir según el rol del usuario
  if (user.isAdmin && user.isAdmin()) {
    return <AdminDashboard user={user} onLogout={logout} />;
  }

  if (user.isVolunteer && user.isVolunteer()) {
    return <VolunteerDashboard user={user} onLogout={logout} />;
  }

  // Para usuarios sociales/visitantes
  return <SocialDashboard user={user} onLogout={logout} />;
};

export default DashboardWrapper;