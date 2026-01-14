import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'БАРИН АЛП - Строителна Система',
        short_name: 'БАРИН АЛП',
        description: 'Система за управление на финанси и инвентар в строителна фирма',
        start_url: '/barin-alp-system/',
        scope: '/barin-alp-system/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e40af',
        orientation: 'portrait-primary',
        lang: 'bg',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/n8n\.simeontsvetanovn8nworkflows\.site\/webhook\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/barin-alp-system/',
  server: {
    port: 3000,
    open: true
  }
})
