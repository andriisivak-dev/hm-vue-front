<script setup lang="ts">
import NotificationsMenu from '@/components/common/NotificationsMenu.vue';
import UserProfileMenu from '@/components/common/UserProfileMenu.vue';
import { useLayoutStore } from '@/stores/layout';

const layoutStore = useLayoutStore();
</script>

<template>
    <nav class="app-header navbar navbar-expand bg-body">
        <div class="container-fluid">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a
                        class="nav-link"
                        data-lte-toggle="sidebar"
                        href="#"
                        role="button"
                        @click.prevent="layoutStore.toggleSidebar()"
                    >
                        <i class="bi bi-list"></i>
                    </a>
                </li>
                <li class="nav-item d-none d-md-block">
                    <router-link to="/dashboard" class="nav-link">Profile</router-link>
                </li>
            </ul>

            <ul class="navbar-nav ms-auto">
                <NotificationsMenu />

                <UserProfileMenu />

                <li class="nav-item">
                    <a class="nav-link" href="#" data-lte-toggle="fullscreen">
                        <i data-lte-icon="maximize" class="bi bi-arrows-fullscreen"></i>
                        <i
                            data-lte-icon="minimize"
                            class="bi bi-fullscreen-exit"
                            style="display: none"
                        ></i>
                    </a>
                </li>
            </ul>
        </div>
    </nav>
</template>
