<script setup lang="ts">
import NotificationsMenu from '@/components/common/NotificationsMenu.vue';
import UserProfileMenu from '@/components/common/UserProfileMenu.vue';
import { useLayoutStore } from '@/stores/layout';

const layoutStore = useLayoutStore();
</script>

<template>
    <nav class="app-header navbar navbar-expand bg-body">
        <div class="app-header-container">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a
                        class="nav-link-burger"
                        data-lte-toggle="sidebar"
                        href="#"
                        role="button"
                        @click.prevent="layoutStore.toggleSidebar()"
                    >
                        <i class="bi bi-list"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <router-link to="/" class="nav-item-profile">Profile</router-link>
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

<style scoped>
.app-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 0;
    padding: 0;
    gap: 20px;
}

.nav-item-profile {
    position: relative;
    color: #262469;
    display: block;
    padding: 0 4px;
    font-size: 18px;
    font-weight: var(--bs-nav-link-font-weight);
    text-decoration: none;
    background: 0 0;
    border: 0;
}

.navbar-nav {
    align-items: center;
}

.nav-link-burger {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    color: #262469;
}

a[data-lte-toggle='fullscreen'] {
    display: none;
}

@media (min-width: 767px) {
    .app-header-container {
    }

    .nav-item-profile {
        padding: 0 16px 0 10px;
        font-size: 20px;
    }

    .nav-link-burger {
        padding: 8px 16px;
    }

    a[data-lte-toggle='fullscreen'] {
        display: block;
    }
}
</style>
