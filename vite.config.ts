import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'offline.html'],
      manifest: {
        name: 'Lyrics Synchronization App',
        short_name: 'Lyrics Sync',
        description: 'Ứng dụng đồng bộ lyrics với audio/video - hoạt động hoàn toàn offline',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/'
      },
      devOptions: {
        enabled: false // Disable service worker in development to prevent reload issues
      }
    })
  ],
  build: {
    // Enable source maps for better debugging
    sourcemap: true,
    
    // Optimize chunk sizes for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd'],
          motion: ['framer-motion'],
          storage: ['localforage', 'uuid']
        }
      }
    },
    
    // Ensure service worker and manifest are copied
    assetsDir: 'assets',
    copyPublicDir: true
  },
  
  // Enable PWA features
  server: {
    port: 5175,
    allowedHosts: ['localhost', 'sync.telecomic.top'], // Allow local and custom domain
    host: true // Allow external connections
    // To enable HTTPS in development, set 'https' to an object with cert/key
  },
  
  // Optimize for production
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  
  // Define global constants for offline detection
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
