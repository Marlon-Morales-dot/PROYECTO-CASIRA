# Guía de Instalación - CASIRA Connect

## 📋 Introducción

Esta guía te llevará paso a paso por la instalación completa de CASIRA Connect en diferentes entornos. Está diseñada para ser comprensible tanto para desarrolladores experimentados como para principiantes.

## 🎯 Índice de Contenidos

1. [Requisitos del Sistema](#-requisitos-del-sistema)
2. [Instalación Completa Local](#-instalación-completa-local)
3. [Configuración con Supabase](#-configuración-con-supabase)
4. [Deploy a Tu Stack (Vercel + Render)](#-deploy-a-tu-stack)
5. [Resolución de Problemas](#-resolución-de-problemas)
6. [Verificación de Instalación](#-verificación-de-instalación)

## 💻 Requisitos del Sistema

### Requisitos Mínimos
- **Sistema Operativo**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 4GB mínimo (8GB recomendado)
- **Espacio en Disco**: 2GB libres
- **Conexión a Internet**: Necesaria para descargar dependencias

### Software Necesario

#### Node.js (Para Frontend)
```bash
# Verificar si está instalado
node --version
npm --version

# Si no está instalado, descargar desde:
# https://nodejs.org/ (versión LTS recomendada)
```

#### Python (Para Backend)
```bash
# Verificar si está instalado
python --version
# o
python3 --version

# Debe ser Python 3.8 o superior
# Si no está instalado, descargar desde:
# https://python.org/downloads/
```

#### Git
```bash
# Verificar si está instalado
git --version

# Si no está instalado, descargar desde:
# https://git-scm.com/downloads
```

#### pnpm (Recomendado para Frontend)
```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalación
pnpm --version
```

## 🚀 Instalación Completa Local

### Paso 1: Clonar el Repositorio
```bash
# Clonar proyecto (reemplaza URL con la real)
git clone <URL_DEL_REPOSITORIO>
cd PROYECTO-CASIRA
```

### Paso 2: Configurar el Backend

#### 2.1 Navegar al directorio backend
```bash
cd backend
```

#### 2.2 Crear entorno virtual
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.3 Instalar dependencias
```bash
# Instalar desde requirements.txt
pip install -r requirements.txt

# Verificar instalación
pip list
```

#### 2.4 Configurar variables de entorno
```bash
# Crear archivo .env en la carpeta backend
touch .env  # Linux/Mac
# o crear manualmente en Windows
```

Contenido del archivo `.env`:
```env
# Configuración Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=tu_clave_secreta_super_segura_aqui_2024

# URLs de la aplicación
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Configuración Supabase (opcional por ahora)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

### Paso 3: Configurar el Frontend

#### 3.1 Abrir nueva terminal y navegar al frontend
```bash
# Desde la raíz del proyecto
cd frontend
```

#### 3.2 Instalar dependencias
```bash
# Usando pnpm (recomendado)
pnpm install

# O usando npm
npm install
```

#### 3.3 Configurar variables de entorno (opcional)
```bash
# Crear archivo .env en la carpeta frontend
touch .env  # Linux/Mac
```

Contenido del archivo `.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=CASIRA Connect
```

### Paso 4: Ejecutar la Aplicación

#### 4.1 Ejecutar Backend (Terminal 1)
```bash
# Desde la carpeta backend con venv activado
python app.py
```

Verás algo como:
```
* Running on all addresses (0.0.0.0)
* Running on http://127.0.0.1:5000
* Running on http://192.168.1.100:5000
```

#### 4.2 Ejecutar Frontend (Terminal 2)
```bash
# Desde la carpeta frontend
pnpm run dev --host
# o
npm run dev
```

Verás algo como:
```
Local:   http://localhost:5173/
Network: http://192.168.1.100:5173/
```

### Paso 5: Verificar Instalación
1. Abrir navegador en `http://localhost:5173`
2. Debería cargar la página principal de CASIRA Connect
3. Verificar que se muestran proyectos y estadísticas


## 🗄️ Configuración con Supabase

### Para Base de Datos Real

#### 1. Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com/)
2. Crear cuenta y nuevo proyecto
3. Esperar a que se configure (2-3 minutos)

#### 2. Configurar esquema de base de datos
```bash
# En Supabase Dashboard -> SQL Editor
# Copiar y ejecutar el contenido de supabase-schema.sql
```

#### 3. Obtener credenciales
En Supabase Dashboard -> Settings -> API:
- `Project URL`: tu URL del proyecto
- `anon public`: clave pública
- `service_role`: clave privada (¡mantener secreta!)

#### 4. Configurar variables de entorno
En el archivo `.env` del backend:
```env
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. Usar la versión Supabase
```bash
# Instalar dependencias adicionales
pip install -r requirements_supabase.txt

# Usar app_supabase.py en lugar de app.py
python app_supabase.py
```

## 🚀 Deploy a Tu Stack

### Tu configuración de producción actual:

#### 🎨 Frontend → Vercel
```bash
# 1. Conectar repositorio a Vercel
# 2. Configurar build settings:
Build Command: cd frontend && pnpm run build
Output Directory: frontend/dist
Install Command: cd frontend && pnpm install

# 3. Variables de entorno en Vercel:
VITE_API_URL=https://tu-backend.onrender.com
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

#### ⚙️ Backend → Render
```bash
# 1. Conectar repositorio a Render
# 2. Configurar web service:
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && gunicorn app:app

# 3. Variables de entorno en Render:
FLASK_ENV=production
SECRET_KEY=tu_clave_secreta
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_key
FRONTEND_URL=https://tu-dominio.vercel.app
```

#### 🗄️ Database → Supabase
```bash
# 1. Crear proyecto en supabase.com
# 2. Importar schema desde supabase-schema.sql
# 3. Configurar Row Level Security (RLS)
# 4. Obtener URLs y keys para los otros servicios
```

## 🔧 Resolución de Problemas

### Problema: Error "Node.js not found"
**Síntomas**: `node: command not found`

**Solución**:
1. Descargar Node.js desde [nodejs.org](https://nodejs.org/)
2. Instalar la versión LTS
3. Reiniciar terminal
4. Verificar: `node --version`

### Problema: Error "Python not found"
**Síntomas**: `python: command not found`

**Solución Windows**:
1. Descargar Python desde [python.org](https://python.org/)
2. **Importante**: Marcar "Add to PATH" durante instalación
3. Reiniciar sistema

**Solución macOS**:
```bash
# Instalar con Homebrew
brew install python
```

**Solución Linux**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip python3-venv

# CentOS/RHEL
sudo yum install python3 python3-pip
```

### Problema: Error "Permission denied"
**Síntomas**: No se pueden instalar dependencias

**Solución Linux/Mac**:
```bash
# No usar sudo con pip en entorno virtual
# Asegurarse de activar venv
source venv/bin/activate
pip install -r requirements.txt
```

**Solución Windows**:
```bash
# Ejecutar PowerShell como administrador
# O cambiar política de ejecución
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Puertos en uso
**Síntomas**: `Address already in use`

**Solución**:
```bash
# Buscar proceso usando puerto
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Matar proceso
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

### Problema: Error de CORS
**Síntomas**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solución**:
1. Verificar que backend esté ejecutándose
2. Verificar FRONTEND_URL en `.env` del backend
3. Comprobar configuración CORS en `app.py`

### Problema: Dependencias no se instalan
**Síntomas**: Errores durante `npm install` o `pip install`

**Solución**:
```bash
# Frontend
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install

# Backend
pip cache purge
pip install --upgrade pip
pip install -r requirements.txt
```

## ✅ Verificación de Instalación

### Checklist de Verificación

#### ✅ Backend
- [ ] Entorno virtual creado y activado
- [ ] Dependencias instaladas (`pip list`)
- [ ] Archivo `.env` configurado
- [ ] Servidor ejecutándose en puerto 5000
- [ ] Endpoint accesible: `curl http://localhost:5000/api/projects/featured`

#### ✅ Frontend
- [ ] Node.js y pnpm instalados
- [ ] Dependencias instaladas (`node_modules` existe)
- [ ] Servidor de desarrollo ejecutándose en puerto 5173
- [ ] Página carga correctamente en navegador
- [ ] Datos se muestran (proyectos, estadísticas)

#### ✅ Comunicación Frontend-Backend
- [ ] Frontend puede obtener datos del backend
- [ ] No hay errores CORS en consola del navegador
- [ ] Imágenes de proyectos cargan correctamente

### Comandos de Verificación

```bash
# Verificar backend
curl -X GET http://localhost:5000/api/projects/featured
curl -X GET http://localhost:5000/api/projects/stats

# Verificar frontend (en navegador)
# - Ir a http://localhost:5173
# - Abrir DevTools (F12)
# - Verificar que no hay errores en Console
# - Verificar Network tab para peticiones exitosas
```

## 📞 Soporte

### Si necesitas ayuda:

1. **Documentación**: Revisa los archivos en `docs/`
2. **Issues conocidos**: Consulta la sección de troubleshooting
3. **Contacto**: soporte-tecnico@casira.org
4. **Community**: GitHub Issues del repositorio

### Información útil para reportar problemas:

- Sistema operativo y versión
- Versión de Node.js y Python
- Mensaje de error completo
- Pasos que llevaron al error
- Screenshots si aplica

---

🎉 **¡Felicitaciones!** Si has llegado hasta aquí, CASIRA Connect debería estar funcionando correctamente en tu sistema local.

**Próximos pasos sugeridos:**
1. Explorar el código en `src/`
2. Revisar la documentación técnica en `docs/`
3. Probar hacer cambios y ver hot-reload
4. Configurar Supabase para datos reales
5. Contribuir al proyecto siguiendo la guía de contribución

¡Bienvenido al equipo de desarrollo de CASIRA Connect! 🌟