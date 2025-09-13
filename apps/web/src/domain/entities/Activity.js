/**
 * Activity Entity - Dominio puro
 * Representa una actividad/evento en el sistema CASIRA Connect
 * Sin dependencias externas, solo lógica de negocio
 */

export class Activity {
  constructor({
    id,
    title,
    description,
    categoryId,
    creatorId,
    location = null,
    address = null,
    coordinates = null,
    startDate = null,
    endDate = null,
    maxVolunteers = null,
    currentVolunteers = 0,
    status = 'active',
    requirements = null,
    benefits = null,
    images = [],
    tags = [],
    priority = 'normal',
    budget = null,
    contactInfo = {},
    isFeatured = false,
    viewsCount = 0,
    likesCount = 0,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.categoryId = categoryId;
    this.creatorId = creatorId;
    this.location = location;
    this.address = address;
    this.coordinates = coordinates;
    this.startDate = startDate;
    this.endDate = endDate;
    this.maxVolunteers = maxVolunteers;
    this.currentVolunteers = currentVolunteers;
    this.status = status;
    this.requirements = requirements;
    this.benefits = benefits;
    this.images = images;
    this.tags = tags;
    this.priority = priority;
    this.budget = budget;
    this.contactInfo = contactInfo;
    this.isFeatured = isFeatured;
    this.viewsCount = viewsCount;
    this.likesCount = likesCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validateActivity();
  }

  // Validaciones de negocio
  validateActivity() {
    // Validaciones más permisivas para datos que vienen de la base de datos
    if (!this.title || this.title.trim().length < 1) {
      throw new Error('Título es requerido');
    }

    if (!this.description || this.description.trim().length < 1) {
      throw new Error('Descripción es requerida');
    }

    // Hacer creatorId opcional para compatibilidad con datos existentes
    // if (!this.creatorId) {
    //   throw new Error('ID del creador es requerido');
    // }

    if (!['draft', 'active', 'completed', 'cancelled'].includes(this.status)) {
      throw new Error('Estado debe ser draft, active, completed o cancelled');
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(this.priority)) {
      throw new Error('Prioridad debe ser low, normal, high o urgent');
    }

    if (this.maxVolunteers !== null && this.maxVolunteers < 1) {
      throw new Error('Máximo de voluntarios debe ser mayor a 0');
    }

    if (this.currentVolunteers < 0) {
      throw new Error('Número actual de voluntarios no puede ser negativo');
    }

    if (this.maxVolunteers !== null && this.currentVolunteers > this.maxVolunteers) {
      throw new Error('Voluntarios actuales no pueden exceder el máximo');
    }

    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      throw new Error('Fecha de inicio debe ser anterior a fecha de fin');
    }

    if (this.budget !== null && this.budget < 0) {
      throw new Error('Presupuesto no puede ser negativo');
    }
  }

  // Métodos de negocio
  isDraft() {
    return this.status === 'draft';
  }

  isActive() {
    return this.status === 'active';
  }

  isCompleted() {
    return this.status === 'completed';
  }

  isCancelled() {
    return this.status === 'cancelled';
  }

  isInProgress() {
    if (!this.isActive()) return false;
    const now = new Date();
    return this.startDate <= now && (!this.endDate || this.endDate >= now);
  }

  isUpcoming() {
    if (!this.isActive()) return false;
    const now = new Date();
    return this.startDate && this.startDate > now;
  }

  isPast() {
    if (!this.endDate) return false;
    const now = new Date();
    return this.endDate < now;
  }

  hasVolunteerSpots() {
    if (this.maxVolunteers === null) return true;
    return this.currentVolunteers < this.maxVolunteers;
  }

  getAvailableSpots() {
    if (this.maxVolunteers === null) return null;
    return this.maxVolunteers - this.currentVolunteers;
  }

  getOccupancyPercentage() {
    if (this.maxVolunteers === null) return 0;
    return Math.round((this.currentVolunteers / this.maxVolunteers) * 100);
  }

  canAcceptVolunteers() {
    return this.isActive() && this.hasVolunteerSpots();
  }

  publish() {
    if (this.status !== 'draft') {
      throw new Error('Solo actividades en borrador pueden ser publicadas');
    }
    this.status = 'active';
    this.updatedAt = new Date();
    this.validateActivity();
    return this;
  }

