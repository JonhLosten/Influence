import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    root: 'src',
    base: './',
    build: {
        outDir: '../dist',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    assetsInclude: ['**/*.svg'], // 🧩 important pour charger les logos SVG
    server: {
        port: 5173,
        open: false,
    },
})
