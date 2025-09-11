// ============= GOOGLE AUTH SIMPLE - SOLUCIÓN TEMPORAL =============
// Versión simplificada para resolver problemas inmediatos

class SimpleGoogleAuth {
  constructor() {
    this.clientId = '245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com';
    this.isReady = false;
    console.log('🚀 SimpleGoogleAuth: Inicializando...');
    this.init();
  }

  async init() {
    try {
      // Esperar un poco para evitar conflictos con otros servicios
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Cargar Google API de forma sencilla
      if (!window.gapi) {
        console.log('📦 SimpleAuth: Cargando Google API...');
        await this.loadGoogleAPI();
      }

      // Esperar a que gapi esté listo
      console.log('📦 SimpleAuth: Cargando auth2...');
      await new Promise(resolve => {
        window.gapi.load('auth2', resolve);
      });

      // Verificar si auth2 ya está inicializado
      if (window.gapi.auth2.getAuthInstance()) {
        console.log('✅ SimpleAuth: Usando instancia existente de auth2');
        this.authInstance = window.gapi.auth2.getAuthInstance();
        this.isReady = true;
        console.log('✅ SimpleGoogleAuth: Listo para usar (instancia existente)');
        return;
      }

      // Inicializar auth2
      console.log('🔧 SimpleAuth: Inicializando nueva instancia auth2...');
      this.authInstance = await window.gapi.auth2.init({
        client_id: this.clientId,
        scope: 'profile email',
        cookie_policy: 'single_host_origin'
      });

      this.isReady = true;
      console.log('✅ SimpleGoogleAuth: Listo para usar (nueva instancia)');

    } catch (error) {
      console.error('❌ SimpleGoogleAuth falló:', error);
      console.error('Error details:', error.error, error.details);
      this.isReady = false;
    }
  }

  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn() {
    try {
      if (!this.isReady) {
        throw new Error('Google Auth no está listo');
      }

      console.log('🔐 Iniciando login con popup...');
      
      // Usar signIn directo sin One Tap
      const googleUser = await this.authInstance.signIn({
        prompt: 'select_account'
      });

      const profile = googleUser.getBasicProfile();
      const idToken = googleUser.getAuthResponse().id_token;

      const userData = {
        id: profile.getId(),
        email: profile.getEmail(),
        first_name: profile.getGivenName(),
        last_name: profile.getFamilyName(),
        full_name: profile.getName(),
        avatar_url: profile.getImageUrl(),
        google_id: profile.getId(),
        idToken: idToken
      };

      console.log('✅ Login Google exitoso:', userData.email);
      return userData;

    } catch (error) {
      console.error('❌ Error en Google login:', error);
      throw new Error(`Google login falló: ${error.error || error.message}`);
    }
  }

  async signOut() {
    if (this.authInstance && this.isReady) {
      await this.authInstance.signOut();
      console.log('👋 Google logout exitoso');
    }
  }

  isSignedIn() {
    return this.isReady && this.authInstance && this.authInstance.isSignedIn.get();
  }
}

// Exportar instancia singleton
const simpleGoogleAuth = new SimpleGoogleAuth();
export { simpleGoogleAuth };

console.log('✅ SimpleGoogleAuth service loaded');