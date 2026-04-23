import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Hace que la app se actualice sola si cambias código
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Archivos extra si los tienes
      manifest: {
        name: 'SIGMAFAM',
        short_name: 'SIGMAFAM',
        description: 'Sistema Integral de Seguridad Familiar y monitoreo',
        theme_color: '#ffffff', // Cambia esto al color principal de tu app
        background_color: '#ffffff',
        display: 'standalone', // ¡ESTO ES LO QUE HACE QUE SE VEA COMO APP NATIVA!
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Esto es para que en Android el ícono se adapte a formas redondas o cuadradas
          }
        ]
      }
    })
  ]
})