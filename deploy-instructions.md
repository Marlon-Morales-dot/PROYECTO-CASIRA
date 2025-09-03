# 🚀 Instrucciones de Deploy - CASIRA Connect

## 📋 Resumen de la Arquitectura

```
┌─────────────────────┐      ┌─────────────────────┐
│   Vercel Frontend   │ ──── │  Render API (Flask) │
│  React + Vite       │ HTTP │  Python Backend     │  
│  tu-app.vercel.app  │ JWT  │ proyecto-casira.on.. │
└─────────────────────┘      └─────────────────────┘
           │
           │ Auth + Database
           ▼
┌─────────────────────┐
│   Supabase DB       │
│   Auth + Storage    │
└─────────────────────┘
```

## 🔧 Paso 1: Deploy en Vercel (Frontend)

### A. Configurar Vercel CLI
```bash
npm i -g vercel
vercel login
```

### B. Deploy desde la raíz del proyecto
```bash
cd C:\Users\MARLON\Desktop\UsersMARLONDesktopPROYECTO-CASIRA
vercel
```

### C. Configurar variables de entorno en Vercel
Ir al dashboard de Vercel → Settings → Environment Variables:

```
VITE_API_BASE_URL = https://proyecto-casira.onrender.com
VITE_SUPABASE_URL = https://wlliqmcpiiktcdzwzhdn.supabase.co  
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo
VITE_GOOGLE_CLIENT_ID = [TU_GOOGLE_CLIENT_ID]
VITE_ENV = production
```

## 🐍 Paso 2: Deploy en Render (API)

### A. Crear nuevo servicio en Render
1. Ir a render.com → New Web Service
2. Conectar tu repositorio GitHub
3. **Configuración:**
   - **Name:** casira-connect-api
   - **Root Directory:** apps/api
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`

### B. Variables de entorno en Render
```
PYTHON_VERSION = 3.9.19
FLASK_ENV = production
FLASK_DEBUG = false
```

## ✅ Paso 3: Verificación

### Frontend (Vercel)
- ✅ Rutas SPA funcionan (no más 404)
- ✅ Variables de entorno cargadas
- ✅ Build exitoso con Vite

### Backend (Render)  
- ✅ API responde en /api/health
- ✅ CORS configurado para Vercel
- ✅ Gunicorn corriendo

### Conexión
- ✅ Frontend puede hacer fetch a API
- ✅ JWT authentication funciona
- ✅ Supabase conectado

## 🔍 Comandos de Debug

```bash
# Test local
cd apps/web
npm run dev

# Test build
npm run build
npm run preview

# Test API connection
curl https://proyecto-casira.onrender.com/api/health
```

## 🚨 Solución de Problemas

### Error 404 en Vercel
- ✅ Ya solucionado: vercel.json tiene rewrites para SPA

### CORS errors
- ✅ Configurar origins en tu Flask app:
```python
from flask_cors import CORS
CORS(app, origins=["https://tu-app.vercel.app"])
```

### Variables no se cargan
- ✅ Verificar que empiecen con `VITE_`
- ✅ Redeploy después de agregar variables