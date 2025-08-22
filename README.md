CASIRA Connect - Paquete Descargable
===================================

Contenido:
- frontend/: Aplicación React lista para desarrollo y build (Vite)
- backend/: API Flask lista para Render/Vercel/Supabase
- docs/: Guía de despliegue e informe técnico

Pasos rápidos (local):
1) Frontend
   cd frontend
   pnpm install (o npm install)
   pnpm run dev --host (o npm run dev)
2) Backend
   cd ../backend
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   python app.py
3) Variables de entorno
   Copia .env.example a .env y completa valores (especialmente de Supabase)

Despliegue:
- Render: usar render.yaml y Procfile
- Vercel: vercel.json
- Supabase: usa app_supabase.py + requirements_supabase.txt

