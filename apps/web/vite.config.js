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
    historyApiFallback: true
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
