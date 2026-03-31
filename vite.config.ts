import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
// import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        preact(),
        // basicSsl({
        //     domains: ['m-stickers.loc'],
        // }),
    ],
    server: {
        host: false,
        port: 5173,
        allowedHosts: true,
        proxy: {
            "/api": {
                target: "https://m-stickers-back.loc",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
