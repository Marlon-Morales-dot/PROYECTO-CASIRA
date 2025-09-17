import React, { useState, useEffect } from 'react';
import { Crown, UserCheck, Eye, CheckCircle } from 'lucide-react';
import './RoleChangeModal.css';

const RoleChangeModal = ({ isOpen, onAccept, onClose, roleChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('🎭 RoleChangeModal: isOpen:', isOpen, 'roleChange:', !!roleChange);
    if (isOpen) {
      console.log('✅ RoleChangeModal: Mostrando modal');
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, roleChange]);

  if (!isOpen || !roleChange) {
    console.log('🚫 RoleChangeModal: No renderizando - isOpen:', isOpen, 'roleChange:', !!roleChange);
    return null;
  }

  console.log('✅ RoleChangeModal: Renderizando modal completo');

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Modal principal */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          zIndex: 1000000
        }}
      >
        <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '20px' }}>
          🎉 ¡TU ROL HA SIDO ACTUALIZADO!
        </h1>

        <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          Ahora eres <strong>{roleNames[roleChange.newRole]}</strong>
        </p>

        <button
          onClick={handleAccept}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          ¡ACEPTAR Y CONTINUAR!
        </button>
      </div>
    </div>
  );
};

export default RoleChangeModal;