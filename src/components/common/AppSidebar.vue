<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import SidebarFilters from './sidebar/SidebarFilters.vue';
import SidebarActivities from './sidebar/SidebarActivities.vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
    showFilters?: boolean;
}>();

const route = useRoute();
const userStore = useUserStore();

const user = computed(() => userStore.user);
const role = computed(() => user.value?.role || '');

const canCreateCase = computed(() => role.value !== 'hm_marketing');
const isDashboard = computed(() => route.name === 'dashboard');
const showNewCaseStudyButton = computed(() => canCreateCase.value && isDashboard.value);
const showActivities = computed(() => role.value !== 'hm_field_agent' && props.showFilters);
</script>

<template>
    <aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
        <div class="sidebar-brand with-bottom-line">
            <router-link to="/dashboard" class="brand-link">
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
                to="/case"
                class="btn btn-warning w-100 mt-2 mb-2 fw-bold"
            >
                + New Case Study
            </router-link>

            <SidebarFilters :showFilters="showFilters" />
            <SidebarActivities :show-activities="showActivities" />
        </div>
    </aside>
</template>

<style scoped></style>
