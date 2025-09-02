# 🚀 CASIRA Connect - Configuración de Servicios en Render

## 📋 Problema Identificado

Tienes **2 servicios separados** en Render, pero ambos tienen configuraciones incorrectas:

1. **proyecto-casira.onrender.com** (Python) - Busca `/backend` que no existe
2. **proyecto-casira-1.onrender.com** (Node.js) - No encuentra el directorio `dist`

## ✅ Solución: Configuraciones Correctas

### 🐍 Servicio 1: Backend Python API
**URL:** https://proyecto-casira.onrender.com

#### Configuración en Render Dashboard:
```
Service Type: Web Service
Runtime: Python
Root Directory: apps/api
Build Command: pip install --no-cache-dir -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

#### Variables de Entorno:
```
PYTHON_VERSION=3.9.19
FLASK_ENV=production
```

### ⚛️ Servicio 2: Frontend React/Vite
**URL:** https://proyecto-casira-1.onrender.com

#### Configuración en Render Dashboard:
```
Service Type: Static Site
Runtime: Node.js
Root Directory: apps/web
Build Command: npm ci --include=dev && npm run build
Publish Directory: dist
```

#### Variables de Entorno:
```
NODE_VERSION=20.18.0
NODE_ENV=production
```

## 🔧 Pasos para Arreglar

### Para el Servicio Python (proyecto-casira.onrender.com):

1. Ve al dashboard de Render
2. Selecciona el servicio `proyecto-casira.onrender.com`
3. Ve a **Settings**
4. Cambia **Root Directory** de `backend` a `apps/api`
5. Actualiza **Build Command** a: `pip install --no-cache-dir -r requirements.txt`
6. Actualiza **Start Command** a: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
7. Guarda cambios

### Para el Servicio Node.js (proyecto-casira-1.onrender.com):

1. Ve al dashboard de Render  
2. Selecciona el servicio `proyecto-casira-1.onrender.com`
3. Ve a **Settings**
4. Cambia **Service Type** a `Static Site` (si no lo es ya)
5. Cambia **Root Directory** a `apps/web`
6. Actualiza **Build Command** a: `npm ci --include=dev && npm run build`
7. Cambia **Publish Directory** a `dist`
8. Guarda cambios

## 📁 Estructura de Archivos (Para Referencia)

```
PROYECTO-CASIRA/
├── apps/
│   ├── api/              ← Servicio Python apunta aquí
│   │   ├── app.py
│   │   ├── requirements.txt
│   │   └── ...
│   └── web/              ← Servicio Node.js apunta aquí  
│       ├── src/
│       ├── dist/         ← Directorio que se publica
│       ├── package.json
│       └── ...
├── render.yaml           ← Configuración de referencia
├── render-python.yaml   ← Config específica Python
└── render-frontend.yaml ← Config específica Frontend
```

## 🎯 Resultado Esperado

Después de estos cambios:

✅ **Backend API** (proyecto-casira.onrender.com):
- Encuentra correctamente `apps/api/app.py`
- Instala dependencias de `apps/api/requirements.txt`
- Inicia Flask con gunicorn

✅ **Frontend** (proyecto-casira-1.onrender.com):
- Encuentra correctamente `apps/web/package.json`
- Ejecuta build de Vite
- Publica el directorio `dist/`

## 🔄 Alternativa: Usar render.yaml

Si prefieres usar archivos de configuración en lugar del dashboard:

1. Copia `render-python.yaml` → `render.yaml` en el servicio Python
2. Copia `render-frontend.yaml` → `render.yaml` en el servicio Frontend
3. O usa el `render.yaml` principal que incluye ambas configuraciones

## ⚠️ Notas Importantes

- Ambos servicios deben apuntar al **mismo repositorio**
- Solo cambiar **Root Directory** y configuraciones específicas
- NO cambiar URLs, esas ya están asignadas por Render
- Hacer los cambios uno a la vez y probar cada uno

---

**Una vez hechos estos cambios, ambos servicios deberían deployar correctamente.**