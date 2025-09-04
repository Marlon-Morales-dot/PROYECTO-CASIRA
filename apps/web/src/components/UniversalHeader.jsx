import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, Search, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserNotifications from './UserNotifications.jsx';
import { volunteersAPI } from '../lib/api.js';

const UniversalHeader = ({ user, onLogout, showNotifications = true }) => {
  const navigate = useNavigate();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStats, setUserStats] = useState({
    pendingSolicitudes: 0,
    approvedSolicitudes: 0,
    totalLikes: 0
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      if (user.role === 'visitor' || user.role === 'volunteer') {
        const registrations = await volunteersAPI.getUserRegistrations(user.id);
        
        const stats = {
          pendingSolicitudes: registrations.filter(r => r.status === 'pending').length,
          approvedSolicitudes: registrations.filter(r => r.status === 'confirmed').length,
          totalLikes: Math.floor(Math.random() * 50) + 5 // Mock likes count
        };
        
        setUserStats(stats);
        setUnreadCount(stats.pendingSolicitudes + Math.floor(Math.random() * 3));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return { name: 'Administrador', color: 'purple', icon: '👑' };
      case 'volunteer':
        return { name: 'Voluntario', color: 'green', icon: '🤝' };
      case 'visitor':
        return { name: 'Visitante', color: 'blue', icon: '👀' };
      case 'donor':
        return { name: 'Donante', color: 'yellow', icon: '💝' };
      default:
        return { name: 'Usuario', color: 'gray', icon: '👤' };
     }
  };

  const roleInfo = getRoleDisplay(user?.role);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CASIRA Connect
                </h1>
                <p className="text-xs text-gray-500">
                  {user ? `Hola, ${user.first_name}` : 'Transformando comunidades'}
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CASIRA
                </h1>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar actividades, personas..."
                  className="w-64 px-4 py-2 pl-10 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Mobile & Desktop Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="h-5 w-5 text-gray-600" />
              </button>

              {user && showNotifications && (
                <>
                  {/* Desktop Quick Stats */}
                  <div className="hidden lg:flex items-center space-x-4 text-sm">
                    {user.role === 'visitor' && userStats.pendingSolicitudes > 0 && (
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        <span>{userStats.pendingSolicitudes} pendiente{userStats.pendingSolicitudes > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    
                    {user.role === 'volunteer' && userStats.approvedSolicitudes > 0 && (
                      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>{userStats.approvedSolicitudes} actividad{userStats.approvedSolicitudes > 1 ? 'es' : ''}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{userStats.totalLikes}</span>
                    </div>
                  </div>

                  {/* Notifications Bell */}
                  <button
                    onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                    className="relative p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-full py-2 pl-2 pr-3 sm:pr-4 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={user.avatar_url || '/grupo-canadienses.jpg'}
                      alt={user.first_name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className={`text-xs text-${roleInfo.color}-600 flex items-center space-x-1`}>
                        <span>{roleInfo.icon}</span>
                        <span>{roleInfo.name}</span>
                      </div>
                    </div>
                    <User className="h-4 w-4 text-gray-600 sm:hidden" />
                  </button>
                  
                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="py-2">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatar_url || '/grupo-canadienses.jpg'}
                              alt={user.first_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              <div className={`text-xs text-${roleInfo.color}-600 flex items-center space-x-1 mt-1`}>
                                <span>{roleInfo.icon}</span>
                                <span>{roleInfo.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Stats - Only show on mobile */}
                        <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                          <div className="flex items-center justify-between text-sm">
                            {user.role === 'visitor' && userStats.pendingSolicitudes > 0 && (
                              <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                <span>{userStats.pendingSolicitudes} pendiente{userStats.pendingSolicitudes > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            
                            {user.role === 'volunteer' && userStats.approvedSolicitudes > 0 && (
                              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span>{userStats.approvedSolicitudes} actividad{userStats.approvedSolicitudes > 1 ? 'es' : ''}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Heart className="h-4 w-4 text-red-500" />
                              <span className="text-sm">{userStats.totalLikes}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Options */}
                        <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                          <User className="h-4 w-4" />
                          <span>Mi Perfil</span>
                        </button>
                        
                        <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                          <Settings className="h-4 w-4" />
                          <span>Configuración</span>
                        </button>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              onLogout();
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 hidden sm:block"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <span className="sm:hidden">Entrar</span>
                    <span className="hidden sm:inline">Únete Gratis</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar actividades, personas..."
                  className="w-full px-4 py-3 pl-10 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <button
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute right-3 top-3 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <>
          <UserNotifications
            user={user}
            onClose={() => setShowNotificationPanel(false)}
          />
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowNotificationPanel(false)}
          />
        </>
      )}

      {/* Click outside to close dropdowns */}
      {(showUserDropdown || showMobileSearch) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowUserDropdown(false);
            setShowMobileSearch(false);
          }}
        />
      )}
    </>
  );
};

export default UniversalHeader;