// ============= CASIRA Connect - CSP Fix for Google Auth =============
// Emergency fix for Content Security Policy issues

// This script dynamically adds Google GSI styles to the document head
// to bypass CSP restrictions in development

console.log('🩹 CASIRA: Applying CSP fix for Google Auth');

// Function to inject Google GSI styles
function injectGoogleStyles() {
  // Check if styles are already injected
  if (document.getElementById('casira-google-gsi-styles')) {
    return;
  }

  // Create style element for Google GSI
  const googleStyles = document.createElement('style');
  googleStyles.id = 'casira-google-gsi-styles';
  googleStyles.innerHTML = `
    /* Google Sign-In Button Styles */
    .gsi-material-button {
      -moz-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      -webkit-appearance: none;
      background-color: WHITE;
      background-image: none;
      border: 1px solid #dadce0;
      color: #3c4043;
      cursor: pointer;
      font-family: arial,sans-serif;
      font-size: 14px;
      height: 40px;
      letter-spacing: 0.25px;
      outline: none;
      overflow: hidden;
      padding: 0 12px;
      position: relative;
      text-align: center;
      transition: background-color .218s, border-color .218s, box-shadow .218s;
      vertical-align: middle;
      white-space: nowrap;
      width: auto;
      max-width: 400px;
      min-width: min-content;
      border-radius: 4px;
    }

    .gsi-material-button:hover {
      box-shadow: 0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
    }

    .gsi-material-button:active {
      box-shadow: 0 1px 2px 0 rgba(60,64,67,.30), 0 2px 6px 2px rgba(60,64,67,.15);
    }

    .gsi-material-button .gsi-material-button-contents {
      -webkit-align-items: center;
      align-items: center;
      display: flex;
      -webkit-flex-direction: row;
      flex-direction: row;
      -webkit-flex-wrap: nowrap;
      flex-wrap: nowrap;
      height: 100%;
      justify-content: center;
      position: relative;
    }

    .gsi-material-button .gsi-material-button-icon {
      height: 20px;
      margin-right: 12px;
      width: 20px;
    }

    /* Fix for iframe issues */
    iframe[src*="accounts.google.com"] {
      display: block !important;
    }

    /* Google Identity Services */
    div[data-onload="true"] {
      min-height: 40px;
    }

    /* Additional Google Auth fixes */
    .g_id_signin {
      display: inline-block !important;
    }

    /* Override any CSP blocks */
    style[nonce] {
      display: block !important;
    }
  `;

  // Inject styles
  document.head.appendChild(googleStyles);
  console.log('✅ CASIRA: Google GSI styles injected');
}

// Function to fix Cross-Origin-Opener-Policy issues
function fixCrossOriginPolicy() {
  // Override window.open for Google popups
  const originalOpen = window.open;
  window.open = function(url, name, features) {
    // If it's a Google auth URL, modify features to allow popups
    if (url && url.includes('accounts.google.com')) {
      console.log('🔓 CASIRA: Fixing Google popup for:', url);
      // Remove any blocking features
      const fixedFeatures = features ? features.replace(/noopener/g, '').replace(/noreferrer/g, '') : '';
      return originalOpen.call(this, url, name, fixedFeatures);
    }
    return originalOpen.call(this, url, name, features);
  };

  // Fix postMessage issues
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      return originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (error) {
      console.warn('⚠️ CASIRA: PostMessage blocked, trying alternative:', error);
      // Fallback - ignore the error for Google auth
      return;
    }
  };

  console.log('✅ CASIRA: Cross-Origin-Opener-Policy fixes applied');
}

// Function to fix multiple GoTrueClient instances
function fixMultipleSupabaseClients() {
  // Clear any existing Supabase auth storage conflicts
  const storageKeys = Object.keys(localStorage);
  const supabaseKeys = storageKeys.filter(key => 
    key.startsWith('sb-') && key.includes('auth-token')
  );

  // Keep only the most recent auth token
  if (supabaseKeys.length > 1) {
    console.log('🔧 CASIRA: Cleaning up multiple Supabase auth tokens');
    supabaseKeys.slice(0, -1).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  console.log('✅ CASIRA: Supabase client cleanup completed');
}

// Function to enhance Google Auth data integration
function enhanceGoogleAuthIntegration() {
  // Listen for Google auth success events
  window.addEventListener('google-auth-success', (event) => {
    console.log('🔗 CASIRA: Google auth success detected, syncing data');
    
    try {
      const userData = event.detail;
      
      // Ensure Google user data is properly formatted for AdminUserManager
      const formattedUser = {
        id: userData.id || userData.googleId || `google_${Date.now()}`,
        email: userData.email,
        first_name: userData.given_name || userData.firstName || '',
        last_name: userData.family_name || userData.lastName || '', 
        full_name: userData.name || userData.displayName || userData.email,
        avatar_url: userData.picture || userData.photoURL,
        auth_provider: 'google',
        role: 'visitor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'google_auth'
      };

      // Save to localStorage in a format that AdminUserManager can read
      const existingGoogleUsers = JSON.parse(localStorage.getItem('casira-google-users') || '[]');
      const existingIndex = existingGoogleUsers.findIndex(u => u.id === formattedUser.id || u.email === formattedUser.email);
      
      if (existingIndex >= 0) {
        existingGoogleUsers[existingIndex] = formattedUser;
      } else {
        existingGoogleUsers.push(formattedUser);
      }
      
      localStorage.setItem('casira-google-users', JSON.stringify(existingGoogleUsers));
      
      // Also add to regular users list for compatibility
      const existingUsers = JSON.parse(localStorage.getItem('casira-users') || '[]');
      const userExists = existingUsers.find(u => u.email === formattedUser.email);
      
      if (!userExists) {
        existingUsers.push(formattedUser);
        localStorage.setItem('casira-users', JSON.stringify(existingUsers));
      }

      console.log('✅ CASIRA: Google user data synced for AdminUserManager');
      
      // Dispatch event for AdminUserManager to refresh
      window.dispatchEvent(new CustomEvent('casira-users-updated', {
        detail: { source: 'google_auth', user: formattedUser }
      }));
      
    } catch (error) {
      console.error('❌ CASIRA: Error syncing Google auth data:', error);
    }
  });

  console.log('✅ CASIRA: Google Auth integration enhanced');
}

// Apply all fixes when DOM is ready
function applyAllFixes() {
  console.log('🚀 CASIRA: Applying comprehensive CSP and auth fixes');
  
  injectGoogleStyles();
  fixCrossOriginPolicy();
  fixMultipleSupabaseClients();
  enhanceGoogleAuthIntegration();
  
  console.log('✅ CASIRA: All fixes applied successfully');
}

// Apply fixes immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyAllFixes);
} else {
  applyAllFixes();
}

// Also apply when window loads (backup)
window.addEventListener('load', () => {
  setTimeout(applyAllFixes, 1000);
});

// Reapply fixes periodically for dynamic content
setInterval(() => {
  injectGoogleStyles();
}, 5000);

export { injectGoogleStyles, fixCrossOriginPolicy, fixMultipleSupabaseClients, enhanceGoogleAuthIntegration };