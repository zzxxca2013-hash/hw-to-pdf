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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        merge: resolve(__dirname, 'merge/index.html'),
        split: resolve(__dirname, 'split/index.html'),
        pdf2img: resolve(__dirname, 'pdf2img/index.html'),
        organize: resolve(__dirname, 'organize/index.html'),
        compress: resolve(__dirname, 'compress/index.html')
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Homework to PDF',
        short_name: 'HW to PDF',
        description: 'Quickly convert your homework images to a clean PDF',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: "Image to PDF",
            short_name: "Img to PDF",
            description: "Convert images to PDF",
            url: "/hw-to-pdf/",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Merge PDF",
            short_name: "Merge",
            description: "Merge multiple PDFs",
            url: "/hw-to-pdf/merge/",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Compress PDF",
            short_name: "Compress",
            description: "Reduce PDF size",
            url: "/hw-to-pdf/compress/",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      }
    })
  ],
})
