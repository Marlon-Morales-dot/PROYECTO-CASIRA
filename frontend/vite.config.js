import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: '/',
  server: {
    historyApiFallback: {
      index: '/index.html',
    },
  },
  preview: {
    historyApiFallback: {
      index: '/index.html',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
})
