import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useActivityRegistrations } from '../lib/hooks/useActivityRegistrations.js';

const VolunteersList = ({
  activityId,
  showTitle = true,
  maxDisplay = 5,
  showPendingRequests = false,
  isAdmin = false,
  onApproveRequest = null,
  onRejectRequest = null
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const {
    participants,
    pendingRequests,
    volunteerCount,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    isApproving
  } = useActivityRegistrations(activityId);

  const handleApprove = async (requestId, adminUserId) => {
    try {
      if (onApproveRequest) {
        await onApproveRequest(requestId, adminUserId);
      } else {
        await approveRequest(requestId, adminUserId);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar la solicitud: ' + error.message);
    }
  };

  const handleReject = async (requestId, adminUserId) => {
    try {
      if (onRejectRequest) {
        await onRejectRequest(requestId, adminUserId);
      } else {
        await rejectRequest(requestId, adminUserId);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar la solicitud: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Error cargando voluntarios: {error}</p>
      </div>
    );
  }

  const displayParticipants = showAll ? participants : participants.slice(0, maxDisplay);
  const hasMore = participants.length > maxDisplay;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
      {/* Título */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Voluntarios ({volunteerCount})
            </h3>
          </div>
          {pendingRequests.length > 0 && isAdmin && (
            <button
              onClick={() => setShowPending(!showPending)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Clock className="h-4 w-4" />
              <span>{pendingRequests.length} pendientes</span>
            </button>
          )}
        </div>
      )}

      {/* Participantes confirmados */}
      {participants.length > 0 ? (
        <div className="space-y-3">
          {displayParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={participant.user?.avatar_url || '/default-avatar.jpg'}
                  alt={participant.user?.first_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {participant.user?.full_name ||
                   `${participant.user?.first_name || ''} ${participant.user?.last_name || ''}`.trim() ||
                   participant.user?.email ||
                   'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  Se unió el {new Date(participant.joined_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmado
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Ver menos</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Ver {participants.length - maxDisplay} más</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aún no hay voluntarios confirmados</p>
        </div>
      )}

      {/* Solicitudes pendientes (solo para admins) */}
      {showPendingRequests && isAdmin && pendingRequests.length > 0 && showPending && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span>Solicitudes Pendientes ({pendingRequests.length})</span>
          </h4>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <img
                  src={request.user?.avatar_url || '/default-avatar.jpg'}
                  alt={request.user?.first_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {request.user?.full_name ||
                     `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim() ||
                     request.user?.email ||
                     'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Solicitó el {new Date(request.created_at).toLocaleDateString('es-ES')}
                  </p>
                  {request.message && (
                    <p className="text-xs text-gray-600 mt-1 italic">"{request.message}"</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApprove(request.id, 'admin-user-id')} // TODO: obtener ID real del admin
                    disabled={isApproving}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isApproving ? 'Aprobando...' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => handleReject(request.id, 'admin-user-id')} // TODO: obtener ID real del admin
                    disabled={isApproving}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteersList;