import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const APP_BUILD_ID = Date.now().toString();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(APP_BUILD_ID),
  },
  server: {
    port: 5173,
    host: true,
  },
});
