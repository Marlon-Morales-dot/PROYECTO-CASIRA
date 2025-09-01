# 🚀 Guía de Despliegue - CASIRA Connect

## 📋 **Variables de Entorno para Vercel (Frontend)**

```bash
VITE_PYTHON_BACKEND_URL=https://proyecto-casira.onrender.com
VITE_NODEJS_BACKEND_URL=https://proyecto-casira-1.onrender.com
VITE_BACKEND_URL=https://proyecto-casira.onrender.com
VITE_FRONTEND_URL=https://proyecto-casira.vercel.app
VITE_SUPABASE_URL=[TU_SUPABASE_URL]
VITE_SUPABASE_ANON_KEY=[TU_SUPABASE_ANON_KEY]
VITE_GOOGLE_CLIENT_ID=[TU_GOOGLE_CLIENT_ID]
VITE_NODE_ENV=production
```

## 🐍 **Variables para Python Backend (Render)**

```bash
PORT=5000
DEBUG=False
SECRET_KEY=[CLAVE_SECRETA_64_CHARS]
GOOGLE_CLIENT_ID=[TU_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[TU_GOOGLE_CLIENT_SECRET]
SUPABASE_URL=[TU_SUPABASE_URL]
SUPABASE_ANON_KEY=[TU_SUPABASE_ANON_KEY]
ALLOWED_ORIGINS=https://proyecto-casira.vercel.app,http://localhost:5173
FRONTEND_URL=https://proyecto-casira.vercel.app
LOG_LEVEL=INFO
```

## 🟢 **Variables para Node.js Backend (Render)**

```bash
PORT=10000
NODE_ENV=production
JWT_SECRET=[CLAVE_SECRETA_64_CHARS]
SESSION_SECRET=[OTRA_CLAVE_SECRETA_64_CHARS]
GOOGLE_CLIENT_ID=[TU_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[TU_GOOGLE_CLIENT_SECRET]
SUPABASE_URL=[TU_SUPABASE_URL]
SUPABASE_ANON_KEY=[TU_SUPABASE_ANON_KEY]
ALLOWED_ORIGINS=https://proyecto-casira.vercel.app,http://localhost:5173
FRONTEND_URL=https://proyecto-casira.vercel.app
```

## 🔐 **Generar Claves Seguras**

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## ✅ **Arquitectura Final**

- **Frontend**: https://proyecto-casira.vercel.app
- **Python Backend**: https://proyecto-casira.onrender.com  
- **Node.js Backend**: https://proyecto-casira-1.onrender.com
- **Database**: Supabase