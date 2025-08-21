import {defineConfig} from 'vite'
import preact from '@preact/preset-vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        preact(),
        basicSsl()
    ],
})
