# 🔄 Sistema de Notificaciones de Cambio de Rol - CASIRA Connect

## 📋 Resumen

Este sistema permite que cuando un administrador cambie el rol de un usuario, se envíe una notificación al usuario afectado que debe aceptar antes de que el cambio se aplique. Incluye:

- ✅ **Notificaciones persistentes**: Los cambios se guardan en base de datos
- ✅ **Notificaciones al login**: Aparecen cuando el usuario inicia sesión
- ✅ **Confirmación requerida**: El usuario debe aceptar o rechazar
- ✅ **Tiempo real**: Si el usuario está online, ve la notificación inmediatamente
- ✅ **Prevención de bucles**: Sistema robusto sin bucles infinitos
- ✅ **Expiración automática**: Los cambios expiran en 7 días si no se aceptan

## 🚀 Pasos de Implementación

### 1. Ejecutar Script SQL en Supabase

Primero, ejecuta el archivo `pending_role_changes.sql` en tu consola de Supabase:

```sql
-- El contenido del archivo pending_role_changes.sql
-- Esto creará las tablas y funciones necesarias
```

### 2. Archivos ya Integrados

Los siguientes archivos ya han sido creados e integrados:

#### 📄 Servicios
- `apps/web/src/lib/services/pending-role-change.service.js` - Servicio principal
- `apps/web/src/lib/services/enhanced-admin.service.js` - Servicio de admin mejorado

#### 📄 Componentes
- `apps/web/src/components/PendingRoleChangeModal.jsx` - Modal de notificaciones
- `apps/web/src/hooks/usePendingRoleChanges.js` - Hook personalizado

#### 📄 Integración
- `apps/web/src/App.jsx` - Ya incluye PendingRoleChangeModal
- `apps/web/src/lib/services/admin.service.js` - Ya modificado para crear notificaciones

## 📝 Cómo Funciona

### Flujo Actual (Sin Cambios):
1. Admin hace clic en cambiar rol
2. Se cambia inmediatamente
3. Usuario ve modal de confirmación (opcional)

### Nuevo Flujo (Con Notificaciones):
1. Admin hace clic en cambiar rol
2. **SE CREA NOTIFICACIÓN PENDIENTE** en lugar de cambio directo
3. Usuario recibe notificación (inmediata si está online)
4. Usuario debe **ACEPTAR** para que se aplique el cambio
5. Solo cuando acepta, se ejecuta el cambio de rol real

## 🔧 Personalización

### Cambiar Tiempo de Expiración

En `pending_role_changes.sql`, línea 8:
```sql
expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
```

### Cambiar Mensajes de Notificación

En `pending-role-change.service.js`, método `_createPendingChangeNotification()`:
```javascript
const title = `${roleEmojis[pendingChange.new_role]} Cambio de rol pendiente`;
const message = `Un administrador quiere cambiar tu rol...`;
```

### Forzar Cambio Inmediato

Si necesitas el comportamiento anterior (cambio inmediato), usa:
```javascript
adminService.updateUserRole(userId, newRole, message, true); // true = forceImmediate
```

## 🧪 Cómo Probar

### 1. Crear Usuario de Prueba
1. Registra un usuario con rol "visitor"
2. Desde admin, intenta cambiar su rol a "volunteer"

### 2. Verificar Notificación
1. Deberías ver mensaje: "Cambio de rol enviado al usuario para confirmación"
2. El rol NO debería cambiar inmediatamente

### 3. Login como Usuario Afectado
1. Inicia sesión con el usuario afectado
2. Deberías ver el modal de notificación pendiente
3. Acepta o rechaza el cambio

### 4. Verificar Cambio
1. Si aceptaste, el rol debería cambiar
2. Si rechazaste, el rol se mantiene igual

## 🛠️ Solución de Problemas

### No aparece la notificación
1. Verifica que la tabla `pending_role_changes` exista en Supabase
2. Revisa la consola del navegador para errores
3. Verifica que el componente `PendingRoleChangeModal` esté en App.jsx

### El cambio se aplica inmediatamente
1. Verifica que el parámetro `forceImmediate` no esté en `true`
2. Revisa que no haya errores en la creación del cambio pendiente
3. Verifica los logs en la consola

### Error de permisos en Supabase
1. Verifica que las políticas RLS estén aplicadas correctamente
2. Asegúrate de que el usuario tenga rol 'admin' en la tabla users

## 📊 Estructura de Base de Datos

### Tabla: `pending_role_changes`
- `id` - UUID único
- `user_id` - Usuario afectado
- `admin_id` - Administrador que hizo el cambio
- `old_role` - Rol anterior
- `new_role` - Nuevo rol propuesto
- `status` - 'pending', 'accepted', 'rejected', 'expired'
- `message` - Mensaje del administrador
- `created_at` - Fecha de creación
- `expires_at` - Fecha de expiración (7 días)

### Funciones SQL Disponibles
- `create_pending_role_change()` - Crear cambio pendiente
- `accept_role_change()` - Aceptar cambio
- `reject_role_change()` - Rechazar cambio
- `get_user_pending_role_changes()` - Obtener cambios del usuario
- `cleanup_expired_role_changes()` - Limpiar cambios expirados

## 🔄 Eventos del Sistema

### Eventos Disparados
- `pending-role-change-created` - Nuevo cambio pendiente
- `pending-role-changes-found` - Cambios encontrados al login
- `role-change-accepted` - Cambio aceptado
- `role-change-rejected` - Cambio rechazado

### Eventos Escuchados
- Los componentes escuchan estos eventos para actualizar la UI automáticamente

## 📈 Beneficios

1. **Transparencia**: El usuario sabe cuándo y por qué cambia su rol
2. **Control**: El usuario puede rechazar cambios no deseados
3. **Auditoria**: Todos los cambios quedan registrados
4. **Flexibilidad**: Se puede forzar cambio inmediato si es necesario
5. **Robustez**: Sistema sin bucles infinitos
6. **Experiencia**: Notificaciones en tiempo real y al login

## 🎯 Próximos Pasos

1. Ejecutar el SQL en Supabase
2. Probar el flujo completo
3. Ajustar mensajes si es necesario
4. Implementar en producción

¡El sistema está listo para usar! 🚀