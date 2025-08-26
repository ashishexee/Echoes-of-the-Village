import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '',
  server: {
    open: true,
    port: 5174
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});