/**
 * AuthRepository Port - Interface
 * Define el contrato para operaciones de autenticación
 * Implementado por adaptadores de infraestructura
 */

export class AuthRepository {
  /**
   * Autenticar usuario con credenciales CASIRA
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<{user: User, token: string}>} Usuario autenticado y token
   */
  async authenticateWithCasira(email, password) {
    throw new Error('Method authenticateWithCasira must be implemented');
  }

  /**
   * Autenticar usuario con token de Google
   * @param {string} googleToken - Token de Google
   * @returns {Promise<{user: User, token: string}>} Usuario autenticado y token
   */
  async authenticateWithGoogle(googleToken) {
    throw new Error('Method authenticateWithGoogle must be implemented');
  }

  /**
   * Registrar nuevo usuario con credenciales CASIRA
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<{user: User, token: string}>} Usuario creado y token
   */
  async registerWithCasira(userData) {
    throw new Error('Method registerWithCasira must be implemented');
  }

  /**
   * Verificar y refrescar token JWT
   * @param {string} token - Token JWT a verificar
   * @returns {Promise<{user: User, token: string}>} Usuario y token actualizado
   */
  async verifyToken(token) {
    throw new Error('Method verifyToken must be implemented');
  }

  /**
   * Cerrar sesión del usuario
   * @param {string} token - Token del usuario
   * @returns {Promise<boolean>} True si se cerró sesión correctamente
   */
  async logout(token) {
    throw new Error('Method logout must be implemented');
  }

  /**
   * Cambiar contraseña del usuario
   * @param {string} userId - ID del usuario
   * @param {string} oldPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} True si se cambió correctamente
   */
  async changePassword(userId, oldPassword, newPassword) {
    throw new Error('Method changePassword must be implemented');
  }

  /**
   * Solicitar restablecimiento de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<boolean>} True si se envió el email
   */
  async requestPasswordReset(email) {
    throw new Error('Method requestPasswordReset must be implemented');
  }

  /**
   * Restablecer contraseña con token
   * @param {string} resetToken - Token de restablecimiento
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} True si se restableció correctamente
   */
  async resetPassword(resetToken, newPassword) {
    throw new Error('Method resetPassword must be implemented');
  }

  /**
   * Verificar email del usuario
   * @param {string} verificationToken - Token de verificación
   * @returns {Promise<boolean>} True si se verificó correctamente
   */
  async verifyEmail(verificationToken) {
    throw new Error('Method verifyEmail must be implemented');
  }

  /**
   * Reenviar email de verificación
   * @param {string} email - Email del usuario
   * @returns {Promise<boolean>} True si se envió el email
   */
  async resendVerificationEmail(email) {
    throw new Error('Method resendVerificationEmail must be implemented');
  }
}

export default AuthRepository;