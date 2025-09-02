// Servidor Express para servir el frontend sin CSP restrictions
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration para Google Auth
const corsOptions = {
  origin: [
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'https://oauth2.googleapis.com', 
    'https://apis.google.com',
    'https://www.gstatic.com',
    'https://gstatic.com',
    'https://ssl.gstatic.com',
    'https://proyecto-casira-1.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware para DESHABILITAR completamente CSP y permitir Google Auth
app.use((req, res, next) => {
  // Eliminar TODOS los headers CSP restrictivos
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  
  // Headers específicos para Google Auth
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Cross-Origin headers para popups
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Frame options para Google iframes
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
  
  // NO CSP para permitir todos los scripts
  // res.setHeader('Content-Security-Policy', ''); // Comentado = No CSP
  
  console.log('✅ Google Auth headers configured for:', req.url);
  
  next();
});

// Servir archivos estáticos desde dist
app.use(express.static(join(__dirname, 'dist')));

// Manejar rutas SPA - redirigir todo a index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CASIRA Frontend running on port ${port}`);
  console.log(`📱 Google Auth enabled without CSP restrictions`);
  console.log(`🌐 Serving from: ${join(__dirname, 'dist')}`);
});

export default app;