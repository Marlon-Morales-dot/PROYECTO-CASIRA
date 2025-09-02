from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime

# Configurar la ruta correcta del static folder
if os.path.exists('../web/dist'):
    static_folder = '../web/dist'
elif os.path.exists('./web/dist'):
    static_folder = './web/dist'
elif os.path.exists('../frontend/dist'):
    static_folder = '../frontend/dist'
elif os.path.exists('./frontend/dist'):
    static_folder = './frontend/dist'
else:
    static_folder = 'static'  # fallback - updated

app = Flask(__name__, static_folder=static_folder, static_url_path='')
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

# Nuevas rutas para autenticación con Google
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    try:
        data = request.get_json()
        google_user = data.get('user', {})
        
        if not google_user.get('email'):
            return jsonify({'error': 'Email requerido'}), 400
            
        # Buscar usuario existente por email
        existing_user = None
        for user in SAMPLE_DATA['users']:
            if user['email'].lower() == google_user['email'].lower():
                existing_user = user
                break
        
        # Si no existe, crear nuevo usuario visitor
        if not existing_user:
            new_user = {
                'id': len(SAMPLE_DATA['users']) + 1,
                'email': google_user['email'],
                'first_name': google_user.get('given_name', ''),
                'last_name': google_user.get('family_name', ''),
                'role': 'visitor',
                'google_id': google_user.get('id'),
                'picture': google_user.get('picture'),
                'created_at': datetime.now().isoformat(),
                'bio': 'Usuario registrado mediante Google'
            }
            SAMPLE_DATA['users'].append(new_user)
            existing_user = new_user
        else:
            # Actualizar datos del usuario existente con info de Google
            existing_user.update({
                'google_id': google_user.get('id'),
                'picture': google_user.get('picture'),
                'first_name': google_user.get('given_name', existing_user.get('first_name')),
                'last_name': google_user.get('family_name', existing_user.get('last_name'))
            })
        
        return jsonify({
            'success': True,
            'user': existing_user,
            'message': 'Autenticación con Google exitosa'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/profile', methods=['POST'])
def update_user_profile():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id requerido'}), 400
        
        # Buscar usuario
        user = None
        for u in SAMPLE_DATA['users']:
            if u['id'] == user_id:
                user = u
                break
                
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
        # Actualizar campos permitidos
        updatable_fields = ['first_name', 'last_name', 'phone', 'location', 'bio', 'skills']
        for field in updatable_fields:
            if field in data:
                user[field] = data[field]
        
        return jsonify({
            'success': True,
            'user': user,
            'message': 'Perfil actualizado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Servir archivos estáticos del frontend React
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Sirve archivos CSS y JS del build de Vite"""
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

@app.route('/static/<path:filename>')
def static_files(filename):
    """Sirve archivos estáticos como imágenes, etc."""
    return send_from_directory(os.path.join(app.static_folder, 'static'), filename)

# Servir el frontend React para rutas específicas del SPA
@app.route('/')
@app.route('/visitor')
@app.route('/activities')
@app.route('/social')  
@app.route('/login')
@app.route('/enhanced-login')
@app.route('/dashboard')
@app.route('/admin')
def serve_react_app():
    """Sirve el frontend React para todas las rutas del SPA"""
    try:
        # Leer y procesar el index.html para asegurar CSP correcto
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Asegurar que script-src-elem esté incluido en CSP
            if 'script-src-elem' not in content:
                # Añadir comentario de debug para confirmar que el procesamiento funciona
                content = content.replace(
                    '<!-- Content Security Policy for Google Auth -->',
                    '<!-- Content Security Policy for Google Auth - Updated by Flask -->'
                )
                
                # Insertar script-src-elem después de script-src usando múltiples patrones
                import re
                # Patrón 1: Específico para el script-src actual
                content = content.replace(
                    'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.gstatic.com data: blob:;',
                    'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.gstatic.com https://*.googleapis.com data: blob:;\n      script-src-elem \'self\' \'unsafe-inline\' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.gstatic.com https://*.googleapis.com;'
                )
                
                # También asegurar que connect-src tenga *.googleapis.com
                content = content.replace(
                    'connect-src \'self\' https://accounts.google.com https://www.googleapis.com https://proyecto-casira.onrender.com;',
                    'connect-src \'self\' https://accounts.google.com https://*.googleapis.com https://proyecto-casira.onrender.com;'
                )
            
            from flask import Response
            return Response(content, mimetype='text/html')
        else:
            return send_from_directory(app.static_folder, 'index.html')
    except FileNotFoundError:
        # Fallback si no existe el build de React
        return jsonify({
            'message': 'CASIRA Connect API - Frontend no disponible',
            'version': '1.0.0',
            'status': 'running',
            'note': 'Frontend not built. Run: cd frontend && npm run build',
            'available_routes': [
                'GET /',
                'GET /visitor',
                'GET /activities', 
                'GET /social',
                'GET /login',
                'GET /dashboard',
                'GET /admin'
            ],
            'api_endpoints': [
                'GET /api/health',
                'POST /api/auth/login',
                'POST /api/auth/register',
                'POST /api/auth/google',
                'GET /api/posts',
                'GET /api/projects',
                'GET /api/projects/featured',
                'GET /api/projects/stats'
            ]
        }), 200

# Catch-all para rutas no encontradas (debe ir al final)
@app.errorhandler(404)
def not_found(error):
    # Si es una solicitud de API, devolver JSON
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found', 'path': request.path}), 404
    
    # Para cualquier otra ruta, intentar servir el frontend React
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except FileNotFoundError:
        return jsonify({'error': 'Page not found', 'path': request.path}), 404

if __name__ == '__main__':
    # Para desarrollo local
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)

