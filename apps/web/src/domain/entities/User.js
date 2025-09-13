/**
 * User Entity - Dominio puro
 * Representa un usuario en el sistema CASIRA Connect
 * Sin dependencias externas, solo lógica de negocio
 */

export class User {
  constructor({
    id,
    email,
    firstName,
    lastName,
    role = 'visitor',
    bio = '',
    avatarUrl = null,
    phone = null,
    location = null,
    birthDate = null,
    socialLinks = {},
    preferences = {},
    lastLogin = null,
    isActive = true,
    emailVerified = false,
    googleId = null,
    authProvider = 'casira',
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.bio = bio;
    this.avatarUrl = avatarUrl;
    this.phone = phone;
    this.location = location;
    this.birthDate = birthDate;
    this.socialLinks = socialLinks;
    this.preferences = preferences;
    this.lastLogin = lastLogin;
    this.isActive = isActive;
    this.emailVerified = emailVerified;
    this.googleId = googleId;
    this.authProvider = authProvider;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validateUser();
  }

  // Validaciones de negocio
  validateUser() {
    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Email es requerido y debe ser válido');
    }

    if (!this.firstName || this.firstName.trim().length < 2) {
      throw new Error('Nombre debe tener al menos 2 caracteres');
    }

    if (!this.lastName || this.lastName.trim().length < 2) {
      throw new Error('Apellido debe tener al menos 2 caracteres');
    }

    // Temporarily allow all roles to see what's in the database
    const validRoles = ['admin', 'volunteer', 'visitor', 'donor', 'Administrator', 'Volunteer', 'Social'];
    if (!validRoles.includes(this.role)) {
      console.warn(`Unknown role detected: ${this.role}. Valid roles:`, validRoles);
      // Don't throw error, just log warning for now
      // throw new Error('Rol debe ser admin, volunteer o visitor');
    }

    if (!['casira', 'google', 'unified'].includes(this.authProvider)) {
      throw new Error('Proveedor de auth debe ser casira, google o unified');
    }
  }

  // Métodos de negocio
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName() {
    return this.fullName;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  isVolunteer() {
    return this.role === 'volunteer';
  }

  isVisitor() {
    return this.role === 'visitor';
  }

  canCreateActivities() {
    return this.isAdmin();
  }

  canEditActivities() {
    return this.isAdmin();
  }

  canDeleteActivities() {
    return this.isAdmin();
  }

  canManageUsers() {
    return this.isAdmin();
  }

  canJoinActivities() {
    return this.isVolunteer() || this.isVisitor();
  }

  canCommentOnPosts() {
    return true; // Todos pueden comentar
  }

  canLikePosts() {
    return true; // Todos pueden dar like
  }

  updateLastLogin() {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
    return this;
  }

  updateProfile({ firstName, lastName, bio, phone, location, socialLinks, preferences }) {
    if (firstName !== undefined) this.firstName = firstName;
    if (lastName !== undefined) this.lastName = lastName;
    if (bio !== undefined) this.bio = bio;
    if (phone !== undefined) this.phone = phone;
    if (location !== undefined) this.location = location;
    if (socialLinks !== undefined) this.socialLinks = { ...this.socialLinks, ...socialLinks };
    if (preferences !== undefined) this.preferences = { ...this.preferences, ...preferences };
    
    this.updatedAt = new Date();
    this.validateUser();
    return this;
  }

  changeRole(newRole) {
    if (!['admin', 'volunteer', 'visitor'].includes(newRole)) {
      throw new Error('Rol inválido');
    }
    this.role = newRole;
    this.updatedAt = new Date();
    return this;
  }

  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
    return this;
  }

  verifyEmail() {
    this.emailVerified = true;
    this.updatedAt = new Date();
    return this;
  }

  // Utilidades privadas
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Serialización para persistencia
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      role: this.role,
      bio: this.bio,
      avatar_url: this.avatarUrl,
      phone: this.phone,
      location: this.location,
      birth_date: this.birthDate,
      social_links: this.socialLinks,
      preferences: this.preferences,
      last_login: this.lastLogin,
      is_active: this.isActive,
      email_verified: this.emailVerified,
      google_id: this.googleId,
      auth_provider: this.authProvider,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Factory method para crear desde datos de DB
  static fromDatabase(data) {
    return new User({
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      location: data.location,
      birthDate: data.birth_date,
      socialLinks: data.social_links || {},
      preferences: data.preferences || {},
      lastLogin: data.last_login,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      googleId: data.google_id,
      authProvider: data.auth_provider,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }
}

export default User;