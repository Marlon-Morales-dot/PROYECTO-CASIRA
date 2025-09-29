#!/usr/bin/env python3
"""
Script para verificar la estructura de la tabla users en Supabase
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://wlliqmcpiiktcdzwzhdn.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMjc0OTUsImV4cCI6MjA0MjcwMzQ5NX0.ug3fCAD0V6b0b2JrGFcxuGBf8t3wCK7QV9FIKOXBLps')

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_users_table():
    """Verificar estructura de la tabla users"""
    try:
        print("[INFO] Verificando tabla users...")

        # Obtener todos los usuarios para ver la estructura
        response = supabase.table('users').select('*').limit(1).execute()

        if response.data:
            user = response.data[0]
            print("[INFO] Estructura actual de la tabla users:")
            for column, value in user.items():
                print(f"  - {column}: {type(value).__name__}")
        else:
            print("[INFO] No hay usuarios en la tabla, creando uno de prueba...")

            # Intentar crear un usuario simple para ver qué columnas acepta
            test_user = {
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'visitor'
            }

            response = supabase.table('users').insert(test_user).execute()
            if response.data:
                print("[SUCCESS] Usuario de prueba creado. Estructura:")
                user = response.data[0]
                for column, value in user.items():
                    print(f"  - {column}: {type(value).__name__}")

                # Eliminar usuario de prueba
                supabase.table('users').delete().eq('email', 'test@example.com').execute()
                print("[INFO] Usuario de prueba eliminado")

        return True

    except Exception as e:
        print(f"[ERROR] Error verificando tabla: {str(e)}")
        return False

if __name__ == "__main__":
    check_users_table()