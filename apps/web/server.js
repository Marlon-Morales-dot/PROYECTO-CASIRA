// Servidor Express para servir el frontend sin CSP restrictions
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration mejorada para Google Auth y APIs
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc)
    if (!origin) return callback(null, true);
    
    // Lista de dominios permitidos
    const allowedOrigins = [
      // Google Auth domains
      'https://accounts.google.com',
      'https://www.googleapis.com', 
      'https://oauth2.googleapis.com',
      'https://apis.google.com',
      'https://www.gstatic.com',
      'https://gstatic.com',
      'https://ssl.gstatic.com',
      // Production domains
      'https://proyecto-casira-1.onrender.com',
      'https://proyecto-casira.onrender.com',
      // Development domains
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // En desarrollo, permitir todos los localhost
    if (isDevelopment && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Bearer',
    'X-API-Key',
    'X-Client-Info',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count', 
    'Authorization'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight por 24 horas
};

app.use(cors(corsOptions));

// Middleware para DESHABILITAR completamente CSP y permitir Google Auth
// Solo para requests HTML (no para assets estáticos)
app.use((req, res, next) => {
  // Solo aplicar headers especiales para HTML requests, no para assets
  if (req.path.startsWith('/assets/') || req.path.includes('.js') || req.path.includes('.css') || req.path.includes('.png') || req.path.includes('.ico')) {
    return next();
  }
  
  console.log('🔧 Configuring headers for HTML request:', req.path);
  
  // Eliminar TODOS los headers CSP restrictivos
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  
  // Headers específicos para Google Auth
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Cross-Origin headers completamente abiertos para Google Auth
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Frame options para Google iframes
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
  
  next();
});

// Servir archivos estáticos desde dist con configuración robusta
const distPath = join(__dirname, 'dist');
console.log(`📁 Static files path: ${distPath}`);

app.use(express.static(distPath, {
  maxAge: '1d', // Cache assets for 1 day
  index: false, // Don't serve index.html for directories
  dotfiles: 'ignore'
}));

// Manejar rutas SPA - redirigir solo rutas de páginas a index.html
app.get('*', (req, res) => {
  // No manejar assets estáticos con SPA fallback
  if (req.path.startsWith('/assets/') || 
      req.path.includes('.js') || 
      req.path.includes('.css') || 
      req.path.includes('.png') || 
      req.path.includes('.ico') ||
      req.path.includes('.map')) {
    return res.status(404).send('Asset not found');
  }
  
  const indexPath = join(distPath, 'index.html');
  console.log(`🔍 Serving SPA route: ${req.path} -> ${indexPath}`);
  
  // Verificar que index.html existe
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html not found at:', indexPath);
    console.error('📁 Available files in dist:', require('fs').readdirSync(distPath).slice(0, 10));
    res.status(404).send('Application not found. Build may have failed.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CASIRA Frontend running on port ${port}`);
  console.log(`📱 Google Auth enabled without CSP restrictions`);
  console.log(`🌐 Serving from: ${join(__dirname, 'dist')}`);
});

export default app;