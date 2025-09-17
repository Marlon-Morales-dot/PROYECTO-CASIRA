import React, { useState } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import adminService from '../lib/services/admin.service.js';
import { UserCog, Send, CheckCircle, AlertCircle, Users } from 'lucide-react';

const AdminRoleChangeTest = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [targetEmail, setTargetEmail] = useState('');

  // Solo mostrar si el usuario es administrador
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleRoleChange = async (newRole) => {
    if (!targetEmail.trim()) {
      setResult({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      console.log(`🔄 Cambio de rol solicitado: ${targetEmail} → ${newRole}`);
      console.log(`🔄 Admin actual:`, user);

      const result = await adminService.updateUserRole(
        targetEmail.trim(),
        newRole,
        `Cambio administrativo de rol a ${newRole}`,
        true
      );

      console.log(`🔄 Resultado del AdminService:`, result);

      setResult({
        success: true,
        message: `✅ Usuario ${targetEmail} ahora es ${getRoleDisplayName(newRole)}`,
        details: `El usuario recibirá una notificación inmediata y será redirigido automáticamente.`
      });

      // Limpiar el campo después del éxito
      setTargetEmail('');

    } catch (error) {
      setResult({
        success: false,
        message: `❌ ${error.message}`,
        details: 'Verifica que el email sea correcto y que el usuario exista en el sistema.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'visitor': 'Visitante',
      'volunteer': 'Voluntario',
      'admin': 'Administrador'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
          <UserCog className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 truncate">
            Gestión de Roles de Usuario
          </h3>
          <p className="text-xs sm:text-sm text-blue-600">
            Cambios en tiempo real con notificación inmediata
          </p>
        </div>
      </div>

      {/* Formulario principal */}
      <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 border border-blue-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email del usuario:
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            />
          </div>

          {/* Botones de roles */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Asignar nuevo rol:
            </label>
            {/* Móvil: Botones verticales, Desktop: Grid horizontal */}
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => handleRoleChange('visitor')}
                disabled={processing || !targetEmail.trim()}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Visitante</span>
              </button>
              <button
                onClick={() => handleRoleChange('volunteer')}
                disabled={processing || !targetEmail.trim()}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
              >
                <UserCog className="w-4 h-4 flex-shrink-0" />
                <span>Voluntario</span>
              </button>
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={processing || !targetEmail.trim()}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
              >
                <Send className="w-4 h-4 flex-shrink-0" />
                <span>Administrador</span>
              </button>
            </div>
          </div>

          {/* Estado de procesamiento */}
          {processing && (
            <div className="flex items-center justify-center space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span className="text-blue-700 font-medium text-sm">
                Procesando cambio de rol...
              </span>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className={`p-3 sm:p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start space-x-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm break-words">{result.message}</p>
                  {result.details && (
                    <p className="text-xs sm:text-sm mt-1 opacity-90 break-words">{result.details}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRUEBAS DE NOTIFICACIÓN */}
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
        <p className="text-sm font-bold text-yellow-800 mb-3">
          🧪 Zona de Pruebas - Simular usuarios conectados:
        </p>

        {/* Prueba en ti mismo */}
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <p className="text-sm font-semibold text-gray-700 mb-2">1. Prueba local (en ti mismo):</p>
          <button
            onClick={() => {
              console.log('🧪 PRUEBA EN TI MISMO');
              window.dispatchEvent(new CustomEvent('role-changed', {
                detail: {
                  userEmail: user.email,
                  oldRole: 'admin',
                  newRole: 'volunteer',
                  timestamp: new Date().toISOString(),
                  source: 'self_test'
                }
              }));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
          >
            🔄 Probar Modal en Ti Mismo
          </button>
        </div>

        {/* Simular usuarios demo */}
        <div className="p-3 bg-white rounded-lg border">
          <p className="text-sm font-semibold text-gray-700 mb-3">2. Simular otros usuarios conectados:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                console.log('🧪 SIMULANDO usuario demo: admin@casira.org');
                window.dispatchEvent(new CustomEvent('role-changed', {
                  detail: {
                    userEmail: 'admin@casira.org',
                    oldRole: 'visitor',
                    newRole: 'admin',
                    timestamp: new Date().toISOString(),
                    source: 'demo_simulation'
                  }
                }));
              }}
              className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              👑 Simular admin@casira.org
            </button>

            <button
              onClick={() => {
                console.log('🧪 SIMULANDO usuario demo: volunteer@casira.org');
                window.dispatchEvent(new CustomEvent('role-changed', {
                  detail: {
                    userEmail: 'volunteer@casira.org',
                    oldRole: 'visitor',
                    newRole: 'volunteer',
                    timestamp: new Date().toISOString(),
                    source: 'demo_simulation'
                  }
                }));
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              🤝 Simular volunteer@casira.org
            </button>

            <button
              onClick={() => {
                console.log('🧪 SIMULANDO usuario demo: user@example.com');
                window.dispatchEvent(new CustomEvent('role-changed', {
                  detail: {
                    userEmail: 'user@example.com',
                    oldRole: 'visitor',
                    newRole: 'volunteer',
                    timestamp: new Date().toISOString(),
                    source: 'demo_simulation'
                  }
                }));
              }}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              👤 Simular user@example.com
            </button>

            <button
              onClick={() => {
                console.log('🧪 SIMULANDO usuario demo: eddyramirez150@gmail.com');
                window.dispatchEvent(new CustomEvent('role-changed', {
                  detail: {
                    userEmail: 'eddyramirez150@gmail.com',
                    oldRole: 'volunteer',
                    newRole: 'admin',
                    timestamp: new Date().toISOString(),
                    source: 'demo_simulation'
                  }
                }));
              }}
              className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              💼 Simular eddyramirez150@gmail.com
            </button>
          </div>
        </div>

        {/* Cambiar temporalmente el usuario para pruebas */}
        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm font-semibold text-purple-800 mb-2">3. Cambiar temporalmente tu usuario:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => {
                console.log('🔄 Cambiando temporalmente a: eddyramirez150@gmail.com');
                const currentUser = JSON.parse(localStorage.getItem('casira-user') || '{}');
                localStorage.setItem('casira-user-backup', JSON.stringify(currentUser));
                localStorage.setItem('casira-user', JSON.stringify({
                  ...currentUser,
                  email: 'eddyramirez150@gmail.com'
                }));
                window.location.reload();
              }}
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
            >
              👤 Ser eddyramirez150@gmail.com
            </button>
            <button
              onClick={() => {
                console.log('🔄 Cambiando temporalmente a: volunteer@casira.org');
                const currentUser = JSON.parse(localStorage.getItem('casira-user') || '{}');
                localStorage.setItem('casira-user-backup', JSON.stringify(currentUser));
                localStorage.setItem('casira-user', JSON.stringify({
                  ...currentUser,
                  email: 'volunteer@casira.org'
                }));
                window.location.reload();
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              🤝 Ser volunteer@casira.org
            </button>
            <button
              onClick={() => {
                console.log('🔄 Restaurando usuario original');
                const backup = localStorage.getItem('casira-user-backup');
                if (backup) {
                  localStorage.setItem('casira-user', backup);
                  localStorage.removeItem('casira-user-backup');
                  window.location.reload();
                } else {
                  alert('No hay backup del usuario original');
                }
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
            >
              🔙 Restaurar Usuario Original
            </button>
          </div>
          <p className="text-xs text-purple-700">
            ⚠️ Esto cambiará temporalmente tu usuario. Usa "Restaurar" para volver a tu usuario original.
          </p>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Cómo probar:</strong>
            1. Cambia temporalmente tu usuario con los botones de arriba
            2. Luego envía una notificación de cambio de rol para ese email
            3. Deberías ver el modal inmediatamente
            4. Restaura tu usuario original cuando termines
          </p>
        </div>
      </div>

      {/* Información de ayuda - Mejorada para móvil */}
      <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="bg-blue-600 rounded-full p-1 mt-0.5 flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1 sm:mb-2">
              ¿Cómo funciona?
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-start">
                <span className="mr-1 flex-shrink-0">•</span>
                <span>El usuario recibirá una notificación inmediata y prominente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1 flex-shrink-0">•</span>
                <span>Deberá aceptar el cambio para ser redirigido automáticamente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1 flex-shrink-0">•</span>
                <span>El cambio se aplica en tiempo real sin necesidad de recargar</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRoleChangeTest;