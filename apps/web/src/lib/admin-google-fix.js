// ============= CASIRA Connect - Admin Google Integration Fix =============
// Emergency fix to ensure Google users appear in AdminUserManager

console.log('🔧 CASIRA: Loading Admin Google Integration Fix');

// Function to ensure Google users are visible in admin
function ensureGoogleUsersVisibility() {
  // Check if we have Google users in localStorage
  const googleUsers = JSON.parse(localStorage.getItem('casira-google-users') || '[]');
  const casiraUsers = JSON.parse(localStorage.getItem('casira-users') || '[]');
  
  console.log('📊 CASIRA: Google users in storage:', googleUsers.length);
  console.log('📊 CASIRA: CASIRA users in storage:', casiraUsers.length);
  
  if (googleUsers.length > 0) {
    // Ensure each Google user is also in the main users list
    let updated = false;
    
    googleUsers.forEach(googleUser => {
      const existsInMain = casiraUsers.find(u => 
        u.id === googleUser.id || 
        u.email === googleUser.email
      );
      
      if (!existsInMain) {
        console.log('🔄 CASIRA: Adding Google user to main users list:', googleUser.email);
        casiraUsers.push({
          ...googleUser,
          auth_provider: 'google',
          source: 'google_integration'
        });
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem('casira-users', JSON.stringify(casiraUsers));
      console.log('✅ CASIRA: Updated main users list with Google users');
      
      // Dispatch event to notify AdminUserManager
      window.dispatchEvent(new CustomEvent('casira-users-updated', {
        detail: { source: 'admin_google_fix', count: googleUsers.length }
      }));
    }
  }
}

// Function to fix Google user data format for AdminUserManager
function fixGoogleUserDataFormat() {
  const googleUsers = JSON.parse(localStorage.getItem('casira-google-users') || '[]');
  
  if (googleUsers.length === 0) return;
  
  let updated = false;
  
  const fixedUsers = googleUsers.map(user => {
    const fixed = { ...user };
    
    // Ensure all required fields are present
    if (!fixed.id && fixed.googleId) {
      fixed.id = fixed.googleId;
      updated = true;
    }
    
    if (!fixed.full_name) {
      fixed.full_name = fixed.name || fixed.displayName || `${fixed.given_name || ''} ${fixed.family_name || ''}`.trim() || fixed.email;
      updated = true;
    }
    
    if (!fixed.first_name && fixed.given_name) {
      fixed.first_name = fixed.given_name;
      updated = true;
    }
    
    if (!fixed.last_name && fixed.family_name) {
      fixed.last_name = fixed.family_name;
      updated = true;
    }
    
    if (!fixed.avatar_url && fixed.picture) {
      fixed.avatar_url = fixed.picture;
      updated = true;
    }
    
    if (!fixed.auth_provider) {
      fixed.auth_provider = 'google';
      updated = true;
    }
    
    if (!fixed.role) {
      fixed.role = 'visitor';
      updated = true;
    }
    
    if (!fixed.created_at) {
      fixed.created_at = new Date().toISOString();
      updated = true;
    }
    
    return fixed;
  });
  
  if (updated) {
    localStorage.setItem('casira-google-users', JSON.stringify(fixedUsers));
    console.log('✅ CASIRA: Fixed Google user data format');
  }
}

// Function to monitor and sync Google auth events
function monitorGoogleAuth() {
  // Listen for Google auth events
  window.addEventListener('google-auth-success', (event) => {
    console.log('🔗 CASIRA: Google auth success detected in admin fix');
    setTimeout(() => {
      fixGoogleUserDataFormat();
      ensureGoogleUsersVisibility();
    }, 1000);
  });
  
  // Listen for auth state changes
  window.addEventListener('auth-state-change', (event) => {
    console.log('🔄 CASIRA: Auth state change detected in admin fix');
    setTimeout(() => {
      fixGoogleUserDataFormat();
      ensureGoogleUsersVisibility();
    }, 500);
  });
}

// Enhanced function to force refresh AdminUserManager
function forceRefreshAdminUserManager() {
  // Dispatch multiple events to ensure AdminUserManager refreshes
  const events = [
    'casira-users-updated',
    'datastore-updated',
    'users-refreshed'
  ];
  
  events.forEach(eventName => {
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { 
        source: 'admin_google_fix',
        timestamp: Date.now(),
        action: 'force_refresh'
      }
    }));
  });
  
  console.log('🔄 CASIRA: Forced refresh events dispatched to AdminUserManager');
}

// Apply fixes immediately and set up monitoring
function applyAdminGoogleFixes() {
  console.log('🚀 CASIRA: Applying Admin Google Integration Fixes');
  
  fixGoogleUserDataFormat();
  ensureGoogleUsersVisibility();
  monitorGoogleAuth();
  
  // Force refresh after initial fixes
  setTimeout(forceRefreshAdminUserManager, 2000);
  
  console.log('✅ CASIRA: Admin Google Integration Fixes applied');
}

// Apply fixes when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyAdminGoogleFixes);
} else {
  applyAdminGoogleFixes();
}

// Also apply when window loads (backup)
window.addEventListener('load', () => {
  setTimeout(applyAdminGoogleFixes, 1000);
});

// Periodically check and fix Google user visibility
setInterval(() => {
  ensureGoogleUsersVisibility();
}, 10000); // Every 10 seconds

export { 
  ensureGoogleUsersVisibility, 
  fixGoogleUserDataFormat, 
  forceRefreshAdminUserManager 
};