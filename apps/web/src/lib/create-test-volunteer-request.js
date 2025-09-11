// Create test volunteer request to verify admin panel display
import storageManager from './storage-manager.js';

console.log('🧪 Creating test volunteer request...');

// Create a test volunteer request
const testVolunteerRequest = {
  id: `local_${Date.now()}_test`,
  user_id: 'test@gmail.com',
  activity_id: 1, // Default activity from storage
  message: 'Test volunteer request from Google user',
  status: 'pending',
  created_at: new Date().toISOString(),
  user_email: 'test@gmail.com',
  user_name: 'Test User Google',
  activity_title: 'Reforestación Comunitaria',
  source: 'localStorage'
};

try {
  // Get current data
  const localData = storageManager.exportData();
  
  // Add test request to volunteers array
  localData.volunteers = localData.volunteers || [];
  localData.volunteers.push(testVolunteerRequest);
  
  // Save back to storage
  storageManager.set('volunteers', localData.volunteers);
  
  console.log('✅ Test volunteer request created:', testVolunteerRequest);
  console.log('📊 Total volunteers now:', localData.volunteers.length);
  
  // Also create a notification for the admin
  localData.notifications = localData.notifications || [];
  const testNotification = {
    id: Date.now(),
    type: 'volunteer_request',
    user_id: 'test@gmail.com',
    activity_id: 1,
    message: `Test User Google solicita unirse a Reforestación Comunitaria`,
    status: 'pending',
    created_at: new Date().toISOString(),
    user_email: 'test@gmail.com',
    user_avatar: null
  };
  
  localData.notifications.push(testNotification);
  storageManager.set('notifications', localData.notifications);
  
  console.log('✅ Test notification created for admin panel');
  
} catch (error) {
  console.error('❌ Error creating test volunteer request:', error);
}