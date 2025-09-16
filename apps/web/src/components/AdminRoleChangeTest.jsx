import React, { useState } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import adminService from '../lib/services/admin.service.js';

const AdminRoleChangeTest = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Solo mostrar si el usuario es administrador
  if (!user || user.role !== 'admin') {
    return null;
  }

  const testRoleChange = async (targetUserEmail, newRole) => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log(`🧪 AdminRoleChangeTest: Probando cambio de rol para ${targetUserEmail} a ${newRole}`);
      console.log(`🧪 AdminRoleChangeTest: Administrador actual:`, user);

      // Verificar que hay email válido
      if (!targetUserEmail || !targetUserEmail.includes('@')) {
        throw new Error('Por favor ingresa un email válido');
      }

      // Usar el AdminService real para hacer el cambio
      const result = await adminService.updateUserRole(targetUserEmail, newRole, `Cambio de prueba a ${newRole}`, true);

      setTestResult({
        success: true,
        message: `✅ Cambio exitoso: ${targetUserEmail} ahora es ${newRole}`,
        data: result
      });

      console.log('✅ AdminRoleChangeTest: Cambio de rol exitoso');

    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error: ${error.message}`,
        error: error
      });

      console.error('❌ AdminRoleChangeTest: Error en cambio de rol:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">
        🧪 Prueba de Notificación de Cambio de Rol
      </h3>

      <p className="text-sm text-yellow-700 mb-4">
        Como administrador, puedes probar la funcionalidad de notificación en tiempo real.
        Ingresa el email de un usuario para cambiar su rol y ver la notificación inmediata.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-yellow-700 mb-1">
            Email del usuario a cambiar:
          </label>
          <input
            type="email"
            id="test-user-email"
            placeholder="usuario@ejemplo.com"
            className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            disabled={testing}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              const email = document.getElementById('test-user-email').value;
              if (email) testRoleChange(email, 'visitor');
            }}
            disabled={testing}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            → Visitante
          </button>
          <button
            onClick={() => {
              const email = document.getElementById('test-user-email').value;
              if (email) testRoleChange(email, 'volunteer');
            }}
            disabled={testing}
            className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            → Voluntario
          </button>
          <button
            onClick={() => {
              const email = document.getElementById('test-user-email').value;
              if (email) testRoleChange(email, 'admin');
            }}
            disabled={testing}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            → Admin
          </button>
        </div>

        {testing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Procesando cambio de rol...</span>
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-md ${
            testResult.success
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <p className="text-sm font-medium">{testResult.message}</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-xs text-blue-700">
          💡 <strong>Nota:</strong> El usuario recibirá una notificación grande e inmediata
          si está conectado en el sistema. Luego será redirigido automáticamente a su nuevo panel.
        </p>
      </div>

      {/* Botón de prueba temporal para verificar el modal */}
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
        <p className="text-sm font-medium text-red-800 mb-2">🧪 Prueba de Modal (Temporal)</p>
        <button
          onClick={() => {
            console.log('🧪 PRUEBA: Disparando evento de prueba manual');
            window.dispatchEvent(new CustomEvent('role-changed', {
              detail: {
                userEmail: user.email,
                oldRole: 'visitor',
                newRole: 'volunteer',
                timestamp: new Date().toISOString(),
                source: 'test_button'
              }
            }));
          }}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Probar Modal en TI MISMO
        </button>
        <p className="text-xs text-red-600 mt-1">
          Esto disparará el modal en tu propia sesión para verificar que funciona.
        </p>
      </div>
    </div>
  );
};

export default AdminRoleChangeTest;