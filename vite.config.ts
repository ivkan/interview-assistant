import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isBrowserMode = mode === 'browser'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@main': path.resolve(__dirname, './src/main'),
        '@renderer': path.resolve(__dirname, './src/renderer'),
        '@shared': path.resolve(__dirname, './src/shared')
      }
    },
    server: {
      port: 5173,
      strictPort: true
    },
    build: {
      outDir: isBrowserMode ? 'dist/browser' : 'dist/renderer',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html')
      }
    },
    base: isBrowserMode ? './' : './'
  }
})