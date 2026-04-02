import { createApp } from 'vue';
import '@/style.css';
import App from '@/App.vue';
import { router } from '@/router';
import { createPinia } from 'pinia';
import '@/form-engine/validator';
import { setupApi } from '@/api';

const app = createApp(App);

app.use(router);
app.use(createPinia());

const mountTarget =
    document.querySelector<HTMLElement>('#hm-app') ??
    document.querySelector<HTMLElement>('.app-main#main');

if (mountTarget) {
    setupApi();
    app.mount(mountTarget);
}
