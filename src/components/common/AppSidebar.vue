<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useLayoutStore } from '@/stores/layout';
import SidebarFilters from './sidebar/SidebarFilters.vue';
import SidebarActivities from './sidebar/SidebarActivities.vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
    showFilters?: boolean;
}>();

const route = useRoute();
const userStore = useUserStore();
const layoutStore = useLayoutStore();

const user = computed(() => userStore.user);
const role = computed(() => user.value?.role || '');

const canCreateCase = computed(() => role.value !== 'hm_marketing');
const isDashboard = computed(() => route.name === 'dashboard');
const showNewCaseStudyButton = computed(() => canCreateCase.value && isDashboard.value);
const showActivities = computed(
    () => role.value !== 'hm_field_agent' && role.value !== 'hm_marketing' && props.showFilters
);

const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const updateMobileState = (e: MediaQueryListEvent | MediaQueryList) => {
    const wasMobile = isMobile.value;
    isMobile.value = e.matches;

    if (isMobile.value && !wasMobile) {
        if (layoutStore.sidebarOpen) {
            layoutStore.toggleSidebar();
        }
    } else if (!isMobile.value && wasMobile) {
        if (!layoutStore.sidebarOpen) {
            layoutStore.toggleSidebar();
        }
    }
};

onMounted(() => {
    mediaQuery = window.matchMedia('(max-width: 1049px)');

    isMobile.value = mediaQuery.matches;
    if (isMobile.value && layoutStore.sidebarOpen) {
        layoutStore.toggleSidebar();
    }

    mediaQuery.addEventListener('change', updateMobileState);
});

onUnmounted(() => {
    if (mediaQuery) {
        mediaQuery.removeEventListener('change', updateMobileState);
    }
});

watch(
    () => layoutStore.sidebarOpen,
    (isOpen) => {
        if (isMobile.value) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }
);
</script>

<template>
    <Teleport to="body">
        <transition name="sidebar-backdrop-transition">
            <div
                v-if="isMobile && layoutStore.sidebarOpen"
                class="sidebar-backdrop"
                @click="layoutStore.toggleSidebar()"
            ></div>
        </transition>
    </Teleport>

    <aside
        class="app-sidebar bg-body-secondary shadow"
        :class="{ 'sidebar-mobile-open': isMobile && layoutStore.sidebarOpen }"
        data-bs-theme="dark"
    >
        <div class="sidebar-brand with-bottom-line">
            <router-link to="/" class="brand-link">
                <img src="/Logo.svg" alt="Hemant" class="brand-image" />
            </router-link>
        </div>

        <div class="sidebar-user with-bottom-line d-flex align-items-center px-2 py-3">
            <img
                v-if="user?.avatar"
                :src="user.avatar"
                class="avatar avatar-53 photo user-image rounded-circle me-3 js-current-user-avatar"
                alt="User Avatar"
            />
            <span class="sidebar-username fw-semibold"
                >Hello,
                {{ user?.name }}
            </span>
        </div>

        <div class="sidebar-wrapper">
            <router-link
                v-if="showNewCaseStudyButton"
                to="/case-study"
                class="btn btn-warning w-100 mt-2 mb-2 fw-bold"
            >
                + New Case Study
            </router-link>

            <SidebarFilters :showFilters="showFilters" />
            <div class="sidebar-divider" v-if="showActivities" />
            <SidebarActivities :show-activities="showActivities" />
        </div>
    </aside>
</template>

<style>
:root {
    --lte-sidebar-width: 284px;
}

@media (min-width: 1050px) {
    body.sidebar-open {
        padding-left: var(--lte-sidebar-width) !important;
    }
}

@media (max-width: 1049px) {
    body.sidebar-open {
        padding-left: 0 !important;
    }
}

body.sidebar-expand-lg.layout-fixed .app-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    max-height: 100vh;
    height: 100vh;
    overflow-y: auto;
}

body.admin-bar.sidebar-expand-lg.layout-fixed .app-sidebar {
    top: 0;
    height: 100dvh;
    max-height: 100dvh;
}

@media (min-width: 782px) {
    body.admin-bar.sidebar-expand-lg.layout-fixed .app-sidebar {
        top: 32px;
        height: calc(100vh - 32px);
        max-height: calc(100vh - 32px);
    }
}
</style>

<style scoped>
.app-sidebar {
    background: linear-gradient(225deg, #f7931d 10px, #262469 242px);
    width: var(--lte-sidebar-width);
    transition: transform 0.3s ease;
    z-index: 1055;
}

@media (max-width: 1049px) {
    .app-sidebar {
        transform: translateX(-100%) !important;
    }
    .app-sidebar.sidebar-mobile-open {
        transform: translateX(0) !important;
    }
}

.sidebar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
}

.sidebar-backdrop-transition-enter-active,
.sidebar-backdrop-transition-leave-active {
    transition: opacity 0.3s ease;
}

.sidebar-backdrop-transition-enter-from,
.sidebar-backdrop-transition-leave-to {
    opacity: 0;
}

.sidebar-brand {
    position: relative;
    height: unset;
    justify-content: flex-start;
    border-bottom: none;
}

.with-bottom-line {
    position: relative;
}

.with-bottom-line::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 258px;
    height: 1px;
    background-color: #fff;
    transform: translateX(-50%);
    z-index: 1040;
}

.sidebar-brand .brand-link .brand-image {
    width: 100px;
    max-height: unset;
}

.sidebar-user .sidebar-username {
    font-weight: 700;
    font-size: 18px;
    color: #efefef;
}

.sidebar-user img.avatar {
    width: 40px;
    height: 40px;
}

.sidebar-wrapper {
    padding: 0.5rem;
    height: auto !important;
}

.sidebar-wrapper .btn-warning {
    background: #f7931d;
    border-radius: 5px;
    padding: 8px 14px;
    width: 258px;
    height: 43px;
    font-weight: 700;
    font-size: 20px;
    text-transform: uppercase;
    text-align: center;
    color: #fff;
    border: none;
}

.sidebar-divider {
    width: 100%;
    height: 1px;
    background-color: #fff;
}
</style>
