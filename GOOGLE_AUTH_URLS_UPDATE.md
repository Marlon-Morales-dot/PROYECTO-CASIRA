# 🔧 URGENTE: Actualizar URLs de Google Auth

## 🚨 Error actual:
```
Error 400: redirect_uri_mismatch
URL: proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app
```

## 🔧 Ve a Google Cloud Console AHORA:
https://console.cloud.google.com/apis/credentials

## 📋 Busca tu Client ID:
`245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com`

## ➕ AGREGAR estas URLs (no reemplazar, AGREGAR):

### Authorized JavaScript origins:
```
https://proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app
https://proyecto-casira-web.vercel.app
```

### Authorized redirect URIs:
```
https://proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app
https://proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app/
https://proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app/login
https://proyecto-casira-web-git-main-marlon-morales-dots-projects.vercel.app/dashboard
https://proyecto-casira-web.vercel.app
https://proyecto-casira-web.vercel.app/
https://proyecto-casira-web.vercel.app/login
https://proyecto-casira-web.vercel.app/dashboard
```

## ⚡ Después de agregarlas:
1. **Save** en Google Console
2. **Esperar 5-10 minutos** (propagación)
3. **Recargar** tu app en Vercel
4. **Probar Google Auth** nuevamente

## 🎯 Esto arreglará:
- ✅ Error 400: redirect_uri_mismatch
- ✅ Google Auth popup funcionando
- ✅ Login con Google habilitado