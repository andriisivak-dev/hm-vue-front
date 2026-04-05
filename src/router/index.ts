import { createRouter, createWebHistory } from 'vue-router';
import AppDashboard from '@/pages/AppDashboard.vue';
import AppForm from '@/pages/AppForm.vue';

const routes = [
    // { path: '/', component: AppDashboard },
    // { path: '/dashboard', redirect: '/' },
    {
        // path: '/dashboard',
        path: '/',
        name: 'dashboard',
        component: AppDashboard
    },
    {
        path: '/case-study',
        name: 'case',
        component: AppForm
    }
];

export const router = createRouter({
    history: createWebHistory('/'),
    routes
});
