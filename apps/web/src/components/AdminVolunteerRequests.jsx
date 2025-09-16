import React, { useState } from 'react';
import {
  Clock, CheckCircle, XCircle, Users, Calendar, MapPin,
  Search, Filter, RefreshCw, Bell, AlertCircle
} from 'lucide-react';
import { usePendingRequests } from '../lib/hooks/useActivityRegistrations.js';
import activityRegistrationsService from '../lib/services/activity-registrations.service.js';

const AdminVolunteerRequests = ({ adminUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(new Set());

  const { requests, isLoading, error, refresh } = usePendingRequests();

  const handleApprove = async (requestId, notes = '') => {
    // Resolver ID del administrador
    let adminId = adminUser?.supabase_id || adminUser?.id;

    if (!adminId) {
      console.log('🔍 ADMIN: Resolving admin user ID...', adminUser);

      // Si es usuario de Google, buscar en Supabase
      if (adminUser?.email) {
        try {
          const { supabaseAPI } = await import('../lib/supabase-api.js');
          const supabaseUser = await supabaseAPI.users.getUserByEmail(adminUser.email);
          if (supabaseUser) {
            adminId = supabaseUser.id;
            console.log('✅ ADMIN: Found admin in Supabase:', adminId);
          }
        } catch (error) {
          console.warn('⚠️ ADMIN: Could not find admin in Supabase:', error);
        }
      }
    }

    if (!adminId) {
      alert('Error: No se pudo identificar el usuario administrador. Contacta al soporte técnico.');
      return;
    }

    setIsProcessing(prev => new Set(prev).add(requestId));
    try {
      console.log('✅ ADMIN: Approving request with admin ID:', adminId);

      await activityRegistrationsService.approveRegistration(
        requestId,
        adminId,
        notes
      );

      await refresh();
      console.log('✅ Request approved successfully');

    } catch (error) {
      console.error('❌ Error approving request:', error);
      alert('Error al aprobar la solicitud: ' + error.message);
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId, notes = '') => {
    // Resolver ID del administrador
    let adminId = adminUser?.supabase_id || adminUser?.id;

    if (!adminId) {
      console.log('🔍 ADMIN: Resolving admin user ID...', adminUser);

      // Si es usuario de Google, buscar en Supabase
      if (adminUser?.email) {
        try {
          const { supabaseAPI } = await import('../lib/supabase-api.js');
          const supabaseUser = await supabaseAPI.users.getUserByEmail(adminUser.email);
          if (supabaseUser) {
            adminId = supabaseUser.id;
            console.log('✅ ADMIN: Found admin in Supabase:', adminId);
          }
        } catch (error) {
          console.warn('⚠️ ADMIN: Could not find admin in Supabase:', error);
        }
      }
    }

    if (!adminId) {
      alert('Error: No se pudo identificar el usuario administrador. Contacta al soporte técnico.');
      return;
    }

    setIsProcessing(prev => new Set(prev).add(requestId));
    try {
      console.log('❌ ADMIN: Rejecting request with admin ID:', adminId);

      await activityRegistrationsService.rejectRegistration(
        requestId,
        adminId,
        notes
      );

      await refresh();
      console.log('✅ Request rejected successfully');

    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      alert('Error al rechazar la solicitud: ' + error.message);
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action, requestIds) => {
    if (requestIds.length === 0) return;

    const confirmMessage = action === 'approve'
      ? `¿Aprobar ${requestIds.length} solicitudes?`
      : `¿Rechazar ${requestIds.length} solicitudes?`;

    if (!confirm(confirmMessage)) return;

    for (const requestId of requestIds) {
      try {
        if (action === 'approve') {
          await handleApprove(requestId, 'Aprobación masiva');
        } else {
          await handleReject(requestId, 'Rechazo masivo');
        }
      } catch (error) {
        console.error(`Error processing request ${requestId}:`, error);
      }
    }
  };

  // Filtrar solicitudes
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm ||
      request.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.activity?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="space-x-2">
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Solicitudes de Voluntarios
              </h2>
              <p className="text-sm text-gray-500">
                {filteredRequests.length} solicitudes {selectedStatus === 'pending' ? 'pendientes' : selectedStatus}
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="divide-y divide-gray-100">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">Error cargando solicitudes: {error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay solicitudes {selectedStatus === 'pending' ? 'pendientes' : selectedStatus}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'No se encontraron solicitudes que coincidan con tu búsqueda.'
                : 'Las nuevas solicitudes aparecerán aquí automáticamente.'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Avatar del usuario */}
                <div className="flex-shrink-0">
                  <img
                    src={request.user?.avatar_url || '/default-avatar.jpg'}
                    alt={request.user?.first_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>

                {/* Información principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.user?.full_name ||
                         `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim() ||
                         request.user?.email ||
                         'Usuario sin nombre'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{request.user?.email}</p>

                      {/* Información de la actividad */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{request.activity?.title}</span>
                        </div>
                        {request.activity?.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.activity.location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(request.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      {/* Mensaje del usuario */}
                      {request.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                        </div>
                      )}

                      {/* Estado actual */}
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {request.status === 'pending' ? 'Pendiente' :
                           request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing.has(request.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{isProcessing.has(request.id) ? 'Aprobando...' : 'Aprobar'}</span>
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing.has(request.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminVolunteerRequests;