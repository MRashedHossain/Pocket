import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  const allowedHosts = (env.VITE_ALLOWED_HOSTS || 'pocket.infrasnow.com')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts,
      proxy: {
        '/api': env.VITE_API_URL || 'http://backend:8000',
      },
    },
  }
})
