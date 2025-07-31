import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react({
      // Fast refresh for better development experience
      fastRefresh: true,
    }),
  ],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/services': resolve(__dirname, './src/services'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/models': resolve(__dirname, './src/models'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@/config': resolve(__dirname, './src/config'),
    },
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },

  // Development server configuration
  server: {
    port: 1420,
    strictPort: true,
    host: true, // Allow external connections for testing
    open: false, // Don't auto-open browser (Tauri handles this)
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    // Enable HMR
    hmr: {
      port: 1421,
    },
  },

  // Build configuration for production
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable for production builds
    rollupOptions: {
      output: {
        // Better chunk splitting for smaller bundles
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tauri: ['@tauri-apps/api'],
        },
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
  },

  // Optimize dependencies for faster dev server startup
  optimizeDeps: {
    include: ['react', 'react-dom', '@tauri-apps/api'],
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
}));

