import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Form from '../pages/Form.vue'

const routes = [
    { path: '/', component: Dashboard },
    { path: '/dashboard', redirect: '/' },
    { path: '/case', component: Form },
]

export const router = createRouter({
    history: createWebHistory('/'),
    routes,
})