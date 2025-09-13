/**
 * UserRepository Port - Interface
 * Define el contrato para persistencia de usuarios
 * Implementado por adaptadores de infraestructura
 */

export class UserRepository {
  /**
   * Buscar usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>} Usuario encontrado o null
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>} Usuario encontrado o null
   */
  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented');
  }

  /**
   * Buscar usuario por Google ID
   * @param {string} googleId - Google ID del usuario
   * @returns {Promise<User|null>} Usuario encontrado o null
   */
  async findByGoogleId(googleId) {
    throw new Error('Method findByGoogleId must be implemented');
  }

  /**
   * Obtener todos los usuarios con filtros opcionales
   * @param {Object} filters - Filtros opcionales (role, isActive, etc.)
   * @param {Object} pagination - Paginación {offset, limit}
   * @returns {Promise<{users: User[], total: number}>} Lista de usuarios y total
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Crear nuevo usuario
   * @param {User} user - Entidad User a crear
   * @returns {Promise<User>} Usuario creado
   */
  async create(user) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar usuario existente
   * @param {User} user - Entidad User a actualizar
   * @returns {Promise<User>} Usuario actualizado
   */
  async update(user) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar usuario por ID
   * @param {string} id - ID del usuario a eliminar
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Verificar si existe un usuario con el email dado
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} True si existe
   */
  async existsByEmail(email) {
    throw new Error('Method existsByEmail must be implemented');
  }

  /**
   * Contar usuarios por rol
   * @returns {Promise<Object>} Objeto con conteo por rol
   */
  async countByRole() {
    throw new Error('Method countByRole must be implemented');
  }

  /**
   * Buscar usuarios por rol
   * @param {string} role - Rol a buscar (admin, volunteer, visitor)
   * @returns {Promise<User[]>} Lista de usuarios con ese rol
   */
  async findByRole(role) {
    throw new Error('Method findByRole must be implemented');
  }

  /**
   * Actualizar último login del usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateLastLogin(id) {
    throw new Error('Method updateLastLogin must be implemented');
  }

  /**
   * Activar/desactivar usuario
   * @param {string} id - ID del usuario
   * @param {boolean} isActive - Estado activo/inactivo
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateActiveStatus(id, isActive) {
    throw new Error('Method updateActiveStatus must be implemented');
  }

  /**
   * Cambiar rol de usuario
   * @param {string} id - ID del usuario
   * @param {string} newRole - Nuevo rol
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async changeRole(id, newRole) {
    throw new Error('Method changeRole must be implemented');
  }
}

export default UserRepository;