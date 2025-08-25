# API Documentation - CASIRA Connect

## Descripción General

La API de CASIRA Connect está desarrollada con Flask y proporciona endpoints RESTful para gestionar usuarios, proyectos, posts sociales y estadísticas de impacto. Actualmente utiliza datos simulados para demostración, pero está preparada para integrarse con Supabase.

## Base URL

- **Desarrollo**: `http://localhost:5000`
- **Producción**: `https://j6h5i7cpjd18.manus.space`

## Autenticación

*Actualmente la API no requiere autenticación, pero está preparada para implementar JWT tokens con Supabase.*

## Endpoints Disponibles

### 🏗️ Proyectos

#### GET /api/projects/featured
Obtiene los proyectos destacados para mostrar en la landing page.

**Respuesta:**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Nueva Biblioteca en San Juan",
      "description": "Gracias a nuestros donantes, 300 niños ahora tienen acceso a libros y tecnología",
      "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
      "status": "completed",
      "progress_percentage": 100,
      "location": "San Juan Palencia, Guatemala",
      "visibility": "public"
    }
  ]
}
```

#### GET /api/projects/stats
Obtiene estadísticas generales de los proyectos realizados.

**Respuesta:**
```json
{
  "stats": {
    "total_projects": 15,
    "completed_projects": 12,
    "active_projects": 3,
    "total_beneficiaries": 2500,
    "communities_impacted": 8,
    "success_rate": 95
  }
}
```

### 👥 Usuarios

#### GET /api/users/sample
Obtiene usuarios de ejemplo para demostración del sistema.

**Respuesta:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@casira.org",
      "first_name": "Administrador",
      "last_name": "CASIRA",
      "role": "admin",
      "bio": "Administrador principal de la plataforma CASIRA Connect"
    }
  ]
}
```

### 📱 Posts Sociales

#### GET /api/posts/sample
Obtiene posts de ejemplo para el timeline social.

**Respuesta:**
```json
{
  "posts": [
    {
      "id": 1,
      "content": "¡Inauguramos la nueva biblioteca en San Juan! 300 niños ahora tienen acceso a libros y tecnología moderna.",
      "image_url": "https://example.com/image.jpg",
      "author": {
        "first_name": "María",
        "last_name": "González"
      },
      "created_at": "2024-03-15T10:30:00Z",
      "likes_count": 24,
      "comments_count": 8,
      "shares_count": 5
    }
  ]
}
```

## Estructura de Datos

### Proyecto
```typescript
interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string;
  status: 'active' | 'completed' | 'planned';
  progress_percentage: number;
  location: string;
  visibility: 'public' | 'private';
  created_at?: string;
  updated_at?: string;
}
```

### Usuario
```typescript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'donor' | 'volunteer' | 'user';
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}
```

### Post Social
```typescript
interface Post {
  id: number;
  content: string;
  image_url?: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}
```

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos de entrada inválidos
- `401 Unauthorized` - Autenticación requerida
- `403 Forbidden` - Permisos insuficientes
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

## Manejo de Errores

Todos los errores devuelven un JSON con el siguiente formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": "Información adicional (opcional)"
  }
}
```

## Próximas Implementaciones

### Autenticación JWT
```typescript
// Headers requeridos para endpoints protegidos
Authorization: Bearer <jwt_token>
```

### CRUD Completo para Proyectos
- `POST /api/projects` - Crear proyecto
- `PUT /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto

### Sistema de Posts Sociales
- `POST /api/posts` - Crear post
- `PUT /api/posts/:id` - Actualizar post
- `DELETE /api/posts/:id` - Eliminar post
- `POST /api/posts/:id/like` - Dar/quitar like
- `POST /api/posts/:id/comment` - Agregar comentario

### Gestión de Usuarios
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/users/profile` - Perfil de usuario
- `PUT /api/users/profile` - Actualizar perfil

## Integración con Supabase

La API está preparada para integrarse con Supabase utilizando:

- **Autenticación**: Supabase Auth
- **Base de datos**: PostgreSQL
- **Storage**: Supabase Storage para imágenes
- **Real-time**: Suscripciones en tiempo real

### Configuración de Variables de Entorno

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

## Ejemplos de Uso

### JavaScript/Fetch
```javascript
// Obtener proyectos destacados
const response = await fetch('https://j6h5i7cpjd18.manus.space/api/projects/featured');
const data = await response.json();
console.log(data.projects);
```

### Python/Requests
```python
import requests

# Obtener estadísticas
response = requests.get('https://j6h5i7cpjd18.manus.space/api/projects/stats')
data = response.json()
print(data['stats'])
```

### cURL
```bash
# Obtener usuarios de ejemplo
curl -X GET https://j6h5i7cpjd18.manus.space/api/users/sample
```

## Notas de Desarrollo

- La API incluye CORS habilitado para todas las rutas
- Los datos actuales son simulados para demostración
- La estructura está preparada para escalamiento con base de datos real
- Todos los endpoints devuelven JSON
- El servidor usa Gunicorn en producción

## Testing

Para probar la API localmente:

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor de desarrollo
python app.py

# La API estará disponible en http://localhost:5000
```

## Contacto y Soporte

Para consultas sobre la API:
- **Desarrollador**: Marlon Agusto Morales
- **Email**: soporte-tecnico@casira.org
- **Documentación**: Ver carpeta `docs/`
- **Issues**: Contactar al desarrollador