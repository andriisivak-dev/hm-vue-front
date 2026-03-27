import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/wp-content/themes/hemant/assets/vue/',
  plugins: [vue()],
  build: {
    outDir: '../wp-content/themes/hemant/assets/vue',
    emptyOutDir: true,
    manifest: true,
  },
})