import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // allowedHosts: [
    //   'polka-jogger-selector.ngrok-free.dev'
    // ],
    proxy: {
      "/api/v1": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