  cancel(reason = null) {
    if (this.isCompleted()) {
      throw new Error('No se puede cancelar una actividad completada');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
    if (reason) {
      this.contactInfo = { ...this.contactInfo, cancellationReason: reason };
    }
    return this;
  }

  complete() {
    if (!this.isActive()) {
      throw new Error('Solo actividades activas pueden ser completadas');
    }
    this.status = 'completed';
    this.updatedAt = new Date();
    return this;
  }

  addVolunteer() {
    if (!this.canAcceptVolunteers()) {
      throw new Error('No se pueden agregar más voluntarios');
    }
    this.currentVolunteers += 1;
    this.updatedAt = new Date();
    return this;
  }

  removeVolunteer() {
    if (this.currentVolunteers <= 0) {
      throw new Error('No hay voluntarios para remover');
    }
    this.currentVolunteers -= 1;
    this.updatedAt = new Date();
    return this;
  }

  incrementViews() {
    this.viewsCount += 1;
    return this;
  }

  incrementLikes() {
    this.likesCount += 1;
    return this;
  }

  decrementLikes() {
    if (this.likesCount > 0) {
      this.likesCount -= 1;
    }
    return this;
  }

  feature() {
    this.isFeatured = true;
    this.updatedAt = new Date();
    return this;
  }

  unfeature() {
    this.isFeatured = false;
    this.updatedAt = new Date();
    return this;
  }

  updateDetails({
    title,
    description,
    location,
    address,
    startDate,
    endDate,
    maxVolunteers,
    requirements,
    benefits,
    tags,
    priority,
    budget,
    contactInfo
  }) {
    if (title !== undefined) this.title = title;
    if (description !== undefined) this.description = description;
    if (location !== undefined) this.location = location;
    if (address !== undefined) this.address = address;
    if (startDate !== undefined) this.startDate = startDate;
    if (endDate !== undefined) this.endDate = endDate;
    if (maxVolunteers !== undefined) this.maxVolunteers = maxVolunteers;
    if (requirements !== undefined) this.requirements = requirements;
    if (benefits !== undefined) this.benefits = benefits;
    if (tags !== undefined) this.tags = tags;
    if (priority !== undefined) this.priority = priority;
    if (budget !== undefined) this.budget = budget;
    if (contactInfo !== undefined) this.contactInfo = { ...this.contactInfo, ...contactInfo };

    this.updatedAt = new Date();
    this.validateActivity();
    return this;
  }

  addImage(imageUrl) {
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
      this.updatedAt = new Date();
    }
    return this;
  }

  removeImage(imageUrl) {
    this.images = this.images.filter(img => img !== imageUrl);
    this.updatedAt = new Date();
    return this;
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
    return this;
  }

  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
    return this;
  }

  // Serialización para persistencia
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      category_id: this.categoryId,
      creator_id: this.creatorId,
      location: this.location,
      address: this.address,
      coordinates: this.coordinates,
      start_date: this.startDate,
      end_date: this.endDate,
      max_volunteers: this.maxVolunteers,
      current_volunteers: this.currentVolunteers,
      status: this.status,
      requirements: this.requirements,
      benefits: this.benefits,
      images: this.images,
      tags: this.tags,
      priority: this.priority,
      budget: this.budget,
      contact_info: this.contactInfo,
      is_featured: this.isFeatured,
      views_count: this.viewsCount,
      likes_count: this.likesCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Factory method para crear desde datos de DB
  static fromDatabase(data) {
    return new Activity({
      id: data.id,
      title: data.title,
      description: data.description,
      categoryId: data.category_id,
      creatorId: data.creator_id,
      location: data.location,
      address: data.address,
      coordinates: data.coordinates,
      startDate: data.start_date ? new Date(data.start_date) : null,
      endDate: data.end_date ? new Date(data.end_date) : null,
      maxVolunteers: data.max_volunteers,
      currentVolunteers: data.current_volunteers || 0,
      status: data.status,
      requirements: data.requirements,
      benefits: data.benefits,
      images: data.images || [],
      tags: data.tags || [],
      priority: data.priority,
      budget: data.budget,
      contactInfo: data.contact_info || {},
      isFeatured: data.is_featured || false,
      viewsCount: data.views_count || 0,
      likesCount: data.likes_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }
}

export default Activity;