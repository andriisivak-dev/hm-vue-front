<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDashboard, useCaseList, useCaseMutations, useCustomerStats } from '@/api';
import DashboardStatisticCard from './DashboardStatisticCard.vue';
import DashboardTabs from './DashboardTabs.vue';
import UsersManagement from './UsersManagement.vue';
import CustomersManagement from './CustomersManagement.vue';
import CasesTable from './CasesTable.vue';
import CaseStudyCard from './CaseStudyCard.vue';
import CaseLibraryFilters from './CaseLibraryFilters.vue';
import SystemHierarchy from './SystemHierarchy.vue';
import RecentActivity from './RecentActivity.vue';
import type { CaseStudy } from './CaseStudyCard.vue';
import AppModal from '@/components/common/AppModal.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import { useActivitiesStore } from '@/stores/activities';
import {
    IconTotalUsers,
    IconTotalCustomers,
    IconPendingReports,
    IconCaseLibraryFilters
} from '@/components/SVG';

const { stats, fetchStats, statsLoading } = useDashboard();
const { total: customersTotal, fetch: fetchCustomerStats } = useCustomerStats();
const route = useRoute();
const router = useRouter();

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

// --- Case Studies Logic ---
const caseTabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'in_review', label: 'Pending Review' },
    { id: 'returned', label: 'Returned to Agent' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'library', label: 'Case Library (Approved)' }
];
const DEFAULT_CASE_TAB = caseTabs[0].id;

const currentCaseTab = computed({
    get() {
        const queryTab = route.query.status as string;
        return caseTabs.some((t) => t.id === queryTab) ? queryTab : DEFAULT_CASE_TAB;
    },
    set(newTab) {
        if (newTab !== route.query.status) {
            const query: Record<string, any> = { ...route.query, status: newTab, page: 1 };
            if (newTab !== 'library') {
                delete query.customer_name;
                delete query.tool_specification;
                delete query.insert_specification;
                delete query.hm_machine_type;
                delete query.hm_machine_make;
                delete query.hm_tool_brand;
            }
            router.push({ query });
            page.value = 1;
        }
    }
});

const page = ref(Number(route.query.page) || 1);
const perPage = ref(10);

const { data: casesData, meta: caseMeta, loading: casesLoading, fetch: fetchCases } = useCaseList();
const { remove: removeCase } = useCaseMutations();
const activitiesStore = useActivitiesStore();

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
        if (currentTab.value === 'sa-casestudy') {
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

    if (currentCaseTab.value === 'library') {
        if (route.query.customer_name) params.customer_name = route.query.customer_name;
        if (route.query.tool_specification)
            params.tool_specification = route.query.tool_specification;
        if (route.query.insert_specification)
            params.insert_specification = route.query.insert_specification;
        if (route.query.hm_machine_type) params.hm_machine_type = route.query.hm_machine_type;
        if (route.query.hm_machine_make) params.hm_machine_make = route.query.hm_machine_make;
        if (route.query.hm_tool_brand) params.hm_tool_brand = route.query.hm_tool_brand;
    }

    fetchCases(params, currentCaseTab.value === 'library');
}

const casesForCurrentTab = computed(() => (casesData.value as unknown as CaseStudy[]) || []);

// CaseStudyCard (draft cards) emits @delete(caseId) — API call lives here.
const handleCaseDelete = async (caseId: number) => {
    const success = await removeCase(caseId);
    if (success) {
        fetchCasePage(page.value);
        await activitiesStore.fetchActivities();
        await fetchStats(true);
    }
};

// CasesTable emits @success after any modal action (approve/reject/return/delete).
// The modals call the API themselves, so we only need to refresh here.
const handleCaseSuccess = () => {
    fetchCasePage(page.value);
    activitiesStore.fetchActivities();
    fetchStats(true);
};

// --- Mobile Filters Modal Logic ---
const caseLibraryFiltersModal = ref<InstanceType<typeof AppModal> | null>(null);
const isMobile = ref(false);
let mediaQueryFilters: MediaQueryList | null = null;

