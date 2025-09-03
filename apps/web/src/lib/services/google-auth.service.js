// ============= CASIRA Google Auth Service =============
import apiClient from '../axios-config.js';
import authService from './auth.service.js';

class GoogleAuthService {
  constructor() {
    this.isLoaded = false;
    this.clientId = '245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com';
    this.initPromise = null;
  }

  // ============= GOOGLE API INITIALIZATION =============

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._loadGoogleAPI();
    return this.initPromise;
  }

  async _loadGoogleAPI() {
    try {
      console.log('🔄 GoogleAuthService: Initializing Google API...');

      // Check if already loaded
      if (window.google && this.isLoaded) {
        console.log('✅ GoogleAuthService: Already initialized');
        return true;
      }

      // Load Google API script dynamically
      await this._loadGoogleScript();

      // Initialize Google Sign-In
      await new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (credential) => {
            this._handleCredentialResponse(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          use_fedcm_for_prompt: false
        });

        // Also initialize for popup flow
        if (window.google.accounts.oauth2) {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: 'openid email profile',
            callback: (tokenResponse) => {
              this._handleTokenResponse(tokenResponse);
            },
          });
        }

        resolve();
      });

      this.isLoaded = true;
      console.log('✅ GoogleAuthService: Google API initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ GoogleAuthService: Failed to initialize Google API:', error);
      this.isLoaded = false;
      throw error;
    }
  }

  _loadGoogleScript() {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.getElementById('google-api-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('📦 GoogleAuthService: Google API script loaded');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('❌ GoogleAuthService: Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  }

  // ============= AUTHENTICATION METHODS =============

  async signIn() {
    try {
      console.log('🔐 GoogleAuthService: Starting Google Sign-In...');
      
      await this.initialize();

      return new Promise((resolve, reject) => {
        // Try popup flow first
        if (this.tokenClient) {
          this.tokenClient.callback = async (tokenResponse) => {
            try {
              if (tokenResponse.error) {
                throw new Error(tokenResponse.error);
              }
              
              const userInfo = await this._getUserInfo(tokenResponse.access_token);
              const user = await this._processGoogleUser(userInfo);
              resolve(user);
            } catch (error) {
              reject(error);
            }
          };
          
          this.tokenClient.requestAccessToken({
            prompt: 'consent'
          });
        } else {
          // Fallback to One Tap
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              reject(new Error('Google Sign-In fue cancelado o no se pudo mostrar'));
            }
          });
          
          // Set a timeout for the popup
          setTimeout(() => {
            reject(new Error('Timeout: Google Sign-In tomó demasiado tiempo'));
          }, 30000);
        }
      });

    } catch (error) {
      console.error('❌ GoogleAuthService: Sign-In error:', error);
      throw new Error('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
    }
  }

  async _handleCredentialResponse(credential) {
    try {
      console.log('🔐 GoogleAuthService: Processing credential response...');
      
      // Decode JWT token
      const userInfo = this._parseJWT(credential.credential);
      const user = await this._processGoogleUser(userInfo);
      
      console.log('✅ GoogleAuthService: Credential processed successfully');
      return user;
    } catch (error) {
      console.error('❌ GoogleAuthService: Credential response error:', error);
      throw error;
    }
  }

  async _handleTokenResponse(tokenResponse) {
    try {
      console.log('🔐 GoogleAuthService: Processing token response...');
      
      if (tokenResponse.error) {
        throw new Error(tokenResponse.error);
      }
      
      const userInfo = await this._getUserInfo(tokenResponse.access_token);
      const user = await this._processGoogleUser(userInfo);
      
      console.log('✅ GoogleAuthService: Token processed successfully');
      return user;
    } catch (error) {
      console.error('❌ GoogleAuthService: Token response error:', error);
      throw error;
    }
  }

  async _getUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ GoogleAuthService: Error fetching user info:', error);
      throw error;
    }
  }

  async _processGoogleUser(googleUserInfo) {
    try {
      // Map Google user data to CASIRA format
      const userData = {
        id: googleUserInfo.id,
        email: googleUserInfo.email,
        first_name: googleUserInfo.given_name || googleUserInfo.name?.split(' ')[0] || 'Usuario',
        last_name: googleUserInfo.family_name || googleUserInfo.name?.split(' ')[1] || 'Google',
        name: googleUserInfo.name,
        picture: googleUserInfo.picture,
        verified_email: googleUserInfo.verified_email,
        provider: 'google'
      };

      // Use AuthService to handle the Google authentication
      const user = await authService.authenticateWithGoogle(userData);
      
      console.log('✅ GoogleAuthService: User processed:', user.email);
      return user;
    } catch (error) {
      console.error('❌ GoogleAuthService: Error processing Google user:', error);
      throw error;
    }
  }

  // ============= UTILITY METHODS =============

  _parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ GoogleAuthService: Error parsing JWT:', error);
      throw new Error('Invalid JWT token');
    }
  }

  isInitialized() {
    return this.isLoaded && window.google;
  }

  // ============= RENDER GOOGLE BUTTON =============

  renderSignInButton(elementId, options = {}) {
    if (!this.isInitialized()) {
      console.warn('⚠️ GoogleAuthService: Not initialized, cannot render button');
      return false;
    }

    try {
      const defaultOptions = {
        type: 'standard',
        size: 'large',
        text: 'signin_with',
        theme: 'outline',
        logo_alignment: 'left',
        width: '280',
        locale: 'es'
      };

      const buttonOptions = { ...defaultOptions, ...options };

      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        buttonOptions
      );

      console.log('✅ GoogleAuthService: Sign-in button rendered');
      return true;
    } catch (error) {
      console.error('❌ GoogleAuthService: Error rendering button:', error);
      return false;
    }
  }

  // ============= SIGN OUT =============

  async signOut() {
    try {
      if (this.isInitialized()) {
        window.google.accounts.id.disableAutoSelect();
        console.log('🚪 GoogleAuthService: Google sign-out completed');
      }
      
      // Also call the main auth service logout
      authService.logout();
      return true;
    } catch (error) {
      console.error('❌ GoogleAuthService: Sign-out error:', error);
      return false;
    }
  }

  // ============= STATUS CHECKS =============

  isGoogleUser(user) {
    return user?.provider === 'google';
  }

  hasGoogleCredentials(user) {
    return user?.googleId || user?.id;
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

export default googleAuthService;
export { GoogleAuthService };