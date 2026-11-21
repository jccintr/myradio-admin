import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 5173 já está liberada no CORS da API (cors.origins).
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 700 },
});
