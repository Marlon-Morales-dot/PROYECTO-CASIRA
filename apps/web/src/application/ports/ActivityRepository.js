/**
 * ActivityRepository Port - Interface
 * Define el contrato para persistencia de actividades
 * Implementado por adaptadores de infraestructura
 */

export class ActivityRepository {
  /**
   * Buscar actividad por ID
   * @param {string} id - ID de la actividad
   * @returns {Promise<Activity|null>} Actividad encontrada o null
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Obtener todas las actividades con filtros opcionales
   * @param {Object} filters - Filtros (status, categoryId, creatorId, etc.)
   * @param {Object} pagination - Paginación {offset, limit}
   * @param {Object} sorting - Ordenamiento {field, direction}
   * @returns {Promise<{activities: Activity[], total: number}>} Lista de actividades y total
   */
  async findAll(filters = {}, pagination = {}, sorting = {}) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Obtener actividades destacadas
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Activity[]>} Lista de actividades destacadas
   */
  async findFeatured(limit = 10) {
    throw new Error('Method findFeatured must be implemented');
  }

  /**
   * Obtener actividades por estado
   * @param {string} status - Estado (active, completed, draft, cancelled)
   * @param {Object} pagination - Paginación opcional
   * @returns {Promise<Activity[]>} Lista de actividades
   */
  async findByStatus(status, pagination = {}) {
    throw new Error('Method findByStatus must be implemented');
  }

  /**
   * Obtener actividades por categoría
   * @param {string} categoryId - ID de la categoría
   * @param {Object} pagination - Paginación opcional
   * @returns {Promise<Activity[]>} Lista de actividades
   */
  async findByCategory(categoryId, pagination = {}) {
    throw new Error('Method findByCategory must be implemented');
  }

  /**
   * Obtener actividades por creador
   * @param {string} creatorId - ID del creador
   * @param {Object} pagination - Paginación opcional
   * @returns {Promise<Activity[]>} Lista de actividades
   */
  async findByCreator(creatorId, pagination = {}) {
    throw new Error('Method findByCreator must be implemented');
  }

  /**
   * Buscar actividades por texto
   * @param {string} searchText - Texto a buscar en título/descripción
   * @param {Object} filters - Filtros adicionales
   * @param {Object} pagination - Paginación opcional
   * @returns {Promise<{activities: Activity[], total: number}>} Resultados de búsqueda
   */
  async search(searchText, filters = {}, pagination = {}) {
    throw new Error('Method search must be implemented');
  }

  /**
   * Crear nueva actividad
   * @param {Activity} activity - Entidad Activity a crear
   * @returns {Promise<Activity>} Actividad creada
   */
  async create(activity) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar actividad existente
   * @param {Activity} activity - Entidad Activity a actualizar
   * @returns {Promise<Activity>} Actividad actualizada
   */
  async update(activity) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar actividad por ID
   * @param {string} id - ID de la actividad a eliminar
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Incrementar número de voluntarios de una actividad
   * @param {string} id - ID de la actividad
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async incrementVolunteers(id) {
    throw new Error('Method incrementVolunteers must be implemented');
  }

  /**
   * Decrementar número de voluntarios de una actividad
   * @param {string} id - ID de la actividad
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async decrementVolunteers(id) {
    throw new Error('Method decrementVolunteers must be implemented');
  }

  /**
   * Incrementar contador de visualizaciones
   * @param {string} id - ID de la actividad
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async incrementViews(id) {
    throw new Error('Method incrementViews must be implemented');
  }

  /**
   * Incrementar contador de likes
   * @param {string} id - ID de la actividad
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async incrementLikes(id) {
    throw new Error('Method incrementLikes must be implemented');
  }

  /**
   * Decrementar contador de likes
   * @param {string} id - ID de la actividad
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async decrementLikes(id) {
    throw new Error('Method decrementLikes must be implemented');
  }

  /**
   * Cambiar estado de destacado
   * @param {string} id - ID de la actividad
   * @param {boolean} featured - True para destacar, false para quitar
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateFeaturedStatus(id, featured) {
    throw new Error('Method updateFeaturedStatus must be implemented');
  }

  /**
   * Cambiar estado de la actividad
   * @param {string} id - ID de la actividad
   * @param {string} status - Nuevo estado
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateStatus(id, status) {
    throw new Error('Method updateStatus must be implemented');
  }

  /**
   * Obtener estadísticas de actividades
   * @returns {Promise<Object>} Estadísticas (total, por estado, etc.)
   */
  async getStats() {
    throw new Error('Method getStats must be implemented');
  }

  /**
   * Obtener actividades próximas a vencer
   * @param {number} days - Días hacia adelante para buscar
   * @returns {Promise<Activity[]>} Lista de actividades próximas
   */
  async findUpcoming(days = 7) {
    throw new Error('Method findUpcoming must be implemented');
  }

  /**
   * Obtener actividades que necesitan voluntarios
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Activity[]>} Lista de actividades que necesitan voluntarios
   */
  async findNeedingVolunteers(filters = {}) {
    throw new Error('Method findNeedingVolunteers must be implemented');
  }
}

export default ActivityRepository;