import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: false // 禁用 PostCSS，避免加载 @tailwindcss/postcss
  },
  server: {
    port: 3000,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' https://snark-artifacts.pse.dev https://*;"
    }
  },
  optimizeDeps: {
    include: ['@metamask/connect-evm']
  }
})
