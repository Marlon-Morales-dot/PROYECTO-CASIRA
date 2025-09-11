from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime

# API-only Flask app - no static file serving
app = Flask(__name__)

# CORS configuration for Vercel frontend
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://proyecto-casira-web.vercel.app')
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', f'{FRONTEND_URL},https://proyecto-casira-1.onrender.com,http://localhost:5173').split(',')

CORS(app, 
     origins=ALLOWED_ORIGINS,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

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
    """Simulated login endpoint"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password required'}), 400
    
    # Simulate user lookup
    for user in SAMPLE_DATA['users']:
        if user['email'] == data['email']:
            # In real app, verify password hash
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role']
                },
                'token': 'sample_jwt_token_here'
            })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Simulated registration endpoint"""
    data = request.get_json()
    
    required_fields = ['email', 'password', 'first_name', 'last_name']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists
    for user in SAMPLE_DATA['users']:
        if user['email'] == data['email']:
            return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    new_user = {
        'id': len(SAMPLE_DATA['users']) + 1,
        'email': data['email'],
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'role': data.get('role', 'beneficiary'),
        'bio': data.get('bio', '')
    }
    
    SAMPLE_DATA['users'].append(new_user)
    
    return jsonify({
        'message': 'Registration successful', 
        'user': new_user
    }), 201

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

if __name__ == '__main__':
    # Para desarrollo local
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3000)), debug=True)