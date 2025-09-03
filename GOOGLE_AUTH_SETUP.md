# 🔐 Configuración Google Auth para Vercel

## 📋 Pasos para configurar Google Console

### 1. Ir a Google Cloud Console
- https://console.cloud.google.com/
- Seleccionar tu proyecto CASIRA

### 2. APIs & Services → Credentials
- Buscar tu Client ID: `245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com`
- Hacer clic en "Edit" (ícono de lápiz)

### 3. Authorized JavaScript Origins
Agregar estas URLs:
```
https://tu-proyecto.vercel.app
https://tu-proyecto-git-main-tu-usuario.vercel.app  
```

### 4. Authorized Redirect URIs
Agregar estas URLs:
```
https://tu-proyecto.vercel.app
https://tu-proyecto.vercel.app/
https://tu-proyecto.vercel.app/login
https://tu-proyecto.vercel.app/dashboard
```

## 🔧 Tu Google Client ID actual:
```
245143519733-gsban2kdl7s8o2k57rsch8uf7cnr0qj5.apps.googleusercontent.com
```

## ⚠️ IMPORTANTE:
1. Reemplaza `tu-proyecto` con tu URL real de Vercel
2. Guarda los cambios en Google Console
3. Espera 5-10 minutos para que se propaguen los cambios
4. Prueba el login nuevamente

## 🔍 Para encontrar tu URL de Vercel:
- Ve a tu dashboard de Vercel
- Busca tu proyecto "casira-connect-frontend"
- Copia la URL exacta del deployment