// Keep-Alive Service para mantener Render activo
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';

class KeepAliveService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.pingInterval = 10 * 60 * 1000; // 10 minutos
  }

  start() {
    if (this.isRunning) {
      console.log('⏰ Keep-alive service already running');
      return;
    }

    console.log('🚀 Starting keep-alive service for Render backend');
    this.isRunning = true;
    
    // Ping inmediato
    this.pingServer();
    
    // Configurar ping cada 10 minutos
    this.interval = setInterval(() => {
      this.pingServer();
    }, this.pingInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Keep-alive service stopped');
  }

  async pingServer() {
    try {
      console.log('📡 Pinging Render server...');
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Render server is alive:', data.message);
      } else {
        console.warn('⚠️ Server responded but not healthy:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to ping server:', error.message);
      // No hacemos nada más, solo loggeamos el error
    }
  }
}

// Crear instancia global
export const keepAlive = new KeepAliveService();

// Auto-start cuando se importe el módulo
if (typeof window !== 'undefined') {
  keepAlive.start();
}

export default keepAlive;