import { createRouter, createWebHistory } from 'vue-router';
import AppDashboard from '@/pages/AppDashboard.vue';
import AppForm from '@/pages/AppForm.vue';

const routes = [
    { path: '/', component: AppDashboard },
    { path: '/dashboard', redirect: '/' },
    { path: '/case', component: AppForm }
];

export const router = createRouter({
    history: createWebHistory('/'),
    routes
});
