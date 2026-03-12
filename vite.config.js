import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pick = (...keys) => keys.map((key) => env[key]).find((value) => value !== undefined && value !== '')

  return {
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(pick('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY')),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(pick('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN')),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(pick('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID')),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(pick('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET')),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        pick('VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID')
      ),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(pick('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID')),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'Firebase Connect',
          short_name: 'Firebase Connect',
          description: 'Login, register, and scheduled notifications',
          theme_color: '#f59e0b',
          background_color: '#0f0f12',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],
  }
})
