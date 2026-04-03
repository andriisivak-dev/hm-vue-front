import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
    base: isDev ? '/' : '/wp-content/themes/hemant/assets/vue/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: 'localhost',
        port: 5173,
        // use it for Docker+Traefik / mounted FS
        watch: {
            usePolling: true,
            interval: 100
        },

        // HMR for WP
        hmr: {
            host: 'localhost'
        },
        cors: true
    },
    build: {
        outDir: '../wp-content/themes/hemant/assets/vue',
        emptyOutDir: true,
        manifest: true
    }
});
