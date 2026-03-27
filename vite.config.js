import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Calculator/',
  build: {
    // Disable filename hashing to keep our service worker logic simple for now
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
