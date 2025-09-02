# CASIRA Connect 🌟

Sistema de gestión integral para amistad y colaboración - Una plataforma completa para conectar donantes, voluntarios y comunidades.

## 🏗️ Arquitectura Escalable

```
CASIRA-CONNECT/
├── apps/
│   ├── web/              # 🌐 Frontend (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/   # Componentes React
│   │   │   ├── lib/         # APIs y utilidades
│   │   │   └── hooks/       # Custom React hooks
│   │   ├── public/          # Assets estáticos
│   │   ├── package.json
│   │   └── vite.config.js
│   └── api/              # ⚙️ Backend (Flask + Python)
│       ├── app.py           # Aplicación principal
│       ├── index.py         # Funciones serverless
│       └── requirements.txt
├── deploy/               # 🚀 Configuraciones de despliegue
│   ├── vercel.json         # Configuración para Vercel
│   ├── render.yaml         # Configuración para Render
│   └── supabase/           # Configuraciones de Supabase (futuro)
├── docs/                 # 📚 Documentación completa
└── README.md
```

## 🚀 Desarrollo Local

### Instalación Rápida
```bash
git clone https://github.com/Marlon-Morales-dot/PROYECTO-CASIRA.git
cd PROYECTO-CASIRA
npm install
```

### Scripts de Desarrollo
```bash
# 🔥 Desarrollo completo (Frontend + Backend)
npm run dev

# 🌐 Solo Frontend (puerto 5173)
npm run dev:web

# ⚙️ Solo Backend (puerto 5000) 
npm run dev:api

# 🏗️ Build para producción
npm run build

# 🚀 Deploy a Vercel
npm run deploy:vercel
```

## 🌐 Despliegue Multi-Plataforma

### ✅ Vercel (Actual - Funcionando)
- **Frontend**: Optimizado para React + Vite
- **API**: Serverless functions en Python
- **URL**: https://proyecto-casira.vercel.app
- **Deploy**: Automático con cada push

### ✅ Render (Backend Completo)
- **Full Stack**: Frontend build + Flask backend
- **Configuración**: `deploy/render.yaml`
- **Deploy**: Automático desde GitHub

### ✅ Supabase (Database + Storage)
- **PostgreSQL**: Base de datos principal
- **Storage**: Imágenes y archivos
- **Auth**: Integrado con Google OAuth

## 💡 Funcionalidades

### 👥 Gestión de Usuarios
- **Admin**: Dashboard completo de administración
- **Donantes**: Panel de contribuciones y analytics
- **Voluntarios**: Gestión de actividades y responsabilidades
- **Visitantes**: Portal social para explorar y participar

### 🎯 Características Principales
- ✅ **Autenticación**: Google OAuth + JWT
- ✅ **Feed Social**: Posts, comentarios y likes
- ✅ **Actividades**: Crear, gestionar y unirse
- ✅ **Notificaciones**: Sistema en tiempo real
- ✅ **Responsive**: Adaptado a todos los dispositivos
- ✅ **Persistencia**: LocalStorage + Supabase

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret

# JWT & Session
JWT_SECRET=tu-jwt-secret-64-chars
SESSION_SECRET=tu-session-secret-64-chars

# Backend URL
BACKEND_URL=https://tu-app.onrender.com
```

## 📱 Tech Stack

### Frontend (`apps/web/`)
- **React 18** + **Vite** - Build tool moderno
- **Tailwind CSS** + **Radix UI** - Sistema de diseño
- **Framer Motion** - Animaciones fluidas
- **React Router 7** - Navegación SPA
- **React Hook Form** + **Zod** - Manejo de formularios

### Backend (`apps/api/`)
- **Flask 3.1** - Framework web Python
- **Gunicorn** - Servidor WSGI para producción
- **Flask-CORS** - Manejo de CORS
- **JWT** - Autenticación segura

### Database & Storage
- **Supabase PostgreSQL** - Base de datos principal
- **Supabase Storage** - Almacenamiento de archivos
- **LocalStorage** - Cache del lado del cliente

## 🛠️ Scripts Disponibles

```bash
npm run dev           # 🔥 Desarrollo completo
npm run dev:web       # 🌐 Solo frontend
npm run dev:api       # ⚙️ Solo backend
npm run build         # 🏗️ Build producción
npm run build:web     # 🌐 Build solo frontend
npm run start         # 🚀 Iniciar backend
npm run deploy:vercel # 🚀 Deploy a Vercel
npm run lint          # ✅ Linter de código
npm run test          # 🧪 Tests (por implementar)
```

## 📊 Estado del Proyecto

### ✅ Completamente Funcional
- [x] Sistema de autenticación completo
- [x] Dashboard para todos los roles
- [x] Feed social interactivo
- [x] Gestión de actividades
- [x] Sistema de notificaciones
- [x] Comentarios y likes
- [x] Responsive design
- [x] Deploy en múltiples plataformas

### 🔄 En Desarrollo
- [ ] Tests automatizados
- [ ] Integración completa con Supabase
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Chat en tiempo real

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Documentación

Consulta la carpeta `docs/` para documentación detallada:
- [Guía de Deployment](docs/DEPLOYMENT_GUIDE.md)
- [Soluciones Implementadas](docs/SOLUCION_COMPLETA_README.md)
- [Auth con Google](docs/GOOGLE_AUTH_FIXES.md)
- [Persistencia de Datos](docs/SOLUCION_PERSISTENCIA.md)

## 👨‍💻 Autor

**MARLON** - Full Stack Developer  
📧 Email: [marlon@casira.org](mailto:marlon@casira.org)  
🌐 Web: https://proyecto-casira.vercel.app

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐

🚀 **Deploy Status**: ✅ Vercel | ✅ Render | ✅ Supabase  
📱 **Live Demo**: https://proyecto-casira.vercel.app