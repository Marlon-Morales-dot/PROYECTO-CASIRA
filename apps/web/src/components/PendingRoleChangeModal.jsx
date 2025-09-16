// ============= CASIRA Connect - Modal de Cambios de Rol Pendientes =============
import React, { useState, useEffect } from 'react';
import { Crown, UserCheck, Eye, CheckCircle, XCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import pendingRoleChangeService from '../lib/services/pending-role-change.service.js';

const PendingRoleChangeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('❌ PendingRoleChangeModal: No hay usuario');
      return;
    }

    console.log('🔧 PendingRoleChangeModal: Configurando listeners para usuario:', user.email);
    console.log('🔧 PendingRoleChangeModal: Usuario completo:', user);

    // Listener para cambios pendientes encontrados al login
    const handlePendingChangesFound = (event) => {
      const { changes } = event.detail;
      console.log('📬 PendingRoleChangeModal: Cambios pendientes encontrados:', changes);

      if (changes && changes.length > 0) {
        setPendingChanges(changes);
        setIsOpen(true);
      }
    };

    // Listener para nuevos cambios pendientes creados
    const handlePendingChangeCreated = (event) => {
      const { userId } = event.detail;
      console.log('🔔 PendingRoleChangeModal: Nuevo cambio pendiente para:', userId);

      if (user.id === userId || user.email === userId) {
        loadPendingChanges();
      }
    };

    // Listener para cambios aceptados/rechazados
    const handleChangeProcessed = () => {
      console.log('✅ PendingRoleChangeModal: Cambio procesado, recargando...');
      loadPendingChanges();
    };

    window.addEventListener('pending-role-changes-found', handlePendingChangesFound);
    window.addEventListener('pending-role-change-created', handlePendingChangeCreated);
    window.addEventListener('role-change-accepted', handleChangeProcessed);
    window.addEventListener('role-change-rejected', handleChangeProcessed);

    // Verificar cambios pendientes al montar el componente
    loadPendingChanges();

    // FUNCIÓN DE PRUEBA - TEMPORAL
    window.testPendingModal = () => {
      console.log('🧪 PRUEBA: Forzando modal de prueba');
      setPendingChanges([{
        id: 'test-123',
        old_role: 'visitor',
        new_role: 'volunteer',
        message: 'Esto es una prueba',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        admin: {
          full_name: 'Admin de Prueba',
          email: 'admin@test.com'
        }
      }]);
      setIsOpen(true);
    };

    return () => {
      window.removeEventListener('pending-role-changes-found', handlePendingChangesFound);
      window.removeEventListener('pending-role-change-created', handlePendingChangeCreated);
      window.removeEventListener('role-change-accepted', handleChangeProcessed);
      window.removeEventListener('role-change-rejected', handleChangeProcessed);
      delete window.testPendingModal;
    };
  }, [user]);

  const loadPendingChanges = async () => {
    if (!user?.id) {
      console.log('❌ PendingRoleChangeModal: No hay user.id para cargar cambios');
      return;
    }

    try {
      console.log('🔄 PendingRoleChangeModal: Cargando cambios pendientes para:', user.id);
      setLoading(true);
      const changes = await pendingRoleChangeService.getPendingRoleChanges(user.id);
      console.log('📋 PendingRoleChangeModal: Cambios encontrados:', changes);
      setPendingChanges(changes);

      if (changes.length > 0 && !isOpen) {
        console.log('✅ PendingRoleChangeModal: Abriendo modal con', changes.length, 'cambios');
        setIsOpen(true);
      } else {
        console.log('ℹ️ PendingRoleChangeModal: No hay cambios pendientes o modal ya está abierto');
      }
    } catch (error) {
      console.error('❌ Error cargando cambios pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChange = async (changeId) => {
    try {
      setProcessing(changeId);
      console.log('✅ Aceptando cambio de rol:', changeId);

      await pendingRoleChangeService.acceptRoleChange(changeId);

      // Remover el cambio de la lista
      setPendingChanges(prev => prev.filter(change => change.id !== changeId));

      // Si no hay más cambios, cerrar el modal
      if (pendingChanges.length <= 1) {
        setIsOpen(false);
      }

      // Forzar recarga del usuario después de un momento
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Error aceptando cambio:', error);
      alert('Error al aceptar el cambio de rol. Por favor intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectChange = async (changeId) => {
    try {
      setProcessing(changeId);
      console.log('❌ Rechazando cambio de rol:', changeId);

      await pendingRoleChangeService.rejectRoleChange(changeId);

      // Remover el cambio de la lista
      setPendingChanges(prev => prev.filter(change => change.id !== changeId));

      // Si no hay más cambios, cerrar el modal
      if (pendingChanges.length <= 1) {
        setIsOpen(false);
      }

    } catch (error) {
      console.error('❌ Error rechazando cambio:', error);
      alert('Error al rechazar el cambio de rol. Por favor intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const getRoleIcon = (role) => {
    const icons = {
      'admin': Crown,
      'volunteer': UserCheck,
      'visitor': Eye
    };
    return icons[role] || User;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'from-red-500 to-red-600',
      'volunteer': 'from-purple-500 to-purple-600',
      'visitor': 'from-green-500 to-green-600'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  const formatTimeLeft = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;

    if (diffMs <= 0) return 'Expirado';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    }
  };

  // Log para debug
  console.log('🔍 PendingRoleChangeModal render:', {
    isOpen,
    pendingChangesCount: pendingChanges.length,
    user: user?.email,
    willShow: isOpen && pendingChanges.length > 0
  });

  if (!isOpen || pendingChanges.length === 0) {
    console.log('❌ PendingRoleChangeModal: No se muestra modal. isOpen:', isOpen, 'pendingChanges:', pendingChanges.length);
    return null;
  }

  console.log('✅ PendingRoleChangeModal: MOSTRANDO MODAL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Cambio de Rol Pendiente</h2>
                <p className="text-blue-100 text-sm">
                  {pendingChanges.length} cambio{pendingChanges.length !== 1 ? 's' : ''} requiere{pendingChanges.length === 1 ? '' : 'n'} tu confirmación
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {pendingChanges.map((change, index) => {
            const OldIcon = getRoleIcon(change.old_role);
            const NewIcon = getRoleIcon(change.new_role);
            const newRoleColor = getRoleColor(change.new_role);
            const isProcessing = processing === change.id;
            const timeLeft = formatTimeLeft(change.expires_at);
            const isExpiringSoon = new Date(change.expires_at) - new Date() < 24 * 60 * 60 * 1000; // Menos de 24 horas

            return (
              <div key={change.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Admin Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {change.admin?.full_name ||
                       `${change.admin?.first_name || ''} ${change.admin?.last_name || ''}`.trim() ||
                       change.admin?.email ||
                       'Administrador'}
                    </p>
                    <p className="text-xs text-gray-500">quiere cambiar tu rol</p>
                  </div>
                </div>

                {/* Role Change Visualization */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-4">
                    {/* Old Role */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                        <OldIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {pendingRoleChangeService.getRoleDisplayName(change.old_role)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-blue-500 to-gray-300 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">→</span>
                        </div>
                      </div>
                    </div>

                    {/* New Role */}
                    <div className="text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${newRoleColor} rounded-full flex items-center justify-center mb-2`}>
                        <NewIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {pendingRoleChangeService.getRoleDisplayName(change.new_role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {change.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Mensaje del administrador:</span><br />
                      "{change.message}"
                    </p>
                  </div>
                )}

                {/* Time Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Expira en: {timeLeft}</span>
                  </div>
                  {isExpiringSoon && (
                    <span className="text-orange-600 font-medium">¡Expirando pronto!</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleRejectChange(change.id)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isProcessing ? 'Procesando...' : 'Rechazar'}</span>
                  </button>

                  <button
                    onClick={() => handleAcceptChange(change.id)}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2 bg-gradient-to-r ${newRoleColor} text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isProcessing ? 'Aceptando...' : 'Aceptar'}</span>
                  </button>
                </div>

                {index < pendingChanges.length - 1 && (
                  <hr className="border-gray-200" />
                )}
              </div>
            );
          })}

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Los cambios de rol expiran automáticamente después de 7 días si no son aceptados.
            </p>
            <button
              onClick={handleClose}
              className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Revisar más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRoleChangeModal;