import React from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';

const RoleChangeTestButton = () => {
  const { user } = useAuth();

  const testRoleChange = (newRole) => {
    if (!user) {
      alert('Debes estar logueado para probar el cambio de rol');
      return;
    }

    console.log('🧪 TEST: Simulando cambio de rol para:', user.email);

    // Simular cambio de rol inmediato
    window.dispatchEvent(new CustomEvent('role-changed', {
      detail: {
        userEmail: user.email,
        oldRole: user.role || 'visitor',
        newRole: newRole,
        timestamp: new Date().toISOString(),
        source: 'test_simulation'
      }
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <p className="text-sm font-medium mb-2">🧪 Prueba de Cambio de Rol</p>
      <div className="flex space-x-2">
        <button
          onClick={() => testRoleChange('visitor')}
          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          → Visitante
        </button>
        <button
          onClick={() => testRoleChange('volunteer')}
          className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          → Voluntario
        </button>
        <button
          onClick={() => testRoleChange('admin')}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          → Admin
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Usuario actual: {user.email} ({user.role})
      </p>
    </div>
  );
};

export default RoleChangeTestButton;