from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
from supabase import create_client, Client
import bcrypt
import jwt
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# API-only Flask app - no static file serving
app = Flask(__name__)

# CORS configuration for Vercel frontend
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://proyecto-casira-web.vercel.app')
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', f'{FRONTEND_URL},https://proyecto-casira-1.onrender.com,http://localhost:5173,http://localhost:3000').split(',')

CORS(app,
     origins=ALLOWED_ORIGINS,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# =============================================================================
# CONFIGURACIÓN SUPABASE Y JWT
# =============================================================================

# Configuración de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://wlliqmcpiiktcdzwzhdn.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMjc0OTUsImV4cCI6MjA0MjcwMzQ5NX0.ug3fCAD0V6b0b2JrGFcxuGBf8t3wCK7QV9FIKOXBLps')
JWT_SECRET = os.environ.get('JWT_SECRET', 'casira-super-secret-key-for-jwt-tokens-2024')

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def hash_password(password: str) -> str:
    """Hash de contraseña usando bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verificar contraseña contra hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_jwt_token(user_data: dict) -> str:
    """Generar token JWT - EXACTAMENTE como Google OAuth"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'role': user_data['role'],
        'exp': datetime.utcnow() + timedelta(days=7),  # Token válido por 7 días
        'iat': datetime.utcnow(),
        'iss': 'casira-connect'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token: str) -> dict:
    """Verificar y decodificar token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return {'valid': True, 'payload': payload}
    except jwt.ExpiredSignatureError:
        return {'valid': False, 'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'valid': False, 'error': 'Invalid token'}

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
        },
        {
            "id": 3,
            "email": "beneficiario@ejemplo.com",
            "first_name": "Carlos",
            "last_name": "Hernández", 
            "role": "beneficiary",
            "bio": "Estudiante de ingeniería, beneficiario de beca CASIRA"
        }
    ],
    "projects": [
        {
            "id": 1,
            "title": "Programa de Becas Educativas 2024",
            "description": "Otorgamos becas completas a estudiantes destacados de escasos recursos",
            "status": "active",
            "budget": 50000,
            "beneficiaries_count": 25,
            "created_at": "2024-01-15"
        },
        {
            "id": 2,
            "title": "Centro Comunitario Digital",
            "description": "Establecimiento de centro con acceso a internet y capacitación tecnológica",
            "status": "in_progress", 
            "budget": 30000,
            "beneficiaries_count": 150,
            "created_at": "2024-02-01"
        }
    ],
    "posts": [
        {
            "id": 1,
            "title": "¡Nuevas becas disponibles!",
            "content": "Hemos abierto la convocatoria para 20 nuevas becas educativas. Aplica ya!",
            "author_id": 1,
            "author": "Administrador CASIRA",
            "created_at": "2024-11-15",
            "likes_count": 15,
            "comments_count": 3,
            "comments": [
                {
                    "id": 1,
                    "post_id": 1,
                    "author_id": 2,
                    "author": "María González",
                    "content": "¡Excelente iniciativa! Compartiendo con estudiantes necesitados.",
                    "created_at": "2024-11-15",
                    "likes_count": 2
                },
                {
                    "id": 2,
                    "post_id": 1,
                    "author_id": 3,
                    "author": "Carlos Hernández",
                    "content": "Gracias por estas oportunidades. Ya aplicaré.",
                    "created_at": "2024-11-16",
                    "likes_count": 5
                }
            ],
            "likes": [
                {"user_id": 1, "created_at": "2024-11-15"},
                {"user_id": 2, "created_at": "2024-11-15"},
                {"user_id": 3, "created_at": "2024-11-16"}
            ]
        },
        {
            "id": 2,
            "title": "Actividad de limpieza comunitaria",
            "content": "Este sábado nos reunimos para limpiar el parque central. ¡Únete!",
            "author_id": 2,
            "author": "María González",
            "created_at": "2024-11-10",
            "likes_count": 8,
            "comments_count": 1,
            "comments": [],
            "likes": []
        }
    ]
}

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'message': 'CASIRA Connect API is running'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """CASIRA Auth Login - EXACTAMENTE como Google OAuth"""
    try:
        data = request.get_json()

        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400

        email = data['email'].lower().strip()
        password = data['password']

        print(f"[LOGIN] Login attempt for: {email}")

        # Buscar usuario en Supabase
        response = supabase.table('users').select('*').eq('email', email).execute()

        if not response.data:
            print(f"[ERROR] User not found: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        user = response.data[0]
        print(f"[OK] User found: {user['first_name']} {user['last_name']}")

        # Verificar contraseña - EXTRAER DEL CAMPO BIO
        bio = user.get('bio', '')
        if not bio.startswith('CASIRA_PWD:'):
            print(f"[ERROR] No CASIRA password for user: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        # Extraer password hash del bio
        try:
            pwd_part = bio.split('|')[0]  # Tomar la parte antes del |
            password_hash = pwd_part.replace('CASIRA_PWD:', '')
        except:
            print(f"[ERROR] Invalid password format for user: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        if not verify_password(password, password_hash):
            print(f"[ERROR] Invalid password for user: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        # Usuario autenticado correctamente
        print(f"[OK] Password verified for user: {email}")

        # Actualizar último login
        supabase.table('users').update({
            'last_login': datetime.utcnow().isoformat()
        }).eq('id', user['id']).execute()

        # Preparar datos del usuario EXACTAMENTE como Google OAuth
        # Extraer bio real (sin password hash)
        clean_bio = ''
        if '|' in user.get('bio', ''):
            clean_bio = user['bio'].split('|', 1)[1]  # Tomar todo después del primer |

        user_data = {
            'id': user['id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'fullName': f"{user['first_name']} {user['last_name']}",
            'role': user['role'],
            'bio': clean_bio,  # Bio sin password hash
            'avatar_url': user.get('avatar_url', ''),
            'created_at': user.get('created_at', ''),
            'last_login': datetime.utcnow().isoformat(),
            'auth_provider': 'casira'
        }

        # Generar token JWT
        token = generate_jwt_token(user_data)

        # Respuesta EXACTAMENTE igual a Google OAuth
        response_data = {
            'success': True,
            'message': f'¡Bienvenido {user_data["first_name"]}!',
            'user': user_data,
            'token': token
        }

        print(f"[SUCCESS] Login successful for: {email}")
        return jsonify(response_data), 200

    except Exception as e:
        print(f"[ERROR] Login error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """CASIRA Auth Register - EXACTAMENTE como Google OAuth"""
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['email', 'password', 'first_name', 'last_name']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields',
                'message': 'Todos los campos son requeridos'
            }), 400

        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()

        print(f"[REGISTER] Registration attempt for: {email}")

        # Validar longitud de contraseña
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': 'Password too short',
                'message': 'La contraseña debe tener al menos 6 caracteres'
            }), 400

        # Verificar si el usuario ya existe
        response = supabase.table('users').select('*').eq('email', email).execute()

        if response.data:
            print(f"[ERROR] User already exists: {email}")
            return jsonify({
                'success': False,
                'error': 'User already exists',
                'message': 'Ya existe un usuario con este email'
            }), 409

        # Hash de la contraseña
        password_hash = hash_password(password)

        # Crear nuevo usuario en Supabase - USANDO ESTRUCTURA EXISTENTE
        user_data = {
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'full_name': f"{first_name} {last_name}",
            'role': data.get('role', 'visitor'),  # Rol por defecto: visitor
            'bio': f"CASIRA_PWD:{password_hash}|{data.get('bio', '')}",  # Password hash en bio
            'provider': 'casira',  # Identificar como usuario CASIRA
            'verified': True,  # Auto-verificado para usuarios CASIRA
            'status': 'active',  # Usuario activo
            'avatar_url': '',
            'google_id': None,
            'preferences': {}  # Objeto vacío para preferencias
        }

        response = supabase.table('users').insert(user_data).execute()

        if not response.data:
            print(f"[ERROR] Failed to create user: {email}")
            return jsonify({
                'success': False,
                'error': 'Registration failed',
                'message': 'Error al crear el usuario'
            }), 500

        created_user = response.data[0]
        print(f"[SUCCESS] User created: {email}")

        # Preparar datos de respuesta EXACTAMENTE como Google OAuth
        # Extraer bio real (sin password hash)
        clean_bio = ''
        if '|' in created_user.get('bio', ''):
            clean_bio = created_user['bio'].split('|', 1)[1]  # Tomar todo después del primer |

        user_response = {
            'id': created_user['id'],
            'email': created_user['email'],
            'first_name': created_user['first_name'],
            'last_name': created_user['last_name'],
            'fullName': f"{created_user['first_name']} {created_user['last_name']}",
            'role': created_user['role'],
            'bio': clean_bio,  # Bio sin password hash
            'avatar_url': created_user.get('avatar_url', ''),
            'created_at': created_user.get('created_at', ''),
            'last_login': created_user.get('last_login', ''),
            'auth_provider': 'casira'
        }

        # Generar token JWT
        token = generate_jwt_token(user_response)

        # Respuesta EXACTAMENTE igual a Google OAuth
        response_data = {
            'success': True,
            'message': f'¡Bienvenido a CASIRA Connect, {user_response["first_name"]}!',
            'user': user_response,
            'token': token
        }

        print(f"[SUCCESS] Registration successful for: {email}")
        return jsonify(response_data), 201

    except Exception as e:
        print(f"[ERROR] Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Get all posts"""
    return jsonify({
        'posts': SAMPLE_DATA['posts'],
        'total': len(SAMPLE_DATA['posts'])
    })

