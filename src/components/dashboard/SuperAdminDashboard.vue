<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDashboard } from '@/api';
import DashboardStatisticCard from './DashboardStatisticCard.vue';
import DashboardTabs from './DashboardTabs.vue';
import UsersManagement from './UsersManagement.vue';
import { IconTotalUsers, IconTotalCustomers, IconPendingReports } from '@/components/SVG';

const { stats, fetchStats, statsLoading } = useDashboard();
const route = useRoute();
const router = useRouter();

onMounted(() => {
    fetchStats();
});

const tabs = [
    { id: 'sa-overview', label: 'Overview' },
    { id: 'sa-users', label: 'Users Management' },
    { id: 'sa-customers', label: 'Customer Management' },
    { id: 'sa-casestudy', label: 'Case Study' }
];

const currentTab = computed({
    get() {
        const queryTab = route.query.tab as string;
        return tabs.some((t) => t.id === queryTab) ? queryTab : tabs[0].id;
    },
    set(newTab) {
        if (newTab !== route.query.tab) {
            router.push({ query: { ...route.query, tab: newTab } });
        }
    }
});

const userDescription = computed(() => {
    if (!stats.value?.users) return '';
    const { supervisors, agents, marketing } = stats.value.users;
    return `${supervisors}&nbsp;Supervisors, ${agents}&nbsp;Agents, ${marketing}&nbsp;Marketing`;
});
</script>

<template>
    <div>
        <div class="divider"></div>

        <div class="sa-statistic statistic-cards">
            <DashboardStatisticCard
                cardClass="total-users"
                title="Total Users"
                :number="stats?.users?.total ?? 0"
                :loading="statsLoading"
                :description="userDescription"
            >
                <template #icon>
                    <IconTotalUsers />
                </template>
            </DashboardStatisticCard>

            <DashboardStatisticCard
                cardClass="total-customers"
                title="Total Customers"
                number="0"
                :loading="statsLoading"
            >
                <template #icon>
                    <IconTotalCustomers />
                </template>
            </DashboardStatisticCard>

            <DashboardStatisticCard
                cardClass="pending-reports"
                title="Pending Cases"
                :number="stats?.pending_review ?? 0"
                :loading="statsLoading"
                description="Awaiting review"
            >
                <template #icon>
                    <IconPendingReports />
                </template>
            </DashboardStatisticCard>
        </div>

        <div class="divider"></div>
        <DashboardTabs v-model="currentTab" :tabs="tabs" containerId="sa-dashboard-tabs" />
        <div class="divider"></div>

        <!-- Tab content placeholders -->
        <div class="tab-content" v-if="currentTab === 'sa-overview'">
            <!-- Overview content -->
        </div>
        <div class="sa-tab-content" v-if="currentTab === 'sa-users'">
            <UsersManagement @users-changed="() => fetchStats(true)" />
        </div>
        <div class="tab-content" v-if="currentTab === 'sa-customers'">
            <!-- Customer management content -->
        </div>
        <div class="tab-content" v-if="currentTab === 'sa-casestudy'">
            <!-- Case study content -->
        </div>
    </div>
</template>
