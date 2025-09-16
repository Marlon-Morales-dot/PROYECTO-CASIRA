// ============= CASIRA Connect - Hook para Cambios de Rol Pendientes =============
import { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import pendingRoleChangeService from '../lib/services/pending-role-change.service.js';

export const usePendingRoleChanges = () => {
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasCheckedOnLogin, setHasCheckedOnLogin] = useState(false);
  const { user } = useAuth();

  // Verificar cambios pendientes al login/mount
  useEffect(() => {
    if (user?.id && !hasCheckedOnLogin) {
      console.log('🔍 usePendingRoleChanges: Verificando cambios pendientes al login para:', user.email);
      checkPendingChangesOnLogin();
      setHasCheckedOnLogin(true);
    }
  }, [user, hasCheckedOnLogin]);

  // Escuchar eventos de cambios pendientes
  useEffect(() => {
    if (!user) return;

    const handlePendingChangeCreated = (event) => {
      console.log('📬 usePendingRoleChanges: Nuevo cambio pendiente detectado');
      loadPendingChanges();
    };

    const handleChangeProcessed = () => {
      console.log('✅ usePendingRoleChanges: Cambio procesado, actualizando lista');
      loadPendingChanges();
    };

    window.addEventListener('pending-role-change-created', handlePendingChangeCreated);
    window.addEventListener('role-change-accepted', handleChangeProcessed);
    window.addEventListener('role-change-rejected', handleChangeProcessed);

    return () => {
      window.removeEventListener('pending-role-change-created', handlePendingChangeCreated);
      window.removeEventListener('role-change-accepted', handleChangeProcessed);
      window.removeEventListener('role-change-rejected', handleChangeProcessed);
    };
  }, [user]);

  const loadPendingChanges = async () => {
    if (!user?.id) {
      setPendingChanges([]);
      return;
    }

    try {
      setLoading(true);
      const changes = await pendingRoleChangeService.getPendingRoleChanges(user.id);
      setPendingChanges(changes);
      console.log(`📊 usePendingRoleChanges: ${changes.length} cambios pendientes cargados`);
    } catch (error) {
      console.error('❌ Error cargando cambios pendientes:', error);
      setPendingChanges([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingChangesOnLogin = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 usePendingRoleChanges: Verificando cambios pendientes al login...');

      const changes = await pendingRoleChangeService.checkPendingChangesOnLogin(user.id);
      setPendingChanges(changes);

      if (changes.length > 0) {
        console.log(`📬 ${changes.length} cambios pendientes encontrados al login`);
      }
    } catch (error) {
      console.error('❌ Error verificando cambios al login:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptChange = async (changeId) => {
    try {
      await pendingRoleChangeService.acceptRoleChange(changeId);

      // Remover de la lista local inmediatamente
      setPendingChanges(prev => prev.filter(change => change.id !== changeId));

      return true;
    } catch (error) {
      console.error('❌ Error aceptando cambio:', error);
      throw error;
    }
  };

  const rejectChange = async (changeId) => {
    try {
      await pendingRoleChangeService.rejectRoleChange(changeId);

      // Remover de la lista local inmediatamente
      setPendingChanges(prev => prev.filter(change => change.id !== changeId));

      return true;
    } catch (error) {
      console.error('❌ Error rechazando cambio:', error);
      throw error;
    }
  };

  const refreshPendingChanges = () => {
    loadPendingChanges();
  };

  const markAsChecked = () => {
    setHasCheckedOnLogin(true);
  };

  return {
    pendingChanges,
    loading,
    hasPendingChanges: pendingChanges.length > 0,
    acceptChange,
    rejectChange,
    refreshPendingChanges,
    markAsChecked,
    checkPendingChangesOnLogin
  };
};

export default usePendingRoleChanges;