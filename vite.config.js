import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  base: '/hw-to-pdf/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        merge: resolve(__dirname, 'merge/index.html'),
        split: resolve(__dirname, 'split/index.html'),
        pdf2img: resolve(__dirname, 'pdf2img/index.html'),
        organize: resolve(__dirname, 'organize/index.html'),
        compress: resolve(__dirname, 'compress/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('jspdf')) {
            return 'vendor-jspdf';
          }

          if (id.includes('pdfjs-dist')) {
            return 'vendor-pdfjs';
          }

          if (id.includes('jszip') || id.includes('browser-image-compression')) {
            return 'vendor-utils';
          }

          if (id.includes('react') || id.includes('react-dom') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Homework to PDF',
        short_name: 'HW to PDF',
        description: 'Quickly convert your homework images to a clean PDF',
        theme_color: '#ffffff',
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
          }
        ]
      }
    })
  ],
})
