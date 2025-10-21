import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
        onClick={!isLoggingOut ? onClose : undefined}
      />

      {/* Centrado container */}
      <div className="flex min-h-full items-center justify-center p-4 relative" style={{ position: 'relative', zIndex: 9999 }}>
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all border border-white/20 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Cerrar Sesión
              </h3>
            </div>
            {!isLoggingOut && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isLoggingOut ? (
            <>
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-slate-50 to-sky-50 rounded-xl border border-sky-100">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.first_name || 'Usuario'}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-sky-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-sky-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl ring-2 ring-sky-200">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {user?.role || 'Usuario'}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas cerrar tu sesión?
                Tendrás que volver a iniciar sesión para acceder a tu cuenta.
              </p>

              <div className="flex items-center p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200">
                <Shield className="h-5 w-5 text-sky-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-sky-900 font-medium">
                  Tu sesión se cerrará de forma segura y tus datos estarán protegidos.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full mb-4 ring-4 ring-emerald-50">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Cerrando sesión...
              </h4>
              <p className="text-gray-600">
                Finalizando tu sesión de forma segura
              </p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-sky-600 to-blue-700 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoggingOut && (
          <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200 hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 hover:shadow-lg hover:scale-105"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LogoutModal;