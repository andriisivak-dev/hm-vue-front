import { createApp } from 'vue';
import '@/style.css';
import App from '@/App.vue';
import { router } from '@/router';
import { createPinia } from 'pinia';
import '@/form-engine/validator';
import { setupApi } from '@/api';

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('main');

    if (!el) {
        console.error('Mount element #main not found');
        return;
    }

    const app = createApp(App);
    app.use(router);
    app.use(createPinia());

    setupApi();
    app.mount(el);
});
