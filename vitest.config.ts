/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Path aliases (same as main vite config)
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

  test: {
    // Use jsdom for DOM simulation
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      exclude: ['node_modules/', 'src/test/', 'src-tauri/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },

    // Global test configuration
    globals: true,

    // Include patterns
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Watch options
    watch: false,
  },
});
