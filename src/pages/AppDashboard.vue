<script setup lang="ts">
import AppLayout from '@/components/common/AppLayout.vue';
import AppHeader from '@/components/common/AppHeader.vue';
import AppFooter from '@/components/common/AppFooter.vue';
import AppSidebar from '@/components/common/AppSidebar.vue';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard.vue';
import FieldAgentDashboard from '@/components/dashboard/FieldAgentDashboard.vue';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard.vue';
import MarketingDashboard from '@/components/dashboard/MarketingDashboard.vue';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

const userStore = useUserStore();
const user = computed(() => userStore.user);

const showFilters = computed(
    () => !['field_agent', 'hm_field_agent'].includes(user.value?.role || '')
);
const isSuperAdmin = computed(() =>
    ['administrator', 'hm_administrator'].includes(user.value?.role || '')
);
</script>

<template>
    <AppLayout>
        <AppHeader />
        <AppSidebar :showFilters="showFilters" />

        <div class="app-main">
            <div class="app-content-header">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-6">
                            <h3 class="mb-0 page-title">Welcome, {{ user?.name }}</h3>
                        </div>

                        <!--                        <div class="col-sm-6" v-if="user?.role !== 'field_agent'">-->
                        <!--                            <ol class="breadcrumb float-sm-end">-->
                        <!--                                <li class="breadcrumb-item">-->
                        <!--                                    <router-link to="./"> Dashboard </router-link>-->
                        <!--                                </li>-->
                        <!--                            </ol>-->
                        <!--                        </div>-->
                    </div>
                </div>
            </div>

            <div class="app-content">
                <div class="container-fluid">
                    <template v-if="isSuperAdmin">
                        <SuperAdminDashboard />
                    </template>
                    <template v-else-if="user?.role === 'hm_manager'">
                        <SupervisorDashboard />
                    </template>
                    <template v-else-if="user?.role === 'hm_marketing'">
                        <MarketingDashboard />
                    </template>
                    <template v-else-if="user?.role === 'hm_field_agent'">
                        <FieldAgentDashboard />
                    </template>
                </div>
            </div>
        </div>

        <AppFooter />
    </AppLayout>
</template>

<style scoped>
.app-content {
    padding: 0;
}

.row {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    margin: 0;
}

.row .col-sm-6 {
    flex-shrink: unset;
    width: auto;
    padding: 0;
}

.app-main .app-content-header .breadcrumb {
    line-height: 1.2;
}

.breadcrumb {
    font-size: 16px;
}

@media (min-width: 767px) {
}
</style>
