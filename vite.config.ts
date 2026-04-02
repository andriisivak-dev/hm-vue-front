import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    base: '/wp-content/themes/hemant/assets/vue/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        outDir: '../wp-content/themes/hemant/assets/vue',
        emptyOutDir: true,
        manifest: true
    }
});
