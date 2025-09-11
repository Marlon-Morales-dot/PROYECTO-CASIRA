import React, { useState } from 'react';
import { LogOut, X, Shield, CheckCircle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm, user }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    console.log('🚪 LogoutModal: Botón de confirmar logout clickeado');
    setIsLoggingOut(true);
    try {
      await onConfirm();
      console.log('🚪 LogoutModal: onConfirm ejecutado exitosamente');
    } catch (error) {
      console.error('❌ LogoutModal: Error during logout:', error);
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  console.log('🚪 LogoutModal: Modal abierto, usuario:', user?.first_name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!isLoggingOut ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <LogOut className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cerrar Sesión
            </h3>
          </div>
          {!isLoggingOut && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!isLoggingOut ? (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={user?.avatar_url || '/default-avatar.jpg'}
                  alt={user?.first_name || 'Usuario'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user?.role || 'Usuario'}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas cerrar tu sesión? 
                Tendrás que volver a iniciar sesión para acceder a tu cuenta.
              </p>

              <div className="flex items-center p-3 bg-blue-50 rounded-lg mb-6">
                <Shield className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Tu sesión se cerrará de forma segura y tus datos estarán protegidos.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Cerrando sesión...
              </h4>
              <p className="text-gray-600">
                Finalizando tu sesión de forma segura
              </p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoggingOut && (
          <div className="flex space-x-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoutModal;