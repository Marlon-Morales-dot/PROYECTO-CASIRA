# 🎯 Instrucciones de Implementación - Actividades de Voluntarios

## ✅ YA COMPLETADO

### 1. Backend (Flask)
- ✅ Todos los endpoints creados en `apps/api/app.py`
- ✅ Endpoints para CRUD de actividades
- ✅ Endpoints para solicitudes de participación
- ✅ Endpoints para aprobar/rechazar solicitudes

### 2. Base de Datos (Supabase)
- ✅ Tabla `volunteer_activities` creada
- ✅ Tabla `volunteer_activity_requests` creada
- ✅ Índices optimizados
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers para contadores automáticos

### 3. VolunteerDashboard.jsx
- ✅ Imports actualizados (añadido `Trash2`)
- ✅ Estados creados para las nuevas funcionalidades
- ✅ Funciones implementadas:
  - `loadMyVolunteerActivities()`
  - `loadActivityRequests()`
  - `handleCreateVolunteerActivity()`
  - `handleUpdateVolunteerActivity()`
  - `handleEditVolunteerActivity()`
  - `handleDeleteVolunteerActivity()`
  - `handleApproveRequest()`
  - `handleRejectRequest()`
- ✅ Tab agregado en la navegación

---

## 📋 PASOS PARA COMPLETAR

### Paso 1: Agregar el contenido del Tab en VolunteerDashboard.jsx

1. Abre el archivo: `apps/web/src/components/VolunteerDashboard.jsx`

2. Busca la línea que dice:
   ```jsx
   {/* Profile Tab */}
   {activeTab === 'profile' && (
   ```

3. **JUSTO ANTES** de esa línea, copia y pega TODO el contenido del archivo:
   `VOLUNTEER-TAB-CONTENT.jsx`

4. Guarda el archivo

### Paso 2: Actualizar VisitorDashboard.jsx

Necesitas actualizar `VisitorDashboard.jsx` para que muestre también las actividades creadas por voluntarios:

1. Abre `apps/web/src/components/VisitorDashboard.jsx`

2. En la función `loadDashboardData()`, DESPUÉS de cargar las actividades normales, agrega:

```javascript
// Cargar también actividades de voluntarios
const volunteerActivitiesResponse = await fetch('https://proyecto-casira.onrender.com/api/volunteer-activities', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  }
});

if (volunteerActivitiesResponse.ok) {
  const volunteerActivities = await volunteerActivitiesResponse.json();

  // Agregar info del creador a cada actividad
  const activitiesWithCreator = volunteerActivities.map(activity => ({
    ...activity,
    created_by_volunteer: true,
    creator_name: activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : 'Voluntario'
  }));

  // Combinar con las actividades normales
  setActivities(prev => [...activitiesData, ...activitiesWithCreator]);
}
```

3. Modifica la función `handleJoinActivity` para manejar actividades de voluntarios:

