import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // A base é definida como '/' para implantação em domínios raiz (como Vercel).
  // Para o GitHub Pages, você precisaria alterar para '/<nome-do-repositorio>/'.
  base: '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
});