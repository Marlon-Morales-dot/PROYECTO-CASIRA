#!/usr/bin/env python3
"""
Script para actualizar el usuario admin existente con el nuevo formato
"""

import os
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

def update_admin_user():
    """Actualizar usuario admin con nuevo formato"""
    try:
        admin_email = 'admin@casira.org'
        admin_password = 'admin123'

        # Verificar si el admin existe
        response = supabase.table('users').select('*').eq('email', admin_email).execute()

        if not response.data:
            print(f"[ERROR] Usuario {admin_email} no encontrado")
            return False

        user = response.data[0]
        print(f"[INFO] Usuario encontrado: {user['first_name']} {user['last_name']}")

        # Ver el bio actual
        current_bio = user.get('bio', '')
        print(f"[INFO] Bio actual: {current_bio}")

        # Si ya tiene el formato correcto, no hacer nada
        if current_bio.startswith('CASIRA_PWD:'):
            print(f"[OK] Usuario ya tiene formato CASIRA correcto")
            return True

        # Hash de la contraseña
        password_hash = hash_password(admin_password)

        # Crear nuevo bio con password hash
        original_bio = current_bio if current_bio else "Administrador principal de la plataforma CASIRA Connect"
        new_bio = f"CASIRA_PWD:{password_hash}|{original_bio}"

        # Actualizar usuario
        update_data = {
            'bio': new_bio,
            'provider': 'casira',
            'verified': True,
            'status': 'active'
        }

        response = supabase.table('users').update(update_data).eq('email', admin_email).execute()

        if response.data:
            print(f"[SUCCESS] Usuario admin actualizado correctamente")
            print(f"[INFO] Email: {admin_email}")
            print(f"[INFO] Password: {admin_password}")
            print(f"[INFO] Provider: casira")
            return True
        else:
            print(f"[ERROR] Error al actualizar usuario admin")
            return False

    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("[INFO] Actualizando usuario admin...")
    success = update_admin_user()

    if success:
        print("\n[SUCCESS] Usuario admin listo para login CASIRA!")
        print("   Email: admin@casira.org")
        print("   Password: admin123")
    else:
        print("\n[ERROR] Error al actualizar usuario admin")