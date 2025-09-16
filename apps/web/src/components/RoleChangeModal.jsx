import React, { useState, useEffect } from 'react';
import { Crown, UserCheck, Eye, CheckCircle } from 'lucide-react';

const RoleChangeModal = ({ isOpen, onAccept, onClose, roleChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen || !roleChange) return null;

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
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header con gradiente */}
        <div className={`${roleColorClass} rounded-t-2xl p-6 text-white relative overflow-hidden`}>
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 opacity-10">
            <div className="w-32 h-32 rounded-full border-4 border-white transform translate-x-8 -translate-y-8"></div>
          </div>

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {roleEmojis[roleChange.newRole]} ¡Rol Actualizado!
            </h2>

            <p className="text-lg opacity-90">
              Ahora eres <strong>{roleNames[roleChange.newRole]}</strong>
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 leading-relaxed">
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

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleAccept}
              className={`flex-1 px-4 py-3 ${roleColorClass} text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Continuar</span>
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Un administrador ha actualizado tu rol. Serás redirigido a tu nueva área de trabajo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;