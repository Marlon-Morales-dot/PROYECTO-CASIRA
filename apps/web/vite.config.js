import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin para copiar _redirects
const copyRedirectsPlugin = () => ({
  name: 'copy-redirects',
  writeBundle() {
    try {
      copyFileSync('public/_redirects', 'dist/_redirects');
      console.log('✅ _redirects copied to dist/');
    } catch (error) {
      console.log('⚠️ Could not copy _redirects:', error.message);
    }
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copyRedirectsPlugin()],
  base: '/',
  server: {
    historyApiFallback: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://ssl.gstatic.com https://www.google.com https://*.gstatic.com https://gstatic.com; frame-src 'self' https://accounts.google.com https://content.googleapis.com https://www.google.com; connect-src 'self' https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://proyecto-casira.onrender.com https://wlliqmcpiiktcdzwzhdn.supabase.co https://*.supabase.co; img-src 'self' data: blob: https://* http://* https://images.unsplash.com https://unsplash.com https://*.unsplash.com https://pixabay.com https://cdn.pixabay.com https://pexels.com https://images.pexels.com https://imgur.com https://i.imgur.com https://githubusercontent.com https://raw.githubusercontent.com https://cloudinary.com https://*.cloudinary.com https://amazonaws.com https://*.amazonaws.com https://ui-avatars.com https://api.dicebear.com https://avatar.vercel.sh https://vercel.sh https://lh3.googleusercontent.com https://*.googleusercontent.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://accounts.google.com/gsi/style https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets', 
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ]
  },
  define: {
    global: 'globalThis',
  }
})
