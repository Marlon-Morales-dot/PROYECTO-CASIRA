import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [],
    },
    sourcemap: false,
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
})
