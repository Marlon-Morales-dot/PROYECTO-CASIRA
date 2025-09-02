#!/bin/bash
set -e

echo "🏗️  Building CASIRA Connect..."

# Instalar dependencias del frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm ci

# Construir frontend
echo "🔨 Building frontend..."
npm run build

# Volver al directorio raíz
cd ..

echo "✅ Build completed successfully!"