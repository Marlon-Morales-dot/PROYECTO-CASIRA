# 🔧 Variables de Entorno para Render

## Variables a configurar en tu dashboard de Render:

### 1. Ve a tu servicio Flask API en Render
- Dashboard → `casira-connect-api` → Environment

### 2. Agregar estas variables:

```bash
# Frontend URL para CORS
FRONTEND_URL=https://proyecto-casira-web.vercel.app

# Múltiples orígenes permitidos (separados por coma)
ALLOWED_ORIGINS=https://proyecto-casira-web.vercel.app,https://proyecto-casira-1.onrender.com,http://localhost:5173

# Flask configuration
FLASK_ENV=production
FLASK_DEBUG=false
PYTHON_VERSION=3.9.19
```

### 3. ¿Por qué es necesario?

**Antes:**
```python
CORS(app, origins=["*"])  # Permite todo, pero puede fallar
```

**Ahora:**
```python  
CORS(app, origins=ALLOWED_ORIGINS)  # Solo dominios específicos
```

### 4. Después de agregar las variables:

1. **Save** las variables
2. **Deploy** → Render hará redeploy automático
3. **Wait** 2-3 minutos para que el servicio reinicie
4. **Test** desde Vercel

## ⚡ Resultado esperado:

- ✅ Vercel puede conectar a Render API
- ✅ Imágenes se cargan desde el backend real  
- ✅ No más "401 Unauthorized" errors
- ✅ No más fallback a datos locales