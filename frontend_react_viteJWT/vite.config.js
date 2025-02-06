import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', // Your backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional
      },
    },
  },
})