@app.route('/api/posts', methods=['POST'])
def create_post():
    """Create a new post"""
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400
    
    # Create new post
    new_post = {
        'id': len(SAMPLE_DATA['posts']) + 1,
        'title': data.get('title', ''),
        'content': data['content'],
        'author_id': data.get('author_id', 1),
        'author': 'Usuario',
        'created_at': datetime.now().strftime('%Y-%m-%d'),
        'likes_count': 0,
        'comments_count': 0,
        'comments': [],
        'likes': []
    }
    
    # Find author name
    for user in SAMPLE_DATA['users']:
        if user['id'] == new_post['author_id']:
            new_post['author'] = f"{user['first_name']} {user['last_name']}"
            break
    
    SAMPLE_DATA['posts'].insert(0, new_post)
    
    return jsonify({
        'message': 'Post created successfully',
        'post': new_post
    }), 201

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    return jsonify({
        'projects': SAMPLE_DATA['projects'],
        'total': len(SAMPLE_DATA['projects'])
    })

@app.route('/api/projects/featured', methods=['GET'])
def get_featured_projects():
    """Get featured projects"""
    featured = [p for p in SAMPLE_DATA['projects'] if p['status'] == 'active']
    return jsonify({
        'projects': featured,
        'total': len(featured)
    })