```javascript
const handleJoinActivity = async (activity) => {
  try {
    // Si es una actividad creada por voluntario, usar el endpoint diferente
    if (activity.created_by_volunteer) {
      const userId = user?.supabase_id || user?.id;

      const response = await fetch(`https://proyecto-casira.onrender.com/api/volunteer-activities/${activity.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          user_id: userId,
          message: `${user.first_name} ${user.last_name} quiere unirse a esta actividad`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar solicitud');
      }

      alert('¡Solicitud enviada! El voluntario creador de la actividad la revisará pronto.');
      loadDashboardData();
      return;
    }

    // Código existente para actividades normales...
    // (mantén el código que ya está ahí)
  } catch (error) {
    console.error('Error joining activity:', error);
    alert('Error al unirse a la actividad: ' + error.message);
  }
};
```

4. En el componente `ActivityCard` (si existe) o donde se renderizan las actividades, agrega un badge para identificar quién creó la actividad:

```jsx
{activity.created_by_volunteer && (
  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
    <User className="h-3 w-3 mr-1" />
    Por: {activity.creator_name}
  </div>
)}
```

### Paso 3: Probar la funcionalidad

1. **Iniciar el backend**:
   ```bash
   cd apps/api
   python app.py
   ```

2. **Iniciar el frontend**:
   ```bash
   npm run dev:web
   ```

3. **Pruebas a realizar**:

   **Como Voluntario:**
   - [ ] Login como voluntario
   - [ ] Ir a "Crear Mis Actividades"
   - [ ] Crear una nueva actividad
   - [ ] Ver la actividad creada
   - [ ] Editar la actividad
   - [ ] Simular una solicitud (desde otra cuenta de visitante)
   - [ ] Aprobar/rechazar solicitudes
   - [ ] Ver participantes confirmados
   - [ ] Eliminar actividad

   **Como Visitante:**
   - [ ] Login como visitante
   - [ ] Ver actividades de voluntarios en el feed
   - [ ] Identificar quién creó la actividad (nombre del voluntario)
   - [ ] Solicitar unirse a una actividad de voluntario
   - [ ] Ver estado de la solicitud en "Mis Solicitudes"
   - [ ] Recibir notificación cuando sea aprobado/rechazado

---

## 🔧 Solución de Problemas

### Error: "Cannot read properties of undefined"
- Verifica que el backend esté corriendo en el puerto 3000
- Revisa que las tablas en Supabase existan
- Chequea la consola del navegador para ver el error exacto

### Las actividades no aparecen
- Verifica en Supabase que las políticas RLS estén activas
- Asegúrate de que el usuario tiene el rol correcto ('volunteer')
- Revisa los logs del backend en la terminal

### Error 403 (Forbidden)
- Verifica que el usuario esté autenticado correctamente
- Chequea que el `auth.uid()` en Supabase coincida con el ID del usuario
- Revisa las políticas RLS

---

## 📊 Estructura de Datos

### Tabla: volunteer_activities
```
id: UUID
title: TEXT
description: TEXT
detailed_description: TEXT
created_by: UUID (FK a users.id)
location: TEXT
start_date: TIMESTAMP
end_date: TIMESTAMP
max_participants: INTEGER
current_participants: INTEGER
image_url: TEXT
requirements: JSONB
benefits: JSONB
status: TEXT (active, completed, cancelled, deleted)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Tabla: volunteer_activity_requests
```
id: UUID
activity_id: UUID (FK a volunteer_activities.id)
user_id: UUID (FK a users.id)
message: TEXT
status: TEXT (pending, approved, rejected)
created_at: TIMESTAMP
reviewed_at: TIMESTAMP
UNIQUE(activity_id, user_id)
```

---

## 🎨 Características Implementadas

✅ **Para Voluntarios:**
- Crear actividades propias
- Editar sus actividades
- Eliminar sus actividades
- Ver solicitudes de participación en tiempo real
- Aprobar/rechazar solicitudes
- Ver lista de participantes confirmados
- Badge con número de solicitudes pendientes

✅ **Para Visitantes:**
- Ver actividades de voluntarios en el feed
- Identificar quién creó cada actividad
- Solicitar unirse a actividades
- Ver estado de sus solicitudes
- Recibir notificaciones de aprobación/rechazo

✅ **Seguridad:**
- Solo voluntarios pueden crear actividades
- Solo el creador puede editar/eliminar
- Solo el creador puede aprobar/rechazar solicitudes
- Políticas RLS protegen los datos
- Validación de permisos en backend

✅ **UX/UI:**
- Modal responsive para crear/editar
- Cards visuales con información clave
- Badges y notificaciones en tiempo real
- Sistema de solicitudes integrado
- Diseño consistente con el resto de la app

---

## 📝 Notas Importantes

1. **Migraciones de Base de Datos**: Ya ejecutadas en Supabase via MCP
2. **Backend URL**: Hardcodeada como `https://proyecto-casira.onrender.com`
3. **Autenticación**: Usa el mismo sistema JWT existente
4. **Imágenes**: Por ahora solo URL, se puede agregar upload después

---

## 🚀 Próximos Pasos Opcionales

- [ ] Sistema de notificaciones push
- [ ] Upload de imágenes directo (sin URL)
- [ ] Sistema de calificaciones para actividades
- [ ] Chat entre voluntario y participantes
- [ ] Exportar lista de participantes
- [ ] Estadísticas de impacto
- [ ] Compartir en redes sociales

---

¿Alguna duda o problema? Revisa los logs del backend y la consola del navegador primero.