const updateMobileStateFilters = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches;
};

onMounted(() => {
    fetchStats();
    fetchCustomerStats();
    if (currentTab.value === 'sa-casestudy') {
        fetchCasePage(page.value);
    }

    mediaQueryFilters = window.matchMedia('(max-width: 767px)');
    isMobile.value = mediaQueryFilters.matches;
    mediaQueryFilters.addEventListener('change', updateMobileStateFilters);
});

onUnmounted(() => {
    if (mediaQueryFilters) {
        mediaQueryFilters.removeEventListener('change', updateMobileStateFilters);
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
                :number="customersTotal"
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
            <div class="tab-overview">
                <SystemHierarchy />
                <RecentActivity />
            </div>
        </div>
        <div class="sa-tab-content" v-if="currentTab === 'sa-users'">
            <UsersManagement @users-changed="() => fetchStats(true)" />
        </div>
        <div class="sa-tab-content" v-if="currentTab === 'sa-customers'">
            <CustomersManagement @customers-changed="fetchCustomerStats" />
        </div>
        <div class="tab-content" v-if="currentTab === 'sa-casestudy'">
            <!-- Case study content -->
            <div class="case-study-tabs">
                <div class="case-study-tabs-title-wrap">
                    <h3 class="mb-0 title">Case Studies</h3>
                    <div
                        class="filter-icon"
                        v-if="currentCaseTab === 'library'"
                        @click="caseLibraryFiltersModal?.show()"
                    >
                        <IconCaseLibraryFilters />
                    </div>
                </div>
                <DashboardTabs
                    v-model="currentCaseTab"
                    :tabs="caseTabs"
                    containerId="sa-case-tabs"
                />
            </div>

            <div class="fa-tab-content">
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
                                @delete="handleCaseDelete"
                            />
                        </template>
                        <div v-else class="no-case-studies text-center py-5">
                            <p class="text-muted">No draft case studies found.</p>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <AppModal
                        v-if="isMobile && currentCaseTab === 'library'"
                        ref="caseLibraryFiltersModal"
                        id="caseLibraryFiltersModal"
                        title="Filters"
                    >
                        <CaseLibraryFilters
                            @change="fetchCasePage(1)"
                            @close="caseLibraryFiltersModal?.hide()"
                        />
                    </AppModal>

                    <CaseLibraryFilters
                        v-if="!isMobile && currentCaseTab === 'library'"
                        @change="fetchCasePage(1)"
                    />
                    <div v-if="casesLoading" class="card shadow-sm border-0 text-center py-5">
                        <p class="text-muted">Loading case studies...</p>
                    </div>
                    <CasesTable
                        v-else
                        :cases="casesForCurrentTab"
                        :viewMode="currentCaseTab"
                        @success="handleCaseSuccess"
                    />
                </template>
                <AppPagination
                    v-if="casesForCurrentTab.length > 0 && caseMeta && !casesLoading"
                    :meta="caseMeta"
                    v-model:per-page="perPage"
                    @change="fetchCasePage"
                    aria-label="Case studies pagination"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.statistic-cards {
    margin: 20px 0;
    display: flex;
    gap: 10px;
    color: #262469;
}

.case-study-tabs {
    display: grid;
    margin: 16px 0;
}

.filter-icon {
    display: block;
}

.case-study-tabs-title-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.title {
    color: #262469;
    font-weight: 700;
    font-size: 24px;
}

@media (min-width: 767px) {
    .statistic-cards {
        margin: 35px 0;
        gap: 28px;
    }

    .filter-icon {
        display: none;
    }

    .case-study-tabs-title-wrap {
        display: block;
        width: auto;
    }

    .title {
        font-size: 32px;
    }

    .case-study-tabs {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 24px 0;
    }
}

/* ── Overview tab two-column grid ─────────────────────────────────────────── */
.tab-overview {
    margin-top: 34px;
    display: grid;
    align-items: start;
    gap: 24px;
}

@media (min-width: 1100px) {
    .tab-overview {
        grid-template-columns: 1fr 1fr;
    }
}
</style>
