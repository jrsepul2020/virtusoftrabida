import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fecha de build para mostrar en la app
const buildDate = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Optimize for PWA
    rollupOptions: {
      output: {
        // Forzar hash en archivos para evitar caché
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Clear output directory
    emptyOutDir: true
  },
  // Development server configuration
  server: {
    host: true,
    port: 3000,
    headers: {
      // Headers para evitar caché en desarrollo
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  preview: {
    host: true,
    port: 3000
  }
});
