/**
 * Post Entity - Dominio puro
 * Representa una publicación en el feed social de CASIRA Connect
 * Sin dependencias externas, solo lógica de negocio
 */

export class Post {
  constructor({
    id,
    authorId,
    activityId = null,
    title = null,
    content,
    postType = 'update',
    images = [],
    videos = [],
    attachments = [],
    location = null,
    visibility = 'public',
    likesCount = 0,
    commentsCount = 0,
    sharesCount = 0,
    viewsCount = 0,
    featured = false,
    pinned = false,
    tags = [],
    mentions = [],
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.authorId = authorId;
    this.activityId = activityId;
    this.title = title;
    this.content = content;
    this.postType = postType;
    this.images = images;
    this.videos = videos;
    this.attachments = attachments;
    this.location = location;
    this.visibility = visibility;
    this.likesCount = likesCount;
    this.commentsCount = commentsCount;
    this.sharesCount = sharesCount;
    this.viewsCount = viewsCount;
    this.featured = featured;
    this.pinned = pinned;
    this.tags = tags;
    this.mentions = mentions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validatePost();
  }

  // Validaciones de negocio
  validatePost() {
    if (!this.content || this.content.trim().length < 1) {
      throw new Error('El contenido del post es requerido');
    }

    if (this.content.length > 2000) {
      throw new Error('El contenido no puede exceder 2000 caracteres');
    }

    if (!this.authorId) {
      throw new Error('ID del autor es requerido');
    }

    if (!['update', 'announcement', 'request', 'achievement', 'story'].includes(this.postType)) {
      throw new Error('Tipo de post debe ser update, announcement, request, achievement o story');
    }

    if (!['public', 'members', 'private'].includes(this.visibility)) {
      throw new Error('Visibilidad debe ser public, members o private');
    }

    if (this.title && this.title.length > 255) {
      throw new Error('El título no puede exceder 255 caracteres');
    }

    if (this.likesCount < 0 || this.commentsCount < 0 || this.sharesCount < 0 || this.viewsCount < 0) {
      throw new Error('Los contadores no pueden ser negativos');
    }
  }

  // Métodos de negocio
  isPublic() {
    return this.visibility === 'public';
  }

  isPrivate() {
    return this.visibility === 'private';
  }

  isMembersOnly() {
    return this.visibility === 'members';
  }

  isUpdate() {
    return this.postType === 'update';
  }

  isAnnouncement() {
    return this.postType === 'announcement';
  }

  isRequest() {
    return this.postType === 'request';
  }

  isAchievement() {
    return this.postType === 'achievement';
  }

  isStory() {
    return this.postType === 'story';
  }

  isFeatured() {
    return this.featured;
  }

  isPinned() {
    return this.pinned;
  }

  hasImages() {
    return this.images.length > 0;
  }

  hasVideos() {
    return this.videos.length > 0;
  }

  hasAttachments() {
    return this.attachments.length > 0;
  }

  hasMedia() {
    return this.hasImages() || this.hasVideos() || this.hasAttachments();
  }

  isRelatedToActivity() {
    return this.activityId !== null;
  }

  hasMentions() {
    return this.mentions.length > 0;
  }

  hasTags() {
    return this.tags.length > 0;
  }

  getEngagementScore() {
    // Fórmula simple para calcular engagement
    return (this.likesCount * 1) + (this.commentsCount * 2) + (this.sharesCount * 3);
  }

  canBeEditedBy(userId) {
    return this.authorId === userId;
  }

  canBeDeletedBy(userId, userRole) {
    return this.authorId === userId || userRole === 'admin';
  }

  canBeViewedBy(userId, userRole) {
    if (this.isPublic()) return true;
    if (this.isPrivate()) return this.authorId === userId || userRole === 'admin';
    if (this.isMembersOnly()) return userRole !== 'visitor';
    return false;
  }

  // Operaciones de contenido
  updateContent(newContent) {
    if (!newContent || newContent.trim().length < 1) {
      throw new Error('El contenido no puede estar vacío');
    }
    if (newContent.length > 2000) {
      throw new Error('El contenido no puede exceder 2000 caracteres');
    }
    
    this.content = newContent;
    this.updatedAt = new Date();
    return this;
  }

  updateTitle(newTitle) {
    if (newTitle && newTitle.length > 255) {
      throw new Error('El título no puede exceder 255 caracteres');
    }
    
    this.title = newTitle;
    this.updatedAt = new Date();
    return this;
  }

  changeVisibility(newVisibility) {
    if (!['public', 'members', 'private'].includes(newVisibility)) {
      throw new Error('Visibilidad inválida');
    }
    
    this.visibility = newVisibility;
    this.updatedAt = new Date();
    return this;
  }

  changeType(newType) {
    if (!['update', 'announcement', 'request', 'achievement', 'story'].includes(newType)) {
      throw new Error('Tipo de post inválido');
    }
    
    this.postType = newType;
    this.updatedAt = new Date();
    return this;
  }

  // Operaciones de interacción
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

  incrementComments() {
    this.commentsCount += 1;
    return this;
  }

  decrementComments() {
    if (this.commentsCount > 0) {
      this.commentsCount -= 1;
    }
    return this;
  }

  incrementShares() {
    this.sharesCount += 1;
    return this;
  }

  // Operaciones de contenido multimedia
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

  addVideo(videoUrl) {
    if (!this.videos.includes(videoUrl)) {
      this.videos.push(videoUrl);
      this.updatedAt = new Date();
    }
    return this;
  }

  removeVideo(videoUrl) {
    this.videos = this.videos.filter(vid => vid !== videoUrl);
    this.updatedAt = new Date();
    return this;
  }

  addAttachment(attachment) {
    this.attachments.push(attachment);
    this.updatedAt = new Date();
    return this;
  }

  removeAttachment(attachmentId) {
    this.attachments = this.attachments.filter(att => att.id !== attachmentId);
    this.updatedAt = new Date();
    return this;
  }

  // Operaciones de tags y menciones
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

  addMention(userId) {
    if (!this.mentions.includes(userId)) {
      this.mentions.push(userId);
      this.updatedAt = new Date();
    }
    return this;
  }

  removeMention(userId) {
    this.mentions = this.mentions.filter(id => id !== userId);
    this.updatedAt = new Date();
    return this;
  }

  // Operaciones de estado
  feature() {
    this.featured = true;
    this.updatedAt = new Date();
    return this;
  }

  unfeature() {
    this.featured = false;
    this.updatedAt = new Date();
    return this;
  }

  pin() {
    this.pinned = true;
    this.updatedAt = new Date();
    return this;
  }

  unpin() {
    this.pinned = false;
    this.updatedAt = new Date();
    return this;
  }

  // Utilidades
  getExcerpt(maxLength = 150) {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  getReadingTime() {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Serialización para persistencia
  toJSON() {
    return {
      id: this.id,
      author_id: this.authorId,
      activity_id: this.activityId,
      title: this.title,
      content: this.content,
      post_type: this.postType,
      images: this.images,
      videos: this.videos,
      attachments: this.attachments,
      location: this.location,
      visibility: this.visibility,
      likes_count: this.likesCount,
      comments_count: this.commentsCount,
      shares_count: this.sharesCount,
      views_count: this.viewsCount,
      featured: this.featured,
      pinned: this.pinned,
      tags: this.tags,
      mentions: this.mentions,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Factory method para crear desde datos de DB
  static fromDatabase(data) {
    return new Post({
      id: data.id,
      authorId: data.author_id,
      activityId: data.activity_id,
      title: data.title,
      content: data.content,
      postType: data.post_type || 'update',
      images: data.images || [],
      videos: data.videos || [],
      attachments: data.attachments || [],
      location: data.location,
      visibility: data.visibility || 'public',
      likesCount: data.likes_count || 0,
      commentsCount: data.comments_count || 0,
      sharesCount: data.shares_count || 0,
      viewsCount: data.views_count || 0,
      featured: data.featured || false,
      pinned: data.pinned || false,
      tags: data.tags || [],
      mentions: data.mentions || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }
}

export default Post;