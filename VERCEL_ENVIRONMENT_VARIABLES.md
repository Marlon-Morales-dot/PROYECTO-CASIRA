# 🔧 Variables de Entorno para Vercel

## Variables a configurar en tu dashboard de Vercel:

### API Configuration
```
VITE_API_BASE_URL = https://proyecto-casira.onrender.com
```

### Supabase Configuration  
```
VITE_SUPABASE_URL = https://wlliqmcpiiktcdzwzhdn.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo
```

### Google Auth Configuration
```
VITE_GOOGLE_CLIENT_ID = [TU_GOOGLE_CLIENT_ID_AQUI]
```

### Build Configuration
```
VITE_ENV = production
NODE_ENV = production
```

## 🚀 Comandos para configurar en Vercel CLI:

```bash
vercel env add VITE_API_BASE_URL
# Valor: https://proyecto-casira.onrender.com

vercel env add VITE_SUPABASE_URL  
# Valor: https://wlliqmcpiiktcdzwzhdn.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo

vercel env add VITE_GOOGLE_CLIENT_ID
# Valor: [TU_GOOGLE_CLIENT_ID]

vercel env add VITE_ENV
# Valor: production
```