import { defineConfig } from 'vite';

export default defineConfig({
  // 開發伺服器設定
  server: {
    port: 5173,
    open: true,
  },

  // 建置設定
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 將大型依賴拆分為獨立 chunk
          'heic-decoder': ['heic2any'],
          'gif-encoder': ['gif.js'],
        },
      },
    },
  },

  // Worker 設定
  worker: {
    format: 'es', // ES Module 格式
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },

  // 優化設定
  optimizeDeps: {
    include: ['heic2any', 'gif.js'],
  },

  // 預覽伺服器設定
  preview: {
    port: 4173,
  },
});
