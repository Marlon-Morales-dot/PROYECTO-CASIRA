# 🔐 CASIRA Connect - Credenciales de Acceso

## 📋 Sistema Unificado de Autenticación

Tu aplicación ahora tiene **autenticación real** que valida contraseñas específicas y se conecta a Supabase.

## 🔑 Credenciales de Usuarios

### **SOLO 3 ROLES: Admin, Volunteer, Visitor**

### **👑 Administrador Principal**
- **Email**: `admin@casira.org`
- **Contraseña**: `admin123`
- **Rol**: **Admin** (puede crear/editar/eliminar actividades + cambiar roles de usuarios)

### **🤝 Usuario Voluntario**
- **Email**: `carlos.martinez@email.com`
- **Contraseña**: ` `
- **Rol**: **Volunteer** (puede participar y subir fotos)

### **👥 Usuario Visitante**
- **Email**: `ana.lopez@email.com`
- **Contraseña**: `ana123`
- **Rol**: **Visitor** (puede ver y comentar actividades)

### **🔐 Contraseñas por Defecto**
Para usuarios nuevos o de demo: `demo123` o `casira123`

### **📧 Usuarios de Google**
- **Por defecto**: Todos los usuarios de Google ingresan como **Visitor**
- **Cambio de rol**: Solo el admin puede cambiar roles visitor → volunteer → admin

## 🔧 ¿Qué se arregló?

### **1. Validación Real de Contraseñas**
- ❌ **Antes**: Cualquier contraseña funcionaba
- ✅ **Ahora**: Solo contraseñas específicas por usuario

### **2. Conexión a Supabase**
- ❌ **Antes**: Solo localStorage (datos locales)
- ✅ **Ahora**: Sistema híbrido Supabase + localStorage

### **3. Unificación Google + CASIRA**
- ❌ **Antes**: Sistemas separados
- ✅ **Ahora**: Usuarios Google se sincronizan con Supabase

### **4. AdminDashboard Funcional**
- ❌ **Antes**: Cambios no se guardaban realmente
- ✅ **Ahora**: CRUD real en Supabase con validación

## 🧪 Cómo Probar

### **Probar Autenticación:**
1. Ve a `/login`
2. Usa: `admin@casira.org` / `admin123`
3. Verifica que rechace contraseñas incorrectas

### **Probar Funciones de Admin:**
1. Logueate como admin
2. Ve a `/admin`
3. Crea una nueva actividad
4. Edita una actividad existente  
5. Elimina una actividad
6. Verifica que los cambios persistan al recargar

### **Probar Google Auth:**
1. Click en "Iniciar con Google"
2. Verifica que el usuario se guarde en Supabase
3. Verifica sincronización entre sistemas

## 🔍 Arquitectura Final

```
┌─ Usuario ─┐    ┌─ Auth Service ─┐    ┌─ Supabase ─┐
│           │◄──►│ (Unificado)    │◄──►│ PostgreSQL │
│ Login     │    │ • Validación   │    │ Real-time  │
│ Google    │    │ • Sincronización│   │ Auth       │
└───────────┘    └────────────────┘    └────────────┘
                          │
                          ▼
                 ┌─ LocalStorage ─┐
                 │ (Fallback)     │
                 └────────────────┘
```

## ⚠️ Importante

- **Solo admin@casira.org** puede crear/editar/eliminar actividades
- Los cambios ahora se guardan **permanentemente** en Supabase
- El sistema funciona online/offline con sincronización automática
- Usuarios Google se unifican automáticamente con usuarios CASIRA

## 🛠️ Próximos Pasos

Si quieres agregar más usuarios:
1. Edita `validatePassword()` en `auth.service.js`
2. Agrega el email y contraseña al objeto `userPasswords`

¡Tu sistema ahora está **completamente conectado y funcional**! 🎉