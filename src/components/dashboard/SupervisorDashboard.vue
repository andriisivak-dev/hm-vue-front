<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DashboardTabs from './DashboardTabs.vue';
import CasesTable from './CasesTable.vue';
import CaseStudyCard from './CaseStudyCard.vue';
import CaseLibraryFilters from './CaseLibraryFilters.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import { useCaseList, useCaseMutations } from '@/api';
import type { CaseStudy } from './CaseStudyCard.vue';
import { useActivitiesStore } from '@/stores/activities';

const route = useRoute();
const router = useRouter();

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'in_review', label: 'Pending Review' },
    { id: 'returned', label: 'Returned to Agent' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'library', label: 'Case Library' }
];

const currentTab = computed({
    get() {
        const queryTab = route.query.tab as string;
        return tabs.some((t) => t.id === queryTab) ? queryTab : 'draft';
    },
    set(newTab) {
        if (newTab !== route.query.tab) {
            router.push({ query: { ...route.query, tab: newTab, page: 1 } });
            page.value = 1;
        }
    }
});

const page = ref(Number(route.query.page) || 1);
const perPage = ref(10);

const { data: casesData, meta, loading, fetch } = useCaseList();
const { remove, approve, reject, returnForRevision } = useCaseMutations();
const activitiesStore = useActivitiesStore();

watch(
    () => route.query.page,
    (newPage) => {
        if (newPage) page.value = Number(newPage);
    }
);

watch(
    [
        currentTab,
        perPage,
        () => route.query.product_type,
        () => route.query.industry_segment,
        () => route.query.submitted_by,
        () => route.query.date_from,
        () => route.query.date_to
    ],
    () => {
        fetchPage(1);
    }
);

function fetchPage(p: number) {
    page.value = p;
    router.replace({ query: { ...route.query, page: p } });

    const params: Record<string, unknown> = {
        page: p,
        per_page: perPage.value
    };

    if (currentTab.value !== 'all' && currentTab.value !== 'library') {
        params.status = currentTab.value;
    }

    if (route.query.product_type) params.hm_product_type = route.query.product_type;
    if (route.query.industry_segment) params.hm_industry_segment = route.query.industry_segment;
    if (route.query.submitted_by) params.submitted_by = route.query.submitted_by;
    if (route.query.date_from) params.date_from = route.query.date_from;
    if (route.query.date_to) params.date_to = route.query.date_to;
    if (route.query.customer_name) params.customer_name = route.query.customer_name;
    if (route.query.tool_specification) params.tool_specification = route.query.tool_specification;
    if (route.query.insert_specification)
        params.insert_specification = route.query.insert_specification;
    if (route.query.hm_machine_type) params.hm_machine_type = route.query.hm_machine_type;
    if (route.query.hm_machine_make) params.hm_machine_make = route.query.hm_machine_make;
    if (route.query.hm_tool_brand) params.hm_tool_brand = route.query.hm_tool_brand;
    if (route.query.hm_industry_segment)
        params.hm_industry_segment = route.query.hm_industry_segment;
    if (route.query.date_from) params.date_from = route.query.date_from;
    if (route.query.date_to) params.date_to = route.query.date_to;

    fetch(params, currentTab.value === 'library');
}

onMounted(() => {
    fetchPage(page.value);
});

const casesForCurrentTab = computed(() => (casesData.value as unknown as CaseStudy[]) || []);

const handleDelete = async (caseId: number, caseTitle: string) => {
    if (confirm(`Are you sure you want to delete case #${caseId} (${caseTitle})?`)) {
        const success = await remove(caseId);
        if (success) {
            fetchPage(page.value);
            activitiesStore.fetchActivities();
        }
    }
};

const handleApprove = async (caseId: number) => {
    if (confirm(`Are you sure you want to approve case #${caseId}?`)) {
        const success = await approve(caseId);
        if (success) {
            fetchPage(page.value);
            activitiesStore.fetchActivities();
        }
    }
};

const handleReject = async (caseId: number) => {
    const reason = prompt(`Please enter a reason for rejecting case #${caseId}:`);
    if (reason !== null) {
        const success = await reject(caseId, reason || 'No reason provided');
        if (success) {
            fetchPage(page.value);
            activitiesStore.fetchActivities();
        }
    }
};

const handleReturn = async (caseId: number) => {
    const reason = prompt(`Please enter a reason for returning case #${caseId}:`);
    if (reason !== null) {
        const success = await returnForRevision(caseId, reason || 'Please review and update');
        if (success) {
            fetchPage(page.value);
            activitiesStore.fetchActivities();
        }
    }
};
</script>

<template>
    <div class="mt-4">
        <h3 class="subtitle mb-4">Case Studies from Linked Field Agents</h3>

        <div class="divider"></div>

        <DashboardTabs v-model="currentTab" :tabs="tabs" containerId="supervisor-dashboard-tabs" />

        <div class="divider"></div>

        <div class="fa-tab-content active" style="display: block">
            <!-- Cards View for Drafts -->
            <template v-if="currentTab === 'draft'">
                <div
                    class="fa-case-study-cards case-study-cards js-fa-case-studies position-relative mt-4"
                >
                    <div v-if="loading" class="no-case-studies text-center py-5">
                        <p class="text-muted">Loading case studies...</p>
                    </div>

                    <template v-else-if="casesForCurrentTab.length > 0">
                        <CaseStudyCard
                            v-for="item in casesForCurrentTab"
                            :key="item.id"
                            :case-study="item"
                            @delete="handleDelete"
                        />
                    </template>
                    <div v-else class="no-case-studies text-center py-5">
                        <p class="text-muted">No draft case studies found.</p>
                    </div>
                </div>
            </template>

            <template v-else>
                <CaseLibraryFilters v-if="currentTab === 'library'" @change="fetchPage(1)" />
                <div v-if="loading" class="card shadow-sm border-0 text-center py-5">
                    <p class="text-muted">Loading case studies...</p>
                </div>
                <CasesTable
                    v-else
                    :cases="casesForCurrentTab"
                    :viewMode="currentTab"
                    @delete="handleDelete"
                    @approve="handleApprove"
                    @reject="handleReject"
                    @return="handleReturn"
                />
            </template>

            <!-- Shared Pagination -->
            <AppPagination
                v-if="casesForCurrentTab.length > 0 && meta && !loading"
                :meta="meta"
                v-model:per-page="perPage"
                @change="fetchPage"
                aria-label="Case studies pagination"
                class="mt-4"
            />
        </div>
    </div>
</template>
