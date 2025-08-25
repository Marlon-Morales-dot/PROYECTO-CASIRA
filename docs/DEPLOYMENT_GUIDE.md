# Guía de Despliegue - CASIRA Connect

## 🎯 Descripción General

Esta guía proporciona instrucciones detalladas para desplegar CASIRA Connect en diferentes plataformas de hosting. Cada opción incluye pasos específicos, configuraciones y mejores prácticas.

## 📋 Tu Stack de Producción Actual

1. [**Vercel + Render + Supabase** (Tu configuración actual)](#-vercel--render--supabase-tu-stack)
2. [Configuración de Variables de Entorno](#-variables-de-entorno)
3. [Monitoreo y Optimización](#-monitoreo-y-optimización)

---

## 🌟 Vercel + Render + Supabase (Tu Stack)

### Por qué esta es tu configuración ideal:
- **Vercel**: Perfecto para React/Vite con deploy automático
- **Render**: Excelente para Flask con build automático desde GitHub
- **Supabase**: Base de datos PostgreSQL + Auth + Storage integrado
- **Costo**: Planes gratuitos generosos para todos los servicios
- **Performance**: CDN global y edge computing

### 🔧 Backend en Render

#### Paso 1: Preparar el repositorio
```bash
# Asegurarse de que existe Procfile en /backend
echo "web: gunicorn app:app" > backend/Procfile

# Verificar render.yaml en raíz
cat render.yaml
```

#### Paso 2: Configurar Render
1. Ir a [render.com](https://render.com/)
2. Conectar cuenta GitHub
3. Crear nuevo **Web Service**
4. Seleccionar repositorio
5. Configurar:

**Build Settings:**
```yaml
Name: casira-backend
Environment: Python 3
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && gunicorn app:app
```

**Environment Variables:**
```env
PYTHON_VERSION=3.11.0
FLASK_ENV=production
SECRET_KEY=tu_clave_secreta_super_segura_2024
FRONTEND_URL=https://casira-connect.vercel.app
```

#### Paso 3: Deploy automático
- Render detectará cambios en GitHub
- Build automático en cada push
- URL generada: `https://tu-app-name.onrender.com`

### 🎨 Frontend en Vercel

#### Paso 1: Configurar vercel.json
```json
{
  "buildCommand": "cd frontend && pnpm install && pnpm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Paso 2: Variables de entorno
En Vercel Dashboard -> Settings -> Environment Variables:
```env
VITE_API_URL=https://tu-backend.onrender.com
VITE_APP_TITLE=CASIRA Connect
```

#### Paso 3: Deploy
1. Ir a [vercel.com](https://vercel.com/)
2. Import Git Repository
3. Seleccionar tu repositorio
4. Framework Preset: **Vite**
5. Root Directory: `frontend`
6. Deploy

**Build Settings Automáticas:**
```bash
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

---

## 🗄️ Configuración de Supabase (Tu Base de Datos)

### Configuración completa en Supabase

#### Paso 1: Crear proyecto Supabase
1. Ir a [supabase.com](https://supabase.com/)
2. Crear nuevo proyecto
3. Esperar configuración completa

#### Paso 2: Configurar base de datos
```sql
-- Ejecutar en Supabase SQL Editor
-- Contenido de supabase-schema.sql

-- Tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de proyectos
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  location VARCHAR(200),
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Datos de ejemplo
INSERT INTO projects (title, description, image_url, status, progress_percentage, location) VALUES
('Nueva Biblioteca en San Juan', '300 niños con acceso a libros y tecnología', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 'completed', 100, 'San Juan Palencia, Guatemala');
```

#### Paso 3: Configurar Edge Functions
```typescript
// supabase/functions/projects/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .limit(10)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 },
    )
  }

  return new Response(
    JSON.stringify({ projects: data }),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

#### Paso 4: Deploy Frontend
```bash
# Instalar Supabase CLI
npm install -g @supabase/cli

# Login y deploy
supabase login
supabase projects create casira-connect
supabase db push
supabase functions deploy
```

---

## 🔧 Variables de Entorno

### Tu configuración actual requiere estas variables:

#### Para Render (Backend)
```env
FLASK_ENV=production
SECRET_KEY=tu_clave_secreta_super_segura
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
FRONTEND_URL=https://tu-dominio.vercel.app
```

#### Para Vercel (Frontend)
```env
VITE_API_URL=https://tu-backend.onrender.com
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

#### Para Supabase
- Configuración a través del dashboard web
- Schema importado desde `supabase-schema.sql`
- Row Level Security (RLS) configurado

---

## 📊 Monitoreo de Tu Stack

### Herramientas de Monitoreo
- **Vercel Analytics**: Para métricas del frontend
- **Render Metrics**: Para performance del backend
- **Supabase Dashboard**: Para base de datos y auth

### Health Checks
```bash
# Verificar frontend
curl https://tu-dominio.vercel.app

# Verificar backend
curl https://tu-backend.onrender.com/health

# Verificar API
curl https://tu-backend.onrender.com/api/projects/featured
```

---

## ⚡ Optimizaciones de Performance

### Frontend Optimizations

#### Vite config optimizado
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true
  }
})
```

### Backend Optimizations

#### Configuración Gunicorn
```python
# gunicorn.conf.py
bind = "0.0.0.0:5000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 5
```

---

## 🔍 Monitoring y Health Checks

### Health Check Endpoint
```python
# En app.py
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database": "connected" if check_db() else "disconnected"
    })

