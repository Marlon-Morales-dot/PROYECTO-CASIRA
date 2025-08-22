from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app, origins=["*"])

# Configuración de Supabase (variables de entorno)
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'your-anon-key')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'your-service-key')

# Headers para Supabase
def get_supabase_headers(use_service_key=False):
    key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    return {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

# Datos simulados para fallback
SAMPLE_DATA = {
    "users": [
        {
            "id": 1,
            "email": "admin@casira.org",
            "first_name": "Administrador",
            "last_name": "CASIRA",
            "role": "admin",
            "bio": "Administrador principal de la plataforma CASIRA Connect"
        },
        {
            "id": 2,
            "email": "donante@ejemplo.com",
            "first_name": "María",
            "last_name": "González",
            "role": "donor",
            "bio": "Empresaria comprometida con la educación en Guatemala"
        }
    ],
    "projects": [
        {
            "id": 1,
            "title": "Nueva Biblioteca en San Juan",
            "description": "Gracias a nuestros donantes, 300 niños ahora tienen acceso a libros y tecnología",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
            "status": "completed",
            "progress_percentage": 100,
            "location": "San Juan Palencia, Guatemala",
            "visibility": "public",
            "created_at": "2024-08-01T10:00:00Z"
        },
        {
            "id": 2,
            "title": "Laboratorio de Ciencias Renovado",
            "description": "El Liceo San Francisco ahora cuenta con equipamiento moderno para experimentos",
            "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500",
            "status": "active",
            "progress_percentage": 85,
            "location": "Liceo San Francisco de Asís",
            "visibility": "public",
            "created_at": "2024-08-10T14:30:00Z"
        },
        {
            "id": 3,
            "title": "Centro Comunitario Construido",
            "description": "Un espacio de encuentro que fortalece los lazos de toda la comunidad",
            "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
            "status": "active",
            "progress_percentage": 60,
            "location": "Palencia, Guatemala",
            "visibility": "public",
            "created_at": "2024-08-15T09:15:00Z"
        }
    ],
    "posts": [
        {
            "id": 1,
            "content": "¡Increíble progreso en la biblioteca! Los niños ya están usando los nuevos libros y computadoras. Gracias a todos los constructores de sueños que hicieron esto posible.",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
            "user_id": 1,
            "project_id": 1,
            "visibility": "public",
            "status": "published",
            "likes_count": 45,
            "comments_count": 12,
            "shares_count": 8,
            "created_at": "2024-08-15T10:30:00Z",
            "author": {
                "id": 1,
                "first_name": "Administrador",
                "last_name": "CASIRA",
                "role": "admin"
            }
        },
        {
            "id": 2,
            "content": "El laboratorio de ciencias está tomando forma. Los estudiantes podrán realizar experimentos que antes solo veían en libros. ¡La educación está transformándose!",
            "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500",
            "user_id": 1,
            "project_id": 2,
            "visibility": "public",
            "status": "published",
            "likes_count": 32,
            "comments_count": 8,
            "shares_count": 5,
            "created_at": "2024-08-18T14:15:00Z",
            "author": {
                "id": 1,
                "first_name": "Administrador",
                "last_name": "CASIRA",
                "role": "admin"
            }
        }
    ]
}

# Función para interactuar con Supabase
def supabase_request(method, table, data=None, filters=None):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        headers = get_supabase_headers()
        
        if filters:
            params = "&".join([f"{k}=eq.{v}" for k, v in filters.items()])
            url += f"?{params}"
        
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        
        if response.status_code < 400:
            return response.json()
        else:
            print(f"Supabase error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Supabase connection error: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    # Verificar conexión con Supabase
    supabase_status = "connected" if supabase_request('GET', 'users') is not None else "disconnected"
    
    return jsonify({
        'status': 'healthy',
        'message': 'CASIRA Connect API funcionando correctamente',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'supabase_status': supabase_status,
        'environment': os.environ.get('FLASK_ENV', 'development')
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        # Intentar autenticación con Supabase
        auth_data = {
            "email": data['email'],
            "password": data['password']
        }
        
        auth_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=get_supabase_headers(),
            json=auth_data
        )
        
        if auth_response.status_code == 200:
            auth_result = auth_response.json()
            user_data = auth_result.get('user', {})
            
            return jsonify({
                'message': 'Inicio de sesión exitoso',
                'user': {
                    'id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'first_name': user_data.get('user_metadata', {}).get('first_name', ''),
                    'last_name': user_data.get('user_metadata', {}).get('last_name', ''),
                    'role': user_data.get('user_metadata', {}).get('role', 'visitor')
                },
                'access_token': auth_result.get('access_token')
            }), 200
        else:
            # Fallback a datos simulados
            user = None
            for u in SAMPLE_DATA['users']:
                if u['email'] == data['email']:
                    user = u
                    break
            
            if not user:
                return jsonify({'error': 'Credenciales inválidas'}), 401
            
            # Token simulado
            token = f"fake_token_{user['id']}"
            
            return jsonify({
                'message': 'Inicio de sesión exitoso (modo demo)',
                'user': user,
                'access_token': token
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} es requerido'}), 400
        
        # Intentar registro con Supabase
        auth_data = {
            "email": data['email'],
            "password": data['password'],
            "data": {
                "first_name": data['first_name'],
                "last_name": data['last_name'],
                "role": data.get('role', 'visitor')
            }
        }
        
        auth_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers=get_supabase_headers(),
            json=auth_data
        )
        
        if auth_response.status_code == 200:
            auth_result = auth_response.json()
            user_data = auth_result.get('user', {})
            
            return jsonify({
                'message': 'Usuario registrado exitosamente',
                'user': {
                    'id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': data.get('role', 'visitor')
                },
                'access_token': auth_result.get('access_token')
            }), 201
        else:
            # Fallback a datos simulados
            new_user = {
                'id': len(SAMPLE_DATA['users']) + 1,
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data.get('role', 'visitor'),
                'bio': data.get('bio'),
                'created_at': datetime.utcnow().isoformat()
            }
            
            SAMPLE_DATA['users'].append(new_user)
            
            # Token simulado
            token = f"fake_token_{new_user['id']}"
            
            return jsonify({
                'message': 'Usuario registrado exitosamente (modo demo)',
                'user': new_user,
                'access_token': token
            }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['GET'])
def get_posts():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Intentar obtener de Supabase
        posts_data = supabase_request('GET', 'posts')
        
        if posts_data is not None:
            posts = posts_data
        else:
            # Fallback a datos simulados
            posts = SAMPLE_DATA['posts']
        
        return jsonify({
            'posts': posts,
            'pagination': {
                'page': page,
                'pages': 1,
                'per_page': per_page,
                'total': len(posts),
                'has_next': False,
                'has_prev': False
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        # Intentar obtener de Supabase
        projects_data = supabase_request('GET', 'projects')
        
        if projects_data is not None:
            projects = projects_data
        else:
            # Fallback a datos simulados
            projects = SAMPLE_DATA['projects']
        
        return jsonify({
            'projects': projects,
            'pagination': {
                'page': 1,
                'pages': 1,
                'per_page': 10,
                'total': len(projects),
                'has_next': False,
                'has_prev': False
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/featured', methods=['GET'])
def get_featured_projects():
    try:
        # Intentar obtener de Supabase
        projects_data = supabase_request('GET', 'projects')
        
        if projects_data is not None:
            projects = projects_data[:3]  # Primeros 3 proyectos
        else:
            # Fallback a datos simulados
            projects = SAMPLE_DATA['projects'][:3]
        
        return jsonify({'projects': projects}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/stats', methods=['GET'])
def get_projects_stats():
    try:
        # Intentar obtener de Supabase
        projects_data = supabase_request('GET', 'projects')
        
        if projects_data is not None:
            projects = projects_data
        else:
            # Fallback a datos simulados
            projects = SAMPLE_DATA['projects']
        
        active_projects = len([p for p in projects if p.get('status') == 'active'])
        completed_projects = len([p for p in projects if p.get('status') == 'completed'])
        
        return jsonify({
            'stats': {
                'total_projects': len(projects),
                'active_projects': active_projects,
                'completed_projects': completed_projects
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/supabase/setup', methods=['POST'])
def setup_supabase():
    """Endpoint para configurar las tablas iniciales en Supabase"""
    try:
        # Crear tabla de usuarios si no existe
        users_schema = {
            "name": "users",
            "columns": [
                {"name": "id", "type": "uuid", "primary": True},
                {"name": "email", "type": "text", "unique": True},
                {"name": "first_name", "type": "text"},
                {"name": "last_name", "type": "text"},
                {"name": "role", "type": "text", "default": "visitor"},
                {"name": "bio", "type": "text"},
                {"name": "created_at", "type": "timestamp", "default": "now()"}
            ]
        }
        
        # Crear tabla de proyectos
        projects_schema = {
            "name": "projects",
            "columns": [
                {"name": "id", "type": "uuid", "primary": True},
                {"name": "title", "type": "text"},
                {"name": "description", "type": "text"},
                {"name": "image_url", "type": "text"},
                {"name": "status", "type": "text", "default": "active"},
                {"name": "progress_percentage", "type": "integer", "default": 0},
                {"name": "location", "type": "text"},
                {"name": "visibility", "type": "text", "default": "public"},
                {"name": "created_at", "type": "timestamp", "default": "now()"}
            ]
        }
        
        # Crear tabla de posts
        posts_schema = {
            "name": "posts",
            "columns": [
                {"name": "id", "type": "uuid", "primary": True},
                {"name": "content", "type": "text"},
                {"name": "image_url", "type": "text"},
                {"name": "user_id", "type": "uuid"},
                {"name": "project_id", "type": "uuid"},
                {"name": "visibility", "type": "text", "default": "public"},
                {"name": "status", "type": "text", "default": "published"},
                {"name": "likes_count", "type": "integer", "default": 0},
                {"name": "comments_count", "type": "integer", "default": 0},
                {"name": "shares_count", "type": "integer", "default": 0},
                {"name": "created_at", "type": "timestamp", "default": "now()"}
            ]
        }
        
        return jsonify({
            'message': 'Esquemas de Supabase preparados',
            'schemas': [users_schema, projects_schema, posts_schema],
            'note': 'Ejecuta estos esquemas manualmente en el panel de Supabase'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return jsonify({
        'message': 'CASIRA Connect API con Supabase',
        'version': '1.0.0',
        'status': 'running',
        'supabase_configured': bool(SUPABASE_URL and SUPABASE_ANON_KEY),
        'endpoints': [
            '/api/health',
            '/api/auth/login',
            '/api/auth/register',
            '/api/posts',
            '/api/projects',
            '/api/projects/featured',
            '/api/projects/stats',
            '/api/supabase/setup'
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)

