/* ============================================
   INSTRUCCIONES DE INSTALACIÓN:

   1. Busca en VolunteerDashboard.jsx la sección con el comentario:
      {/* Profile Tab */}
      {activeTab === 'profile' && (

   2. ANTES de esa sección, inserta TODO el código de abajo
   3. Guarda el archivo

   Este código incluye:
   - Tab "Crear Mis Actividades" (my-created-activities)
   - Modal de creación/edición de actividades
   ============================================ */

{/* My Created Activities Tab */}
{activeTab === 'my-created-activities' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Actividades Creadas</h2>
        <p className="text-sm text-gray-600 mt-1">
          Actividades que has creado para que otros se unan
        </p>
      </div>
      <button
        onClick={() => {
          setEditingVolunteerActivity(null);
          setActivityFormData({
            title: '',
            description: '',
            detailed_description: '',
            location: '',
            start_date: '',
            end_date: '',
            max_participants: 10,
            image_url: '',
            requirements: [],
            benefits: []
          });
          setShowCreateActivityModal(true);
        }}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>Crear Nueva Actividad</span>
      </button>
    </div>

    {/* Activity Cards Grid */}
    {myVolunteerActivities.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No has creado actividades aún
        </h3>
        <p className="text-gray-600 mb-4">
          Crea tu primera actividad y permite que otros visitantes se unan
        </p>
        <button
          onClick={() => setShowCreateActivityModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear Mi Primera Actividad
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myVolunteerActivities.map((activity) => {
          const activityPendingRequests = activityRequests.filter(
            r => r.activity_id === activity.id && r.status === 'pending'
          );
          const activityApprovedRequests = activityRequests.filter(
            r => r.activity_id === activity.id && r.status === 'approved'
          );

          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 overflow-hidden rounded-t-xl">
                <img
                  src={activity.image_url || '/grupo-canadienses.jpg'}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
                {activityPendingRequests.length > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Bell className="h-3 w-3 mr-1" />
                      {activityPendingRequests.length} solicitudes
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>

                <div className="space-y-2 mb-4">
                  {activity.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {activity.location}
                    </div>
                  )}
                  {activity.start_date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(activity.start_date).toLocaleDateString('es-ES')}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {activity.current_participants || 0}/{activity.max_participants || '∞'} participantes
                  </div>
                </div>

                {/* Requests Section */}
                {activityPendingRequests.length > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">
                      Solicitudes pendientes ({activityPendingRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {activityPendingRequests.slice(0, 2).map((request) => (
                        <div key={request.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <img
                              src={request.users?.avatar_url || '/default-avatar.jpg'}
                              alt={request.users?.first_name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-gray-700">
                              {request.users?.first_name} {request.users?.last_name}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Aprobar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Rechazar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {activityPendingRequests.length > 2 && (
                        <p className="text-xs text-orange-600">
                          +{activityPendingRequests.length - 2} más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Approved participants */}
                {activityApprovedRequests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Participantes confirmados:</p>
                    <div className="flex -space-x-2">
                      {activityApprovedRequests.slice(0, 5).map((request) => (
                        <img
                          key={request.id}
                          src={request.users?.avatar_url || '/default-avatar.jpg'}
                          alt={request.users?.first_name}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          title={`${request.users?.first_name} ${request.users?.last_name}`}
                        />
                      ))}
                      {activityApprovedRequests.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">
                            +{activityApprovedRequests.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditVolunteerActivity(activity)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVolunteerActivity(activity.id)}
                    className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

{/* CREATE/EDIT ACTIVITY MODAL */}
{showCreateActivityModal && (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center overflow-y-auto h-full w-full z-50 p-4">
    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingVolunteerActivity ? 'Editar Actividad' : 'Crear Nueva Actividad'}
              </h3>
              <p className="text-blue-100 text-xs">
                {editingVolunteerActivity ? 'Modifica los detalles' : 'Crea una oportunidad para la comunidad'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowCreateActivityModal(false);
              setEditingVolunteerActivity(null);
            }}
            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <form onSubmit={editingVolunteerActivity ? handleUpdateVolunteerActivity : handleCreateVolunteerActivity} className="space-y-4">
          {/* Basic Info */}
          <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
            <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Información Básica
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={activityFormData.title}
                  onChange={(e) => setActivityFormData({...activityFormData, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm"
                  placeholder="Ej: Taller de Alfabetización Digital"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descripción Breve *
                </label>
                <textarea
                  required
                  rows="2"
                  value={activityFormData.description}
                  onChange={(e) => setActivityFormData({...activityFormData, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm resize-none"
                  placeholder="Describe brevemente el propósito..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows="3"
                  value={activityFormData.detailed_description}
                  onChange={(e) => setActivityFormData({...activityFormData, detailed_description: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm resize-none"
                  placeholder="Objetivos específicos, metodología, beneficiarios..."
                />
              </div>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="bg-purple-50 rounded-md p-4 border border-purple-200">
            <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Ubicación y Fechas
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  required
                  value={activityFormData.location}
                  onChange={(e) => setActivityFormData({...activityFormData, location: e.target.value})}
                  className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  placeholder="Ej: Guatemala Ciudad, Zona 1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={activityFormData.start_date}
                    onChange={(e) => setActivityFormData({...activityFormData, start_date: e.target.value})}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={activityFormData.end_date}
                    onChange={(e) => setActivityFormData({...activityFormData, end_date: e.target.value})}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    min={activityFormData.start_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  min="1"
                  value={activityFormData.max_participants}
                  onChange={(e) => setActivityFormData({...activityFormData, max_participants: parseInt(e.target.value)})}
                  className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">Número máximo de personas que pueden participar</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="bg-orange-50 rounded-md p-4 border border-orange-200">
            <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Imagen de la Actividad
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL de Imagen
              </label>
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={activityFormData.image_url}
                onChange={(e) => setActivityFormData({...activityFormData, image_url: e.target.value})}
                className="w-full px-3 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              />
              {activityFormData.image_url && (
                <div className="mt-3">
                  <img
                    src={activityFormData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                    onError={(e) => {
                      e.target.src = '/grupo-canadienses.jpg';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowCreateActivityModal(false);
                setEditingVolunteerActivity(null);
              }}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {editingVolunteerActivity ? 'Actualizar Actividad' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
