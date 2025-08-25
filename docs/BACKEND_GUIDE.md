# Backend Guide - CASIRA Connect

## 🎯 Descripción General

El backend de CASIRA Connect está desarrollado con **Flask 3.1.1**, proporcionando una API REST sólida y escalable. Está diseñado para ser simple pero poderoso, con capacidad de integración con Supabase y despliegue en múltiples plataformas.

## 🛠️ Tecnologías Utilizadas

### Framework Principal
- **Flask**: 3.1.1 (Framework web minimalista)
- **Flask-CORS**: 6.0.0 (Cross-Origin Resource Sharing)

### Servidor de Producción
- **Gunicorn**: 21.2.0 (WSGI HTTP Server)

### Base de Datos
- **Supabase**: PostgreSQL con funcionalidades adicionales
- **Datos Simulados**: Para desarrollo y testing

### Deployment
- **Render**: Usando render.yaml y Procfile
- **Vercel**: Con vercel.json
- **Supabase**: Fullstack deployment

## 📁 Estructura del Proyecto

```
backend/
├── src/                      # Código fuente (opcional)
│   └── main.py              # Alternativa al app.py
├── venv/                    # Entorno virtual Python
├── app.py                   # Aplicación principal Flask
├── app_supabase.py          # Versión con integración Supabase
├── requirements.txt         # Dependencias principales
├── requirements_simple.txt  # Dependencias mínimas
├── requirements_supabase.txt # Dependencias con Supabase
├── Procfile                 # Configuración para Render
├── render.yaml             # Configuración de servicios Render
├── runtime.txt             # Versión de Python
└── vercel.json             # Configuración para Vercel
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Python** >= 3.8
- **pip** (Python package manager)

### 1. Crear Entorno Virtual
```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. Instalar Dependencias
```bash
# Instalación básica
pip install -r requirements.txt

# Para desarrollo con Supabase
pip install -r requirements_supabase.txt

# Solo dependencias esenciales
pip install -r requirements_simple.txt
```

### 3. Variables de Entorno
Crear archivo `.env` en la raíz del backend:
```env
# Configuración de Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=tu_secret_key_super_seguro_aqui

# URLs de la aplicación
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Configuración de Supabase (opcional)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Base de datos (cuando se implemente)
DATABASE_URL=postgresql://user:password@localhost:5432/casira_db
```

### 4. Ejecutar Servidor de Desarrollo
```bash
# Usando Python directamente
python app.py

# Usando Flask CLI
flask run

# Con Gunicorn (producción)
gunicorn app:app
```

El servidor estará disponible en: `http://localhost:5000`

## 🏗️ Arquitectura del Servidor

### Aplicación Principal (app.py)
```python
from flask import Flask, request, jsonify
from flask_cors import CORS

# Crear aplicación Flask
app = Flask(__name__)
CORS(app, origins=["*"])  # Configurar CORS

# Datos simulados para desarrollo
SAMPLE_DATA = {
    "users": [...],
    "projects": [...],
    "posts": [...]
}

# Rutas de la API
@app.route('/api/projects/featured', methods=['GET'])
def get_featured_projects():
    return jsonify({"projects": SAMPLE_DATA["projects"][:3]})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

## 📡 Endpoints de la API

### 🏗️ Proyectos

#### GET /api/projects/featured
Obtiene los 3 proyectos más destacados.

**Respuesta:**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Nueva Biblioteca en San Juan",
      "description": "300 niños con acceso a libros y tecnología",
      "image_url": "https://images.unsplash.com/...",
      "status": "completed",
      "progress_percentage": 100,
      "location": "San Juan Palencia, Guatemala",
      "visibility": "public"
    }
  ]
}
```

