import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  // When VITE_ALLOWED_HOSTS is set, treat it as a strict allowlist (used by the
  // public deployment behind a reverse proxy). When it's unset — i.e. plain
  // local/LAN dev — accept any Host so phones and tablets on the same wifi can
  // reach the dev server at http://<your-lan-ip>:5173.
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
    : true

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts,
      proxy: {
        // Inside docker-compose this is set to http://backend:8000.
        '/api': env.VITE_API_URL || 'http://localhost:8000',
      },
    },
  }
})