def check_db():
    try:
        # Verificar conexión a base de datos
        return True
    except:
        return False
```

### Uptime Monitoring
Servicios recomendados:
- **UptimeRobot**: Gratis, 50 monitores
- **Pingdom**: Monitoreo avanzado
- **StatusPage**: Página de estado

---

## 🔒 Configuración de Seguridad

### Variables de entorno seguras
```env
# NUNCA commitear estas variables
SECRET_KEY=clave_super_segura_de_32_caracteres_minimo
DATABASE_URL=postgresql://user:pass@host:port/db
SUPABASE_SERVICE_ROLE_KEY=ey...
```

### HTTPS y SSL
```python
# En Flask para producción
if not app.debug:
    app.config['PREFERRED_URL_SCHEME'] = 'https'
```

### CORS Configuration
```python
# Configuración segura para producción
CORS(app, origins=[
    "https://casira-connect.vercel.app",
    "https://casira.org",
    "https://www.casira.org"
])
```

---

## 🧪 Testing de Deployment

### Checklist pre-deployment
```bash
# Backend tests
curl -X GET https://tu-backend-url/health
curl -X GET https://tu-backend-url/api/projects/featured

# Frontend tests
# - Abrir URL en navegador
# - Verificar carga de datos
# - Probar responsive design
# - Verificar en diferentes navegadores
```

### Performance Testing
```bash
# Usar herramientas como:
# - Google PageSpeed Insights
# - GTmetrix
# - WebPageTest
```

---

## 📚 Recursos Adicionales

### Documentación oficial:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app/)

### Herramientas útiles:
- **GitHub Actions**: CI/CD automático
- **Dependabot**: Actualizaciones automáticas
- **Sentry**: Error tracking
- **LogRocket**: Session recording

## 🆘 Troubleshooting

### Problemas comunes:

**Build failing:**
```bash
# Verificar logs de build
# Revisar dependencias en package.json y requirements.txt
# Verificar variables de entorno
```

**500 Internal Server Error:**
```bash
# Verificar logs del servidor
# Revisar configuración CORS
# Verificar variables de entorno del backend
```

**Frontend no carga datos:**
```bash
# Verificar VITE_API_URL
# Comprobar que backend esté ejecutándose
# Revisar CORS en backend
```

---

¡Tu aplicación CASIRA Connect está lista para transformar vidas! 🌟

**Desarrollado por**: Marlon Agusto Morales  
Para consultas sobre despliegue: soporte-tecnico@casira.org