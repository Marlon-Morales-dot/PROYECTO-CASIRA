// ============= CASIRA Connect - App Principal con Supabase =============
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Heart, Users, Building, Star, Menu, X, Bell } from 'lucide-react';

// Componentes principales
import AdminDashboardSupabase from './components/AdminDashboardSupabase.jsx';
import SocialFeed from './components/SocialFeed.jsx';
import EnhancedLogin from './components/EnhancedLogin.jsx';

// APIs de Supabase
import { supabase } from './lib/supabase-client.js';
import { supabaseUsers, supabaseActivities } from './lib/supabase-client.js';
import { authAPI } from './lib/api.js'; // Para compatibilidad con login existente

import './App.css';

// ============= COMPONENTE PRINCIPAL =============
const AppSupabase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('feed');

  useEffect(() => {
    checkAuthState();
    setupAuthListener();
  }, []);

  // ============= AUTENTICACIÓN =============
  const checkAuthState = async () => {
    try {
      console.log('🔐 APP: Checking authentication state...');
      
      // Verificar si hay usuario en localStorage (sistema actual)
      const currentUser = authAPI.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ APP: User found in localStorage:', currentUser.email);
        setUser(currentUser);
      } else {
        console.log('❌ APP: No user found in localStorage');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ APP: Error checking auth state:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setupAuthListener = () => {
    // Escuchar cambios en la autenticación de Supabase (futuro)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 APP: Supabase auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Crear o actualizar usuario en nuestra tabla
        try {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            provider: 'supabase',
            status: 'active',
            role: 'visitor' // Por defecto, el admin debe aprobar
          };
          
          const updatedUser = await supabaseUsers.updateProfile(session.user.id, userData);
          setUser(updatedUser);
          authAPI.setCurrentUser(updatedUser);
        } catch (error) {
          console.error('❌ APP: Error updating user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        authAPI.logout();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  };

  const handleLogin = (userData) => {
    console.log('✅ APP: User logged in:', userData.email);
    setUser(userData);
    setCurrentView('feed');
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 APP: Logging out user');
      
      // Logout de Supabase
      await supabase.auth.signOut();
      
      // Logout local
      authAPI.logout();
      setUser(null);
      setCurrentView('feed');
      
      console.log('✅ APP: User logged out successfully');
    } catch (error) {
      console.error('❌ APP: Error during logout:', error);
    }
  };

  // ============= COMPONENTES DE UI =============
  const Header = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CASIRA Connect</h1>
              <p className="text-xs text-gray-500">Comunidad • Solidaridad • Acción</p>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setCurrentView('feed')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'feed' 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feed Social
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`text-sm font-medium transition-colors ${
                  currentView === 'admin' 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Panel Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('activities')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'activities' 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Actividades
            </button>
          </nav>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role || 'visitor'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}

            {/* Menú móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú móvil expandido */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white pb-4">
            <nav className="flex flex-col space-y-2 pt-4">
              <button
                onClick={() => {
                  setCurrentView('feed');
                  setIsMenuOpen(false);
                }}
                className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'feed' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Feed Social
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setIsMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Panel Admin
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentView('activities');
                  setIsMenuOpen(false);
                }}
                className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'activities' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Actividades
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );

  const ActivitiesView = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadActivities();
    }, []);

    const loadActivities = async () => {
      try {
        const data = await supabaseActivities.getPublicActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleJoinActivity = async (activityId) => {
      if (!user) {
        alert('Debes iniciar sesión para unirte a una actividad');
        return;
      }

      try {
        const message = prompt('¿Quieres añadir un mensaje con tu solicitud? (opcional)');
        await supabaseActivities.joinActivity(activityId, user.id, message);
        alert('¡Solicitud enviada! El administrador la revisará pronto.');
        loadActivities(); // Recargar para actualizar contadores
      } catch (error) {
        console.error('Error joining activity:', error);
        alert('Error al unirse a la actividad: ' + error.message);
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando actividades...</span>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Actividades Disponibles</h2>
          <p className="text-gray-600">Únete a actividades que marquen la diferencia en tu comunidad</p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades disponibles</h3>
            <p className="text-gray-500">Las actividades aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {activity.image_url && (
                  <img 
                    src={activity.image_url} 
                    alt={activity.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.category?.color ? `bg-${activity.category.color}-100 text-${activity.category.color}-800` : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.category?.icon} {activity.category?.name || 'General'}
                    </span>
                    {activity.featured && <Star className="w-4 h-4 text-yellow-500" />}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{activity.description}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4 mb-4">
                    {activity.location && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {activity.location}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {activity.current_volunteers || 0}/{activity.max_volunteers || '∞'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'active' ? 'bg-green-100 text-green-800' :
                      activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status === 'active' ? 'Activo' :
                       activity.status === 'completed' ? 'Completado' :
                       activity.status === 'planning' ? 'Planificando' : activity.status}
                    </span>
                    
                    {activity.status === 'active' && user && (
                      <button
                        onClick={() => handleJoinActivity(activity.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Unirse
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============= RENDER PRINCIPAL =============
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando CASIRA Connect...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main>
          {currentView === 'login' && !user && (
            <div className="max-w-md mx-auto pt-12">
              <EnhancedLogin onLogin={handleLogin} />
            </div>
          )}
          
          {currentView === 'feed' && (
            <SocialFeed user={user} />
          )}
          
          {currentView === 'admin' && user?.role === 'admin' && (
            <AdminDashboardSupabase user={user} onLogout={handleLogout} />
          )}
          
          {currentView === 'activities' && (
            <ActivitiesView />
          )}
          
          {/* Redirección por defecto */}
          {currentView !== 'login' && currentView !== 'feed' && currentView !== 'admin' && currentView !== 'activities' && (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido a CASIRA Connect!</h2>
              <p className="text-gray-600 mb-6">
                Una plataforma donde la comunidad se une para crear impacto positivo
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <Heart className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Conecta</h3>
                  <p className="text-sm text-gray-600">Encuentra personas con tu misma pasión por ayudar</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Colabora</h3>
                  <p className="text-sm text-gray-600">Únete a actividades que generen cambio real</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <Building className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Construye</h3>
                  <p className="text-sm text-gray-600">Crea un futuro mejor para tu comunidad</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
};

export default AppSupabase;