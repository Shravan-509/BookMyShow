import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    minify: 'esbuild', // faster + enough
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ['antd', '@ant-design/icons'],
          vendor: ['react', 'react-dom', 'axios'],
        }
      }
    }
  },

  server: {
    proxy: {
      "/bms/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})