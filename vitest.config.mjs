import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  // Los componentes del proyecto son .js con JSX (convención de Next); para
  // que los tests de componentes los importen, esbuild los trata como JSX.
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    // Las pantallas con gráficas o muchos efectos superan los 5 s por defecto cuando
    // la suite completa corre en paralelo (en solitario tardan < 2 s).
    testTimeout: 20000,
    include: ['src/**/*.test.{js,jsx}'],
  },
});
