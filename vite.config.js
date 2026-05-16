import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: '/hw-to-pdf/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      injectRegister: 'auto',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'robots.txt',
      ],

      manifest: {
        name: 'Homework to PDF',
        short_name: 'HW to PDF',

        description:
          'Free browser-based PDF tools for converting images, merging, splitting, organizing and compressing PDF files.',

        theme_color: '#6366f1',
        background_color: '#ffffff',

        display: 'standalone',
        orientation: 'portrait',

        start_url: '/hw-to-pdf/',
        scope: '/hw-to-pdf/',

        lang: 'ar',

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],

        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  build: {
    sourcemap: false,

    chunkSizeWarningLimit: 1200,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),

        merge: resolve(__dirname, 'merge/index.html'),

        split: resolve(__dirname, 'split/index.html'),

        pdf2img: resolve(__dirname, 'pdf2img/index.html'),

        organize: resolve(__dirname, 'organize/index.html'),

        compress: resolve(__dirname, 'compress/index.html'),
      },

      output: {
        manualChunks(id) {
          if (id.includes('jspdf')) {
            return 'vendor-jspdf';
          }

          if (
            id.includes('pdfjs-dist') ||
            id.includes('pdf-lib')
          ) {
            return 'vendor-pdfjs';
          }

          if (
            id.includes('jszip') ||
            id.includes('browser-image-compression')
          ) {
            return 'vendor-utils';
          }

          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('lucide-react')
          ) {
            return 'vendor-ui';
          }
        },
      },
    },
  },

  server: {
    host: true,
    port: 5173,
  },
});