@app.route('/api/projects/stats', methods=['GET'])
def get_project_stats():
    """Get project statistics"""
    total_projects = len(SAMPLE_DATA['projects'])
    total_budget = sum(p['budget'] for p in SAMPLE_DATA['projects'])
    total_beneficiaries = sum(p['beneficiaries_count'] for p in SAMPLE_DATA['projects'])
    
    return jsonify({
        'total_projects': total_projects,
        'total_budget': total_budget,
        'total_beneficiaries': total_beneficiaries,
        'active_projects': len([p for p in SAMPLE_DATA['projects'] if p['status'] == 'active'])
    })

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Google OAuth endpoint"""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Google token required'}), 400
    
    # In real app, verify Google token
    return jsonify({
        'message': 'Google authentication successful',
        'user': {
            'id': 999,
            'email': 'google.user@example.com',
            'first_name': 'Google',
            'last_name': 'User',
            'role': 'donor'
        },
        'token': 'sample_google_jwt_token'
    })

@app.route('/api/users/profile', methods=['POST'])
def update_profile():
    """Update user profile"""
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID required'}), 400
    
    # Find and update user
    for user in SAMPLE_DATA['users']:
        if user['id'] == data['user_id']:
            user.update({k: v for k, v in data.items() if k != 'user_id'})
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user
            })
    
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_post_like(post_id):
    """Toggle like on a post"""
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID required'}), 400
    
    user_id = data['user_id']
    
    # Find post
    post = None
    for p in SAMPLE_DATA['posts']:
        if p['id'] == post_id:
            post = p
            break
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Check if user already liked this post
    user_already_liked = any(like['user_id'] == user_id for like in post['likes'])
    
    if user_already_liked:
        # Remove like
        post['likes'] = [like for like in post['likes'] if like['user_id'] != user_id]
        post['likes_count'] = max(0, post['likes_count'] - 1)
        liked = False
        message = 'Like removed'
    else:
        # Add like
        post['likes'].append({
            'user_id': user_id,
            'created_at': datetime.now().strftime('%Y-%m-%d')
        })
        post['likes_count'] += 1
        liked = True
        message = 'Like added'
    
    return jsonify({
        'message': message,
        'liked': liked,
        'likes_count': post['likes_count']
    })

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """Get comments for a specific post"""
    
    # Find post
    post = None
    for p in SAMPLE_DATA['posts']:
        if p['id'] == post_id:
            post = p
            break
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    return jsonify({
        'comments': post['comments'],
        'total': len(post['comments'])
    })

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_post_comment(post_id):
    """Add a comment to a post"""
    data = request.get_json()
    
    if not data or 'content' not in data or 'author_id' not in data:
        return jsonify({'error': 'Content and author_id are required'}), 400
    
    # Find post
    post = None
    for p in SAMPLE_DATA['posts']:
        if p['id'] == post_id:
            post = p
            break
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Find author name
    author_name = 'Usuario desconocido'
    for user in SAMPLE_DATA['users']:
        if user['id'] == data['author_id']:
            author_name = f"{user['first_name']} {user['last_name']}"
            break
    
    # Create new comment
    new_comment = {
        'id': len([c for p in SAMPLE_DATA['posts'] for c in p['comments']]) + 1,
        'post_id': post_id,
        'author_id': data['author_id'],
        'author': author_name,
        'content': data['content'],
        'created_at': datetime.now().strftime('%Y-%m-%d'),
        'likes_count': 0
    }
    
    post['comments'].append(new_comment)
    post['comments_count'] = len(post['comments'])
    
    return jsonify({
        'message': 'Comment added successfully',
        'comment': new_comment
    }), 201

@app.route('/api/posts/<int:post_id>/comments/<int:comment_id>/like', methods=['POST'])
def toggle_comment_like(post_id, comment_id):
    """Toggle like on a comment"""
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID required'}), 400
    
    user_id = data['user_id']
    
    # Find post and comment
    post = None
    comment = None
    
    for p in SAMPLE_DATA['posts']:
        if p['id'] == post_id:
            post = p
            for c in p['comments']:
                if c['id'] == comment_id:
                    comment = c
                    break
            break
    
    if not post or not comment:
        return jsonify({'error': 'Post or comment not found'}), 404
    
    # For simplicity, just toggle the likes_count
    # In a real app, you'd track individual comment likes
    if not hasattr(comment, 'user_likes'):
        comment['user_likes'] = []
    
    if user_id in comment.get('user_likes', []):
        comment['user_likes'].remove(user_id)
        comment['likes_count'] = max(0, comment['likes_count'] - 1)
        liked = False
        message = 'Comment like removed'
    else:
        comment.setdefault('user_likes', []).append(user_id)
        comment['likes_count'] += 1
        liked = True
        message = 'Comment like added'
    
    return jsonify({
        'message': message,
        'liked': liked,
        'likes_count': comment['likes_count']
    })

# =============================================================================
# FRONTEND REDIRECT ROUTES
# =============================================================================

@app.route('/')
@app.route('/visitor')
@app.route('/activities')
@app.route('/social')  
@app.route('/login')
@app.route('/enhanced-login')
@app.route('/dashboard')
@app.route('/admin')
def redirect_to_frontend():
    """Redirect to the frontend service"""
    return jsonify({
        'message': 'CASIRA Connect API Server',
        'version': '1.0.0',
        'status': 'running',
        'frontend_url': 'https://proyecto-casira-1.onrender.com',
        'note': 'This is the API server. Visit the frontend_url for the web application.',
        'available_routes': [
            '/api/health',
            '/api/auth/login',
            '/api/auth/register', 
            '/api/posts (GET, POST)',
            '/api/posts/<id>/like (POST)',
            '/api/posts/<id>/comments (GET, POST)',
            '/api/posts/<id>/comments/<comment_id>/like (POST)',
            '/api/projects',
            '/api/projects/featured',
            '/api/projects/stats',
            '/api/auth/google',
            '/api/users/profile'
        ]
    }), 200

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors - redirect to API info"""
    return jsonify({
        'error': 'Not Found',
        'message': 'This is the CASIRA Connect API server.',
        'frontend_url': 'https://proyecto-casira-1.onrender.com',
        'available_api_routes': [
            '/api/health',
            '/api/auth/login',
            '/api/auth/register',
            '/api/posts (GET, POST)', 
            '/api/posts/<id>/like (POST)',
            '/api/posts/<id>/comments (GET, POST)',
            '/api/posts/<id>/comments/<comment_id>/like (POST)',
            '/api/projects',
            '/api/projects/featured',
            '/api/projects/stats'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'Something went wrong on the server'
    }), 500

@app.route('/api/auth/check-email', methods=['POST'])
def check_email():
    """Verificar si un email ya existe en la base de datos"""
    try:
        data = request.get_json()

        if not data or 'email' not in data:
            return jsonify({'error': 'Email required'}), 400

        email = data['email'].lower().strip()

        # Buscar usuario por email en Supabase
        response = supabase.table('users').select('email').eq('email', email).execute()

        exists = len(response.data) > 0

        return jsonify({
            'exists': exists,
            'message': 'Email ya está registrado' if exists else 'Email disponible'
        })

    except Exception as e:
        print(f"[ERROR] Error checking email: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': 'Error al verificar email'
        }), 500

