import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import LogoutModal from './LogoutModal';
import logoutService from '../lib/services/logout.service';

const LogoutButton = ({ 
  user, 
  style = 'dropdown', // 'dropdown', 'button', 'icon'
  className = '',
  showText = true,
  onLogoutStart,
  onLogoutComplete 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    console.log('🚪 LogoutButton: Click detectado');
    console.log('🚪 LogoutButton: Props recibidas:', { user: !!user, onLogoutStart: !!onLogoutStart, onLogoutComplete: !!onLogoutComplete });
    setShowModal(true);
    if (onLogoutStart) onLogoutStart();
  };

  const handleConfirmLogout = async () => {
    console.log('🚪 LogoutButton: Iniciando logout confirmado');
    setIsLoggingOut(true);
    try {
      // Llamar la función de logout del padre si existe
      if (onLogoutComplete) {
        console.log('🚪 LogoutButton: Llamando función del padre (onLogoutComplete)');
        await onLogoutComplete();
        console.log('🚪 LogoutButton: Función del padre completada');
      } else {
        console.log('🚪 LogoutButton: No hay función del padre, usando servicio interno');
        // Si no hay función del padre, usar nuestro servicio
        await logoutService.performCompleteLogout();
        console.log('🚪 LogoutButton: Servicio interno completado');
      }
    } catch (error) {
      console.error('❌ LogoutButton: Error durante logout:', error);
      setIsLoggingOut(false);
    }
  };

  const baseClasses = {
    dropdown: "w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors",
    button: "inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    icon: "p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
  };

  const buttonClass = `${baseClasses[style]} ${className}`;

  return (
    <>
      <button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className={buttonClass}
        title="Cerrar Sesión"
      >
        <LogOut className="h-4 w-4" />
        {showText && (
          <span className={style === 'dropdown' ? '' : 'text-sm font-medium'}>
            {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
          </span>
        )}
      </button>

      <LogoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmLogout}
        user={user}
      />
    </>
  );
};

export default LogoutButton;