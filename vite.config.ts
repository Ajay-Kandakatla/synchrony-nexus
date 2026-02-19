import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@domains': resolve(__dirname, 'src/domains'),
      '@infra': resolve(__dirname, 'src/infrastructure'),
      '@plugins': resolve(__dirname, 'src/plugins'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', '@tanstack/react-query', 'immer'],
          'vendor-utils': ['zod', 'date-fns', 'clsx'],
        },
      },
    },
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
