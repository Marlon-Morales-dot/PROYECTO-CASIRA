# CASIRA Connect 🌟

**Plataforma Web Integral para la Transformación Social**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.1-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.7-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> Una plataforma diseñada específicamente para el **Centro Internacional de Amistad y Solidaridad de los Apalaches (CASIRA)** y su proyecto **Amistad Palencia**, enfocada en la gestión eficiente de colaboradores, seguimiento de obras sociales y coordinación de recursos logísticos para comunidades vulnerables de Guatemala.

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [API Endpoints](#-api-endpoints)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)
- [Documentación Técnica](#-documentación-técnica)
- [Licencia y Soporte](#-licencia-y-soporte)

## 🎯 Descripción del Proyecto

CASIRA Connect es una red social especializada que enfatiza el **impacto tangible** de las obras realizadas, alejándose del enfoque monetario tradicional para centrarse en la **transformación real de comunidades**. La plataforma integra tres componentes principales:

### 🏠 Landing Page
- Orientada a donantes y constructores de sueños
- Muestra proyectos destacados y estadísticas de impacto
- Interface intuitiva para captar nuevos colaboradores

### 🔐 Sistema de Autenticación
- Manejo seguro de usuarios con diferentes roles
- Integración preparada con Supabase
- Gestión de sesiones y permisos

### 📊 Dashboard Social
- Red social especializada para la comunidad CASIRA
- Seguimiento en tiempo real de proyectos
- Interacción entre donantes, voluntarios y beneficiarios

## ✨ Características Principales

### 👥 Gestión de Usuarios Multirrol
- **Visitantes**: Acceso público a información básica
- **Donantes**: Seguimiento de sus contribuciones e impacto
- **Voluntarios**: Coordinación de actividades y reportes
- **Administradores**: Control total de la plataforma

### 🏗️ Seguimiento de Proyectos
- Visualización del progreso en tiempo real
- Galería de imágenes antes/después
- Métricas de impacto social cuantificable
- Geolocalización de obras realizadas

### 📱 Interface Responsive
- Optimizada para dispositivos móviles
- Diseño moderno con componentes Radix UI
- Animaciones fluidas con Framer Motion
- Tema claro/oscuro disponible

### 🔄 Funcionalidades Sociales
- Sistema de publicaciones y comentarios
- Likes y compartir contenido
- Timeline de actividades
- Notificaciones en tiempo real

## 🛠️ Tecnologías Utilizadas

### Frontend
```json
{
  "framework": "React 19.1.0",
  "builder": "Vite 6.3.5",
  "styling": "TailwindCSS 4.1.7",
  "ui_components": "Radix UI",
  "animations": "Framer Motion",
  "routing": "React Router DOM",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts",
  "package_manager": "pnpm 10.4.1"
}
```

### Backend
```json
{
  "framework": "Flask 3.1.1",
  "cors": "Flask-CORS 6.0.0",
  "server": "Gunicorn 21.2.0",
  "database": "Supabase (PostgreSQL)",
  "deployment": "Render"
}
```

### Frontend
```json
{
  "deployment": "Vercel",
  "hosting": "Static Site Generation"
}
```

### Database & Services
```json
{
  "database": "Supabase (PostgreSQL)",
  "authentication": "Supabase Auth",
  "storage": "Supabase Storage"
}
```

## 🏗️ Arquitectura del Sistema

```
CASIRA-Connect/
├── 🖥️ frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/ui/       # Componentes Radix UI
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilidades
│   │   ├── App.jsx             # Componente principal
│   │   └── main.jsx            # Punto de entrada
│   ├── public/                 # Assets estáticos
│   └── dist/                   # Build de producción
├── ⚙️ backend/                  # API Flask
│   ├── src/                    # Código fuente
│   ├── app.py                  # Servidor principal
│   ├── app_supabase.py         # Versión con Supabase
│   └── requirements*.txt       # Dependencias
├── 📚 docs/                     # Documentación técnica
│   ├── INFORME_TECNICO_COMPLETO.md
│   └── GUIA_DESPLIEGUE_COMPLETA.md
└── 🗄️ supabase-schema.sql       # Esquema de base de datos
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 18.x
- **Python** >= 3.8
- **pnpm** o **npm**
- **Git**

### 1️⃣ Clonar el Repositorio
```bash
git clone <repository-url>
cd PROYECTO-CASIRA
```

### 2️⃣ Configurar el Frontend
```bash
cd frontend
pnpm install                    # o npm install
```

### 3️⃣ Configurar el Backend
```bash
cd ../backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 4️⃣ Variables de Entorno
Crear archivo `.env` en la raíz del backend:
```env
# Configuración de Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Configuración de Flask
FLASK_ENV=development
SECRET_KEY=tu_secret_key_aqui

# URLs de la aplicación
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### 5️⃣ Ejecutar en Desarrollo
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
pnpm run dev --host           # o npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📖 Uso del Sistema

### Para Visitantes
1. Accede a la Landing Page para conocer los proyectos
2. Explora las obras realizadas y estadísticas de impacto
3. Regístrate para convertirte en constructor de sueños

### Para Donantes
1. Inicia sesión en el sistema
2. Accede al dashboard para ver tus contribuciones
3. Sigue el progreso de los proyectos que apoyas
4. Interactúa con la comunidad CASIRA

### Para Administradores
1. Gestiona usuarios y roles desde el panel administrativo
2. Publica actualizaciones de proyectos
3. Modera contenido y actividad social
4. Genera reportes de impacto

## 🔌 API Endpoints

### Proyectos
```http
GET    /api/projects/featured     # Proyectos destacados
GET    /api/projects/stats        # Estadísticas generales
GET    /api/projects/:id          # Proyecto específico
POST   /api/projects              # Crear proyecto (admin)
PUT    /api/projects/:id          # Actualizar proyecto (admin)
DELETE /api/projects/:id          # Eliminar proyecto (admin)
```

### Posts Sociales
```http
GET    /api/posts                 # Timeline de posts
POST   /api/posts                 # Crear post
PUT    /api/posts/:id             # Actualizar post
DELETE /api/posts/:id             # Eliminar post
POST   /api/posts/:id/like        # Dar like
POST   /api/posts/:id/comment     # Comentar
```

### Usuarios
```http
POST   /api/auth/register         # Registro de usuario
POST   /api/auth/login            # Inicio de sesión
GET    /api/users/profile         # Perfil de usuario
PUT    /api/users/profile         # Actualizar perfil
```

Para documentación completa de la API, consulta `docs/API_DOCUMENTATION.md`

## 🌐 Despliegue

### Tu Stack Actual en Producción:

#### 🎨 Frontend → Vercel
- **URL**: Dominio de Vercel
- **Build**: `pnpm run build`
- **Deploy**: Automático desde GitHub

#### ⚙️ Backend → Render
- **URL**: URL de Render (.onrender.com)
- **Build**: `pip install -r requirements.txt`
- **Start**: `gunicorn app:app`

#### 🗄️ Database → Supabase
- **PostgreSQL** con interfaz web
- **Autenticación** integrada
- **Storage** para archivos

Para configuración detallada: [📖 Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

## 🤝 Contribución

### Configurar Entorno de Desarrollo
```bash
# Fork del repositorio
git fork <repository-url>
git clone <your-fork-url>

# Instalar dependencias
cd PROYECTO-CASIRA
pnpm install-all  # Script personalizado para instalar todo
```

### Convenciones de Código
- **Frontend**: ESLint + Prettier
- **Backend**: PEP 8 (Python)
- **Commits**: Conventional Commits
- **Branches**: feature/*, bugfix/*, hotfix/*

### Proceso de Contribución
1. Crea un branch para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Desarrolla siguiendo las convenciones establecidas
3. Escribe tests para tu código
4. Envía un Pull Request con descripción detallada

## 📚 Documentación Técnica

### Documentos Disponibles
- 📄 **[Informe Técnico Completo](docs/INFORME_TECNICO_COMPLETO.md)**: Análisis detallado del desarrollo
- 🚀 **[Guía de Despliegue](docs/GUIA_DESPLIEGUE_COMPLETA.md)**: Instrucciones paso a paso
- 🏗️ **[Arquitectura del Sistema](docs/ARCHITECTURE.md)**: Diagramas y patrones utilizados
- 🔧 **[API Documentation](docs/API_DOCUMENTATION.md)**: Referencia completa de endpoints

### Estructura de Componentes
```
components/ui/
├── accordion.jsx        # Componentes desplegables
├── alert.jsx           # Notificaciones y alertas
├── button.jsx          # Botones personalizados
├── card.jsx            # Tarjetas de contenido
├── dialog.jsx          # Modales y diálogos
├── form.jsx            # Formularios validados
├── table.jsx           # Tablas de datos
└── ...                 # 20+ componentes más
```

## 📄 Licencia y Soporte

### Licencia
Este proyecto está desarrollado específicamente para **CASIRA** (Centro Internacional de Amistad y Solidaridad de los Apalaches) y el proyecto **Amistad Palencia**.

### Soporte Técnico
- 📧 **Email**: soporte-tecnico@casira.org
- 📞 **Teléfono**: +502 XXXX-XXXX
- 🌐 **Website**: https://casira.org

### Información del Proyecto
- **Autor**: Marlon Agusto Morales
- **Versión**: 1.0.0
- **Fecha de Lanzamiento**: Agosto 2025
- **Última Actualización**: Agosto 2025

---

<div align="center">

**🌟 Construyendo sueños, transformando comunidades 🌟**

*CASIRA Connect - Donde cada contribución cuenta una historia de esperanza*

[🚀 Demo en Vivo](https://j6h5i7cpjd18.manus.space) | [📖 Documentación](./docs/) | [🤝 Contribuir](#-contribución) | [📞 Soporte](#-licencia-y-soporte)

</div>

