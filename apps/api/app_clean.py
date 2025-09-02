from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime

# API-only Flask app - no static file serving
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
            "author": "Administrador CASIRA",
            "created_at": "2024-11-15",
            "likes": 15,
            "comments": []
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
            '/api/posts',
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
            '/api/posts', 
            '/api/projects'
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
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)