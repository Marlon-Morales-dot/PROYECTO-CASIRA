# 🚀 CASIRA Connect - Instrucciones de Despliegue en Render

## ✅ Problemas Resueltos

- **Error de importación**: `Could not resolve "./lib/api.js"` - ✅ SOLUCIONADO
- **Rutas inconsistentes**: Ahora todas las importaciones usan el alias `@/lib/`
- **Configuración de build**: Actualizada para usar `esbuild` en lugar de `terser`
- **Estructura de proyecto**: Optimizada para despliegue en Render

## 📋 Configuración en Render

### 1. Configuración del Servicio Web

Cuando crees el servicio en Render, utiliza estos valores:

```
Service Type: Web Service
Runtime: Python
Root Directory: [DEJAR VACÍO] o "."
Build Command: [Se usa automáticamente desde render.yaml]
Start Command: [Se usa automáticamente desde render.yaml]
```

### 2. Variables de Entorno (Automáticas)

Las siguientes variables se configuran automáticamente desde `render.yaml`:

```
PYTHON_VERSION=3.9.19
NODE_VERSION=20.18.0
NODE_ENV=production
PYTHONPATH=/opt/render/project/src
```

### 3. Archivos de Configuración

- ✅ `render.yaml` - Configuración principal de despliegue
- ✅ `package.json` - Scripts de build y dependencias
- ✅ `apps/web/vite.config.js` - Configuración de Vite optimizada
- ✅ `.nvmrc` - Versión de Node.js especificada
- ✅ `requirements.txt` - Dependencias de Python

## 🔧 Cambios Realizados

### 1. Vite Configuration (`apps/web/vite.config.js`)
```javascript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "@lib": path.resolve(__dirname, "./src/lib"),
  },
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
},
build: {
  outDir: 'dist',
  minify: 'esbuild' // Cambiado de 'terser' a 'esbuild'
}
```

### 2. Import Paths Standardization
Todas las importaciones ahora usan el alias consistente:
```javascript
// Antes: import { api } from './lib/api.js'
// Después: import { api } from '@/lib/api.js'
```

### 3. Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: casira-connect
    runtime: python
    rootDir: .  # Directorio raíz especificado
    buildCommand: |
      # Build optimizado con limpieza de cache
      # Instalación de dependencias con --no-fund --no-audit
      # Verificación de build output
    startCommand: |
      # Start con logs mejorados
      cd apps/api && gunicorn app:app --bind 0.0.0.0:$PORT
```

## 🏗️ Proceso de Build

El proceso de build actualizado realiza:

1. **Limpieza**: Elimina builds anteriores y cache
2. **Dependencias Root**: `npm install` en directorio raíz
3. **Frontend Build**: 
   - `cd apps/web`
   - `npm ci --include=dev`
   - `npm run build`
   - Verificación de archivos generados
4. **Backend Setup**: `pip install -r requirements.txt`

## 📝 Logs de Debugging

El nuevo build incluye logs detallados para debugging:
- Lista de directorios actuales
- Verificación de archivos generados
- Output de assets en `dist/`

## 🔄 Para Re-deployar

1. Haz push de los cambios al repositorio
2. Render detectará automáticamente los cambios
3. Ejecutará el proceso de build actualizado
4. El deployment debería ser exitoso

## ⚠️ Notas Importantes

- **Root Directory**: Debe estar vacío o configurado como "." en Render
- **Node Version**: Especificada en `.nvmrc` y `render.yaml`
- **Build Time**: Puede tomar 3-5 minutos debido al build del frontend
- **Logs**: Monitorea los logs de build para cualquier problema

## 🎯 Verificación Post-Deploy

Una vez desplegado, verifica:

1. ✅ Frontend se carga correctamente
2. ✅ API endpoints responden
3. ✅ Assets estáticos se sirven correctamente
4. ✅ No hay errores de importación en console

---

**Resultado esperado**: El deployment ahora debería completarse sin el error `Could not resolve "./lib/api.js"` y todos los imports deberían resolverse correctamente.