#### GET /api/projects/stats
Obtiene estadísticas generales de impacto.

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
Obtiene usuarios de ejemplo para el sistema.

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
      "bio": "Administrador principal de CASIRA Connect"
    }
  ]
}
```

### 📱 Posts Sociales

#### GET /api/posts/sample
Obtiene posts de ejemplo para el timeline.

**Respuesta:**
```json
{
  "posts": [
    {
      "id": 1,
      "content": "¡Inauguramos la nueva biblioteca en San Juan!",
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

## 🗄️ Gestión de Datos

### Datos Simulados (Desarrollo)
El servidor actual utiliza datos hardcoded para demostración:

```python
SAMPLE_DATA = {
    "users": [
        # Lista de usuarios de ejemplo
    ],
    "projects": [
        # Lista de proyectos de ejemplo
    ],
    "posts": [
        # Lista de posts de ejemplo
    ]
}
```

### Integración con Supabase (Producción)
Para datos reales, usar `app_supabase.py`:

```python
from supabase import create_client, Client
import os

# Configurar cliente Supabase
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Ejemplo de consulta
@app.route('/api/projects/real', methods=['GET'])
def get_real_projects():
    try:
        response = supabase.table('projects').select('*').execute()
        return jsonify({"projects": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

## 🔐 Seguridad y Autenticación

### CORS Configuration
```python
# Configuración actual (desarrollo)
CORS(app, origins=["*"])

# Configuración recomendada (producción)
CORS(app, origins=[
    "http://localhost:5173",  # Desarrollo
    "https://casira-connect.vercel.app",  # Producción
    "https://casira.org"  # Dominio oficial
])
```

### Autenticación JWT (Próxima implementación)
```python
from flask_jwt_extended import JWTManager, jwt_required, create_access_token

# Configurar JWT
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
jwt = JWTManager(app)

# Endpoint protegido
@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    return jsonify({"message": "Acceso autorizado"})
```

## 📊 Logging y Monitoreo

### Configurar Logging
```python
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Usar en endpoints
@app.route('/api/projects/featured', methods=['GET'])
def get_featured_projects():
    logger.info("Fetching featured projects")
    try:
        # Lógica del endpoint
        return jsonify({"projects": data})
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
```

### Health Check Endpoint
```python
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })
```

## 🚀 Despliegue

### 1. Render (Recomendado para Backend)

**render.yaml:**
```yaml
services:
  - type: web
    name: casira-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app:app"
    plan: free
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

**Procfile:**
```
web: gunicorn app:app
```

### 2. Vercel (Serverless)

**vercel.json:**
```json
{
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}
```

### 3. Supabase (Fullstack)
1. Crear proyecto en Supabase
2. Importar `supabase-schema.sql`
3. Usar `app_supabase.py`
4. Configurar variables de entorno

## 🔧 Configuración de Producción

### Gunicorn Configuration
```python
# gunicorn.conf.py
bind = "0.0.0.0:5000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
timeout = 30
```

### Environment Variables en Producción
```bash
# Render/Vercel
FLASK_ENV=production
SECRET_KEY=super_secure_production_key
SUPABASE_URL=https://...
FRONTEND_URL=https://casira-connect.vercel.app
```

## 🧪 Testing

### Tests Básicos
```python
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_featured_projects(client):
    response = client.get('/api/projects/featured')
    assert response.status_code == 200
    assert 'projects' in response.json

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
```

### Ejecutar Tests
```bash
pip install pytest
pytest tests/
```

## 🔍 Debugging

### Debug Mode
```python
# Activar debug en desarrollo
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### Logs de Desarrollo
```python
import sys
import logging

# Configurar logging detallado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)
```

## 📚 Dependencias Detalladas

### requirements.txt
```text
Flask==3.1.1              # Framework web
flask-cors==6.0.0          # CORS support
gunicorn==21.2.0           # WSGI server
```

### requirements_supabase.txt
```text
Flask==3.1.1
flask-cors==6.0.0
gunicorn==21.2.0
supabase==2.0.0            # Cliente Supabase
python-dotenv==1.0.0       # Variables de entorno
```

## 🛠️ Troubleshooting

### Problemas Comunes

**Puerto en uso:**
```bash
# Buscar proceso usando puerto 5000
lsof -i :5000
# Matar proceso
kill -9 <PID>
```

**Error de importaciones:**
```bash
# Activar entorno virtual
source venv/bin/activate
# Reinstalar dependencias
pip install -r requirements.txt
```

**CORS errors:**
```python
# Verificar configuración CORS
CORS(app, origins=["http://localhost:5173"])
```

**Variables de entorno no funcionan:**
```bash
# Instalar python-dotenv
pip install python-dotenv

# En app.py
from dotenv import load_dotenv
load_dotenv()
```

## 🔄 Próximas Implementaciones

### Base de Datos Real
- Integración completa con Supabase
- Modelos de datos estructurados
- Migraciones automáticas

### Autenticación
- JWT tokens
- Roles y permisos
- Registro/login de usuarios

### API Completa
- CRUD para todos los recursos
- Validación de datos
- Rate limiting

### Monitoreo
- Métricas de performance
- Error tracking
- Health checks avanzados

## 📞 Soporte y Contribución

### Contacto Técnico
- **Email**: backend-team@casira.org
- **GitHub Issues**: [repository-url]/issues

### Contribuir
1. Fork del repositorio
2. Crear entorno virtual: `python -m venv venv`
3. Instalar dependencias: `pip install -r requirements.txt`
4. Crear branch: `git checkout -b feature/nueva-api`
5. Desarrollar siguiendo PEP 8
6. Escribir tests
7. Commit: `git commit -m "feat: nuevo endpoint para usuarios"`
8. Push y crear Pull Request

¡Gracias por contribuir al backend de CASIRA Connect! 🚀