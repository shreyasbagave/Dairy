import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // No dev proxy for `/admin` or `/farmer`: those prefixes match React Router (e.g. `/admin/dashboard/...`).
  // Proxying them breaks refresh (request hits Express without Authorization). API uses absolute base URL in `src/utils/api.js`.
}); 
