import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import envCompatible from 'vite-plugin-env-compatible'
export default defineConfig({
  envPrefix:'VITE_',
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://palmyra-fruit.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
