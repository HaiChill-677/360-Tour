import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/360-Tour/',
  plugins: [react()],
  server: { port: 5173 },
});
