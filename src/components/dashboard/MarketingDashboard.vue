<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDashboard, useCaseList } from '@/api';
import DashboardStatisticCard from './DashboardStatisticCard.vue';
import DashboardTabs from './DashboardTabs.vue';
import UsersManagement from './UsersManagement.vue';
import CasesTable from './CasesTable.vue';
import CaseStudyCard from './CaseStudyCard.vue';
import type { CaseStudy } from './CaseStudyCard.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import { IconTotalUsers, IconTotalCustomers, IconPendingReports } from '@/components/SVG';

const { stats, fetchStats, statsLoading } = useDashboard();
const route = useRoute();
const router = useRouter();

const tabs = [
    { id: 'mk-overview', label: 'Overview' },
    { id: 'mk-users', label: 'Users Management' },
    { id: 'mk-customers', label: 'Customer Management' },
    { id: 'mk-casestudy', label: 'Case Study' }
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

// --- Case Studies Logic ---
const caseTabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'in_review', label: 'Pending Review' },
    { id: 'returned', label: 'Returned to Agent' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'library', label: 'Case Library' }
];

const currentCaseTab = computed({
    get() {
        const queryTab = route.query.status as string;
        return caseTabs.some((t) => t.id === queryTab) ? queryTab : 'draft';
    },
    set(newTab) {
        if (newTab !== route.query.status) {
            router.push({ query: { ...route.query, status: newTab, page: 1 } });
            page.value = 1;
        }
    }
});

const page = ref(Number(route.query.page) || 1);
const perPage = ref(10);

const { data: casesData, meta: caseMeta, loading: casesLoading, fetch: fetchCases } = useCaseList();

watch(
    () => route.query.page,
    (newPage) => {
        if (newPage) page.value = Number(newPage);
    }
);

watch(
    [
        currentCaseTab,
        perPage,
        () => route.query.product_type,
        () => route.query.industry_segment,
        () => route.query.submitted_by,
        () => route.query.date_from,
        () => route.query.date_to,
        currentTab
    ],
    () => {
        if (currentTab.value === 'mk-casestudy') {
            fetchCasePage(1);
        }
    }
);

function fetchCasePage(p: number) {
    page.value = p;
    router.replace({ query: { ...route.query, page: p } });

    const params: Record<string, unknown> = {
        page: p,
        per_page: perPage.value
    };

    if (currentCaseTab.value !== 'all' && currentCaseTab.value !== 'library') {
        params.status = currentCaseTab.value;
    }

    if (route.query.product_type) params.hm_product_type = route.query.product_type;
    if (route.query.industry_segment) params.hm_industry_segment = route.query.industry_segment;
    if (route.query.submitted_by) params.submitted_by = route.query.submitted_by;
    if (route.query.date_from) params.date_from = route.query.date_from;
    if (route.query.date_to) params.date_to = route.query.date_to;

    fetchCases(params, currentCaseTab.value === 'library');
}

const casesForCurrentTab = computed(() => (casesData.value as unknown as CaseStudy[]) || []);

onMounted(() => {
    fetchStats();
    if (currentTab.value === 'mk-casestudy') {
        fetchCasePage(page.value);
    }
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
        <DashboardTabs v-model="currentTab" :tabs="tabs" containerId="mk-dashboard-tabs" />
        <div class="divider"></div>

        <!-- Tab content placeholders -->
        <div class="tab-content" v-if="currentTab === 'mk-overview'">
            <!-- Overview content -->
        </div>
        <div class="sa-tab-content" v-if="currentTab === 'mk-users'">
            <UsersManagement @users-changed="() => fetchStats(true)" />
        </div>
        <div class="tab-content" v-if="currentTab === 'mk-customers'">
            <!-- Customer management content -->
        </div>
        <div class="tab-content" v-if="currentTab === 'mk-casestudy'">
            <!-- Case study content -->
            <DashboardTabs v-model="currentCaseTab" :tabs="caseTabs" containerId="mk-case-tabs" />
            <div class="divider"></div>

            <div class="fa-tab-content active" style="display: block">
                <template v-if="currentCaseTab === 'draft'">
                    <div
                        class="fa-case-study-cards case-study-cards js-fa-case-studies position-relative mt-4"
                    >
                        <div v-if="casesLoading" class="no-case-studies text-center py-5">
                            <p class="text-muted">Loading case studies...</p>
                        </div>
                        <template v-else-if="casesForCurrentTab.length > 0">
                            <CaseStudyCard
                                v-for="item in casesForCurrentTab"
                                :key="item.id"
                                :case-study="item"
                            />
                        </template>
                        <div v-else class="no-case-studies text-center py-5">
                            <p class="text-muted">No draft case studies found.</p>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div v-if="casesLoading" class="card shadow-sm border-0 text-center py-5">
                        <p class="text-muted">Loading case studies...</p>
                    </div>
                    <CasesTable v-else :cases="casesForCurrentTab" :viewMode="currentCaseTab" />
                </template>
                <AppPagination
                    v-if="casesForCurrentTab.length > 0 && caseMeta && !casesLoading"
                    :meta="caseMeta"
                    v-model:per-page="perPage"
                    @change="fetchCasePage"
                    aria-label="Case studies pagination"
                    class="mt-4"
                />
            </div>
        </div>
    </div>
</template>
