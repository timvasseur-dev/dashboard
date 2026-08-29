import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base : contrainte GitHub Pages, le site est servi sous /dashboard/
export default defineConfig({
  base: '/dashboard/',
  plugins: [react()],
  server: {
    host: true,
    // le polling coûte cher en CPU et en RAM sur le Chromebook : on garde inotify
    watch: { usePolling: false },
  },
})
