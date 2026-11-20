/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// Relative base path so the build works from a GitHub Pages project subdirectory
// without hardcoding the repository name.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // pdfmake + embedded fonts form a multi-MB chunk; it must be precached
        // so PDF export works offline after the first load.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
      manifest: {
        id: './',
        name: 'WFRP 4e Character Sheet',
        short_name: 'WFRP Sheet',
        description:
          'Offline Warhammer Fantasy Roleplay 4th Edition character sheet with GM PDF export.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#efe6d2',
        theme_color: '#5a1414',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 4000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