# =============================================================================
# VOLUNTEER ACTIVITIES ENDPOINTS
# =============================================================================

@app.route('/api/volunteer-activities', methods=['GET'])
def get_volunteer_activities():
    """Obtener todas las actividades creadas por voluntarios"""
    try:
        response = supabase.table('volunteer_activities')\
            .select('*, users!volunteer_activities_created_by_fkey(id, first_name, last_name, email, avatar_url)')\
            .eq('status', 'active')\
            .order('created_at', desc=True)\
            .execute()

        return jsonify(response.data)
    except Exception as e:
        print(f"[ERROR] Error fetching volunteer activities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/my-activities/<user_id>', methods=['GET'])
def get_my_volunteer_activities(user_id):
    """Obtener actividades creadas por un voluntario específico"""
    try:
        response = supabase.table('volunteer_activities')\
            .select('*, users!volunteer_activities_created_by_fkey(id, first_name, last_name, email, avatar_url)')\
            .eq('created_by', user_id)\
            .order('created_at', desc=True)\
            .execute()

        return jsonify(response.data)
    except Exception as e:
        print(f"[ERROR] Error fetching my volunteer activities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities', methods=['POST'])
def create_volunteer_activity():
    """Crear nueva actividad de voluntario"""
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['title', 'description', 'created_by', 'location', 'start_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} is required'}), 400

        # Crear actividad
        activity_data = {
            'title': data['title'],
            'description': data['description'],
            'detailed_description': data.get('detailed_description', ''),
            'created_by': data['created_by'],
            'location': data['location'],
            'start_date': data['start_date'],
            'end_date': data.get('end_date'),
            'max_participants': data.get('max_participants', 10),
            'image_url': data.get('image_url', ''),
            'requirements': data.get('requirements', []),
            'benefits': data.get('benefits', []),
            'status': 'active',
            'created_at': datetime.utcnow().isoformat()
        }

        response = supabase.table('volunteer_activities').insert(activity_data).execute()

        print(f"[OK] Volunteer activity created: {data['title']} by user {data['created_by']}")

        return jsonify({
            'message': 'Activity created successfully',
            'activity': response.data[0]
        }), 201

    except Exception as e:
        print(f"[ERROR] Error creating volunteer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/<activity_id>', methods=['PUT'])
def update_volunteer_activity(activity_id):
    """Actualizar actividad de voluntario"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        # Verificar que el usuario sea el creador
        activity = supabase.table('volunteer_activities')\
            .select('created_by')\
            .eq('id', activity_id)\
            .execute()

        if not activity.data:
            return jsonify({'error': 'Activity not found'}), 404

        if activity.data[0]['created_by'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Actualizar actividad
        update_data = {
            'title': data.get('title'),
            'description': data.get('description'),
            'detailed_description': data.get('detailed_description'),
            'location': data.get('location'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'max_participants': data.get('max_participants'),
            'image_url': data.get('image_url'),
            'requirements': data.get('requirements'),
            'benefits': data.get('benefits'),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Remover None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        response = supabase.table('volunteer_activities')\
            .update(update_data)\
            .eq('id', activity_id)\
            .execute()

        return jsonify({
            'message': 'Activity updated successfully',
            'activity': response.data[0]
        })

    except Exception as e:
        print(f"[ERROR] Error updating volunteer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/<activity_id>', methods=['DELETE'])
def delete_volunteer_activity(activity_id):
    """Eliminar actividad de voluntario"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        # Verificar que el usuario sea el creador
        activity = supabase.table('volunteer_activities')\
            .select('created_by')\
            .eq('id', activity_id)\
            .execute()

        if not activity.data:
            return jsonify({'error': 'Activity not found'}), 404

        if activity.data[0]['created_by'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Eliminar actividad (soft delete)
        supabase.table('volunteer_activities')\
            .update({'status': 'deleted'})\
            .eq('id', activity_id)\
            .execute()

        return jsonify({'message': 'Activity deleted successfully'})

    except Exception as e:
        print(f"[ERROR] Error deleting volunteer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/<activity_id>/join', methods=['POST'])
def join_volunteer_activity(activity_id):
    """Solicitud para unirse a una actividad de voluntario"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        message = data.get('message', '')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Verificar que la actividad existe
        activity = supabase.table('volunteer_activities')\
            .select('*')\
            .eq('id', activity_id)\
            .execute()

        if not activity.data:
            return jsonify({'error': 'Activity not found'}), 404

        # Verificar que no haya solicitado antes
        existing = supabase.table('volunteer_activity_requests')\
            .select('*')\
            .eq('activity_id', activity_id)\
            .eq('user_id', user_id)\
            .execute()

        if existing.data:
            return jsonify({'error': 'Already requested to join this activity'}), 400

        # Crear solicitud
        request_data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'message': message,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }

        response = supabase.table('volunteer_activity_requests').insert(request_data).execute()

        return jsonify({
            'message': 'Request sent successfully',
            'request': response.data[0]
        }), 201

    except Exception as e:
        print(f"[ERROR] Error joining volunteer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/<activity_id>/requests', methods=['GET'])
def get_activity_requests(activity_id):
    """Obtener solicitudes para una actividad de voluntario"""
    try:
        response = supabase.table('volunteer_activity_requests')\
            .select('*, users!volunteer_activity_requests_user_id_fkey(id, first_name, last_name, email, avatar_url)')\
            .eq('activity_id', activity_id)\
            .order('created_at', desc=True)\
            .execute()

        return jsonify(response.data)
    except Exception as e:
        print(f"[ERROR] Error fetching activity requests: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/requests/<request_id>/approve', methods=['POST'])
def approve_activity_request(request_id):
    """Aprobar solicitud para actividad de voluntario"""
    try:
        data = request.get_json()
        volunteer_id = data.get('volunteer_id')  # ID del voluntario que aprueba

        # Obtener la solicitud
        request_data = supabase.table('volunteer_activity_requests')\
            .select('*, volunteer_activities!volunteer_activity_requests_activity_id_fkey(created_by)')\
            .eq('id', request_id)\
            .execute()

        if not request_data.data:
            return jsonify({'error': 'Request not found'}), 404

        # Verificar que el voluntario sea el creador de la actividad
        if request_data.data[0]['volunteer_activities']['created_by'] != volunteer_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Aprobar solicitud
        supabase.table('volunteer_activity_requests')\
            .update({
                'status': 'approved',
                'reviewed_at': datetime.utcnow().isoformat()
            })\
            .eq('id', request_id)\
            .execute()

        return jsonify({'message': 'Request approved successfully'})

    except Exception as e:
        print(f"[ERROR] Error approving request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/volunteer-activities/requests/<request_id>/reject', methods=['POST'])
def reject_activity_request(request_id):
    """Rechazar solicitud para actividad de voluntario"""
    try:
        data = request.get_json()
        volunteer_id = data.get('volunteer_id')

        # Obtener la solicitud
        request_data = supabase.table('volunteer_activity_requests')\
            .select('*, volunteer_activities!volunteer_activity_requests_activity_id_fkey(created_by)')\
            .eq('id', request_id)\
            .execute()

        if not request_data.data:
            return jsonify({'error': 'Request not found'}), 404

        # Verificar que el voluntario sea el creador
        if request_data.data[0]['volunteer_activities']['created_by'] != volunteer_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Rechazar solicitud
        supabase.table('volunteer_activity_requests')\
            .update({
                'status': 'rejected',
                'reviewed_at': datetime.utcnow().isoformat()
            })\
            .eq('id', request_id)\
            .execute()

        return jsonify({'message': 'Request rejected successfully'})

    except Exception as e:
        print(f"[ERROR] Error rejecting request: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Para desarrollo local - FORZAR puerto 3000
    port = 3000  # Forzar puerto 3000 directamente
    print(f"[INFO] CASIRA Connect API starting on http://0.0.0.0:{port}")
    print(f"[INFO] Supabase URL: {SUPABASE_URL}")
    print(f"[INFO] CORS enabled for: {ALLOWED_ORIGINS}")

    app.run(host='0.0.0.0', port=port, debug=True)