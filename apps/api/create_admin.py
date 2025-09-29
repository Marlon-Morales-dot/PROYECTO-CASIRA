#!/usr/bin/env python3
"""
Script para crear el usuario administrador en Supabase
Esto permite probar el login CASIRA inmediatamente
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client
import bcrypt
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://wlliqmcpiiktcdzwzhdn.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMjc0OTUsImV4cCI6MjA0MjcwMzQ5NX0.ug3fCAD0V6b0b2JrGFcxuGBf8t3wCK7QV9FIKOXBLps')

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def hash_password(password: str) -> str:
    """Hash de contraseña usando bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_admin_user():
    """Crear usuario administrador en Supabase"""
    try:
        # Verificar si el admin ya existe
        response = supabase.table('users').select('*').eq('email', 'admin@casira.org').execute()

        if response.data:
            print("[OK] Usuario admin@casira.org ya existe")
            return True

        # Hash de la contraseña
        password_hash = hash_password('admin123')
        print("[OK] Password hash generado para admin123")

        # Datos del usuario administrador
        admin_data = {
            'email': 'admin@casira.org',
            'first_name': 'Administrador',
            'last_name': 'CASIRA',
            'password_hash': password_hash,
            'role': 'admin',
            'bio': 'Administrador principal de la plataforma CASIRA Connect',
            'auth_provider': 'casira',
            'email_verified': True,
            'is_active': True,
            'created_at': datetime.utcnow().isoformat(),
            'last_login': datetime.utcnow().isoformat()
        }

        # Crear usuario en Supabase
        response = supabase.table('users').insert(admin_data).execute()

        if response.data:
            print("[OK] Usuario administrador creado exitosamente:")
            print(f"   Email: admin@casira.org")
            print(f"   Password: admin123")
            print(f"   Nombre: Administrador CASIRA")
            print(f"   Role: admin")
            return True
        else:
            print("[ERROR] Error al crear usuario administrador")
            return False

    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("[INFO] Creando usuario administrador en Supabase...")
    success = create_admin_user()

    if success:
        print("\n[SUCCESS] Usuario administrador listo!")
        print("   Ahora puedes hacer login con:")
        print("   Email: admin@casira.org")
        print("   Password: admin123")
    else:
        print("\n[ERROR] Error al crear usuario administrador")
        sys.exit(1)