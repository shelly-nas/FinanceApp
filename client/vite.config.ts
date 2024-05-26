import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }]
  },
  server: {
    host: '0.0.0.0',  // Listen on all addresses, not just localhost
    port: 5173,       // You can specify the port you want to use
  },
})
