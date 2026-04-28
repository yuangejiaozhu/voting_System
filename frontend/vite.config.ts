import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self' 'unsafe-inline';"
    }
  },
  optimizeDeps: {
    include: ['@metamask/connect-evm']
  }
})
