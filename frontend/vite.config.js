import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin': 'https://dairy-1-baro.onrender.com',
    },
  },
}); 
