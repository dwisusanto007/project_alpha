import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portal',
  build: { outDir: 'dist' },
  server: {
    proxy: { '/portal': 'http://localhost:3000' }
  }
})
