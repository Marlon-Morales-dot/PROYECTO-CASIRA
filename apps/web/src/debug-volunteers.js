// Debug script to check volunteer requests in localStorage
import storageManager from './lib/storage-manager.js';
import { getPendingVolunteerRequests } from './lib/volunteer-request-handler.js';

console.log('🔍 DEBUGGING VOLUNTEER REQUESTS');

// Check localStorage data
const localData = storageManager.exportData();
console.log('📦 LocalStorage data:', {
  volunteers: localData.volunteers?.length || 0,
  users: localData.users?.length || 0,
  activities: localData.activities?.length || 0
});

// Check pending volunteer requests
try {
  const pendingRequests = await getPendingVolunteerRequests();
  console.log('📋 Pending volunteer requests:', pendingRequests);
  
  pendingRequests.forEach((request, index) => {
    console.log(`🔸 Request ${index + 1}:`, {
      id: request.id,
      user_id: request.user_id,
      user_email: request.user_email,
      user_name: request.user_name,
      activity_id: request.activity_id,
      activity_title: request.activity_title,
      status: request.status,
      source: request.source,
      created_at: request.created_at
    });
  });
} catch (error) {
  console.error('❌ Error getting pending requests:', error);
}

// Check raw localStorage entries
console.log('🗂️ Raw localStorage entries:');
const keys = Object.keys(localStorage).filter(key => key.includes('casira'));
keys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`${key}:`, data);
  } catch (e) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
});