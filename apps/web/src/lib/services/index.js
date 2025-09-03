// ============= CASIRA API Services - Centralized Layer =============

// Service classes and instances
export { default as authService, AuthService } from './auth.service.js';
export { default as usersService, UsersService } from './users.service.js';  
export { default as activitiesService, ActivitiesService } from './activities.service.js';
export { default as notificationsService, NotificationsService } from './notifications.service.js';
export { default as googleAuthService, GoogleAuthService } from './google-auth.service.js';

// Re-export axios instances for direct use if needed
export { backendAPI, googleAPI, externalAPI } from '../axios-config.js';

// Convenience object for all services
export const services = {
  auth: authService,
  users: usersService,
  activities: activitiesService,
  notifications: notificationsService,
  googleAuth: googleAuthService
};