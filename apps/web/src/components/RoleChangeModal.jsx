import React, { useState, useEffect } from 'react';
import { Crown, UserCheck, Eye, CheckCircle } from 'lucide-react';
import './RoleChangeModal.css';

const RoleChangeModal = ({ isOpen, onAccept, onClose, roleChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('🎭 RoleChangeModal: Props recibidas:', { isOpen, roleChange });
    if (isOpen) {
      console.log('✅ RoleChangeModal: Modal ABIERTO - configurando visible');
      setIsVisible(true);
    } else {
      console.log('❌ RoleChangeModal: Modal CERRADO');
      setIsVisible(false);
    }
  }, [isOpen, roleChange]);

  console.log('🎭 RoleChangeModal: Estado de renderizado:', { isOpen, roleChange: !!roleChange, isVisible });

  if (!isOpen || !roleChange) {
    console.log('🚫 RoleChangeModal: NO renderizando - isOpen:', isOpen, 'roleChange:', !!roleChange);
    return null;
  }

  console.log('✅ RoleChangeModal: SÍ renderizando modal completo');

  const roleIcons = {
    'admin': Crown,
    'volunteer': UserCheck,
    'visitor': Eye
  };

  const roleColors = {
    'admin': 'bg-gradient-to-r from-red-500 to-red-600',
    'volunteer': 'bg-gradient-to-r from-purple-500 to-purple-600',
    'visitor': 'bg-gradient-to-r from-green-500 to-green-600'
  };

  const roleNames = {
    'admin': 'Administrador',
    'volunteer': 'Voluntario',
    'visitor': 'Visitante'
  };

  const roleEmojis = {
    'admin': '👑',
    'volunteer': '🤝',
    'visitor': '👁️'
  };

  const roleMessages = {
    'admin': '¡Felicitaciones! Ahora tienes acceso completo para gestionar usuarios, actividades y el sistema.',
    'volunteer': '¡Excelente! Ahora puedes participar activamente en actividades y hacer la diferencia en tu comunidad.',
    'visitor': 'Ahora puedes explorar actividades y registrarte como voluntario cuando estés listo.'
  };

  const IconComponent = roleIcons[roleChange.newRole];
  const roleColorClass = roleColors[roleChange.newRole];

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`} style={{ zIndex: 9999 }}>
      {/* Backdrop con desenfoque */}
      <div className="absolute inset-0 role-modal-backdrop"></div>

      {/* Modal - Más grande y llamativo */}
      <div className={`relative bg-white rounded-3xl role-modal-container max-w-lg w-full mx-4 transform transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0 role-modal-enter' : 'scale-95 translate-y-4 role-modal-exit'
      } animate-pulse-gentle`}>
        {/* Header con gradiente - Más grande y llamativo */}
        <div className={`${roleColorClass} rounded-t-3xl p-8 text-white relative overflow-hidden`}>
          {/* Decoración de fondo animada */}
          <div className="absolute top-0 right-0 opacity-10">
            <div className="w-40 h-40 rounded-full border-4 border-white transform translate-x-8 -translate-y-8 animate-spin-slow"></div>
          </div>
          <div className="absolute bottom-0 left-0 opacity-5">
            <div className="w-24 h-24 rounded-full border-2 border-white transform -translate-x-4 translate-y-4 animate-bounce-slow"></div>
          </div>

          <div className="relative z-10 text-center">
            {/* Icono más grande con animación */}
            <div className="w-24 h-24 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-bounce">
              <IconComponent className="w-12 h-12 text-white" />
            </div>

            {/* Título más grande y llamativo */}
            <h1 className="text-4xl font-bold mb-4 text-glow">
              {roleEmojis[roleChange.newRole]} ¡TU ROL HA SIDO ACTUALIZADO!
            </h1>

            <p className="text-xl opacity-90 font-semibold">
              Ahora eres <strong className="text-2xl">{roleNames[roleChange.newRole]}</strong>
            </p>
          </div>
        </div>

        {/* Contenido - Más espacioso */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                {roleMessages[roleChange.newRole]}
              </p>
            </div>

            {/* Transición visual */}
            <div className="flex items-center justify-center space-x-4 py-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mb-1">
                  {roleEmojis[roleChange.oldRole]}
                </div>
                <span className="text-xs text-gray-500">{roleNames[roleChange.oldRole]}</span>
              </div>

              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-blue-500 to-gray-300 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className={`w-10 h-10 ${roleColorClass} rounded-full flex items-center justify-center mb-1`}>
                  {roleEmojis[roleChange.newRole]}
                </div>
                <span className="text-xs text-gray-700 font-medium">{roleNames[roleChange.newRole]}</span>
              </div>
            </div>
          </div>

          {/* Botones más grandes y llamativos */}
          <div className="flex space-x-4">
            {!roleChange?.redirecting && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={handleAccept}
              disabled={roleChange?.redirecting}
              className={`${roleChange?.redirecting ? 'w-full' : 'flex-1'} px-6 py-4 ${roleColorClass} text-white font-bold text-lg rounded-xl role-modal-button role-modal-primary-button transition-all duration-300 flex items-center justify-center space-x-3 ${
                roleChange?.redirecting ? 'animate-pulse' : 'animate-pulse'
              } ${roleChange?.redirecting ? 'opacity-90 cursor-not-allowed' : ''}`}
            >
              {roleChange?.redirecting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{roleChange.redirectMessage || 'Redirigiendo...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span>¡ACEPTAR Y CONTINUAR!</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Información adicional - Más visible */}
        <div className="px-8 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center font-medium">
              📢 Un administrador ha actualizado tu rol. Al aceptar, serás redirigido automáticamente a tu nueva área de trabajo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;