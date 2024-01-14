import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        webgpu: resolve(__dirname, 'src/webgpu/index.html'),
      },
    },
  },
})
