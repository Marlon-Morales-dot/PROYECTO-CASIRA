from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["*"])

# Datos simulados para el despliegue
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
            "visibility": "public"
        },
        {
            "id": 2,
            "title": "Laboratorio de Ciencias Renovado",
            "description": "El Liceo San Francisco ahora cuenta con equipamiento moderno para experimentos",
            "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500",
            "status": "active",
            "progress_percentage": 85,
            "location": "Liceo San Francisco de Asís",
            "visibility": "public"
        },
        {
            "id": 3,
            "title": "Centro Comunitario Construido",
            "description": "Un espacio de encuentro que fortalece los lazos de toda la comunidad",
            "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
            "status": "active",
            "progress_percentage": 60,
            "location": "Palencia, Guatemala",
            "visibility": "public"
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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'CASIRA Connect API funcionando correctamente',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        # Buscar usuario en datos simulados
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
            'message': 'Inicio de sesión exitoso',
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
        
        # Crear nuevo usuario simulado
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
            'message': 'Usuario registrado exitosamente',
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
        projects = SAMPLE_DATA['projects'][:3]  # Primeros 3 proyectos
        
        return jsonify({'projects': projects}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/stats', methods=['GET'])
def get_projects_stats():
    try:
        projects = SAMPLE_DATA['projects']
        active_projects = len([p for p in projects if p['status'] == 'active'])
        completed_projects = len([p for p in projects if p['status'] == 'completed'])
        
        return jsonify({
            'stats': {
                'total_projects': len(projects),
                'active_projects': active_projects,
                'completed_projects': completed_projects
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return jsonify({
        'message': 'CASIRA Connect API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': [
            '/api/health',
            '/api/auth/login',
            '/api/auth/register',
            '/api/posts',
            '/api/projects',
            '/api/projects/featured',
            '/api/projects/stats'
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)

