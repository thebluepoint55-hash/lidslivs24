import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — чтобы сборка работала на GitHub Pages из подпапки репозитория
export default defineConfig({
  plugins: [react()],
  base: './',
});
