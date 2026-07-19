import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crazyRouterPlugin } from './server/crazyrouter.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crazyRouterPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
