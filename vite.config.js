import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Calculator/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.svg', 'icon-512.svg', 'assets/sprites.svg'],
      manifest: {
        name: 'Percentage & Math Calculator',
        short_name: 'Calculator',
        description: 'Free percentage calculator with interactive math tools, scientific mode, and 12 beautiful themes.',
        theme_color: '#0052cc',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
              src: 'icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
          },
          {
              src: 'icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Exclude the manual sw.js from the glob patterns to prevent collisions
        globIgnores: ['sw.js']
      }
    })
  ]
});
