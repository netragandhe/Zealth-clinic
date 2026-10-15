import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let targetApiUrl = (env.VITE_API_URL && env.VITE_API_URL.trim() !== '') 
    ? env.VITE_API_URL.trim().replace(/\/+$/, '') 
    : 'http://localhost:5001'

  if (targetApiUrl.startsWith('https://localhost') || targetApiUrl.startsWith('https://127.0.0.1')) {
    targetApiUrl = targetApiUrl.replace(/^https:/, 'http:')
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: 'localhost',
      hmr: true,
      proxy: {
        '/api': {
          target: targetApiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
