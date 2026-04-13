<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DashboardTabs from './DashboardTabs.vue';
import CaseStudyCard from './CaseStudyCard.vue';
import CasesTable from './CasesTable.vue';
import CaseLibraryFilters from './CaseLibraryFilters.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import AppModal from '@/components/common/AppModal.vue';
import { useCaseList, useCaseMutations } from '@/api';
import type { CaseStudy } from './CaseStudyCard.vue';
import { IconPlus, IconCaseLibraryFilters } from '@/components/SVG';

const route = useRoute();
const router = useRouter();

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'in_review', label: 'Submitted' },
    { id: 'returned', label: 'Returned to Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'library', label: 'Case Library' }
];

const currentTab = computed({
    get() {
        const queryTab = route.query.tab as string;
        return tabs.some((t) => t.id === queryTab) ? queryTab : 'all';
    },
    set(newTab) {
        if (newTab !== route.query.tab) {
            const query: Record<string, any> = { ...route.query, tab: newTab, page: 1 };
            if (newTab !== 'library') {
                delete query.customer_name;
                delete query.tool_specification;
                delete query.insert_specification;
                delete query.hm_machine_type;
                delete query.hm_machine_make;
                delete query.hm_tool_brand;
                delete query.industry_segment;
                delete query.submitted_by;
            }
            router.push({ query });
            page.value = 1;
        }
    }
});

const page = ref(Number(route.query.page) || 1);
const perPage = ref(10);
const caseLibraryFiltersModal = ref<InstanceType<typeof AppModal> | null>(null);
const isMobile = ref(false);
let mediaQueryFilters: MediaQueryList | null = null;

const { data: casesData, meta, loading, fetch } = useCaseList();
const { remove } = useCaseMutations();

watch(
    () => route.query.page,
    (newPage) => {
        if (newPage) page.value = Number(newPage);
    }
);

watch([currentTab, perPage], () => {
    fetchPage(1);
});

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

    if (currentTab.value === 'library') {
        if (route.query.customer_name) params.customer_name = route.query.customer_name;
        if (route.query.tool_specification)
            params.tool_specification = route.query.tool_specification;
        if (route.query.insert_specification)
            params.insert_specification = route.query.insert_specification;
        if (route.query.hm_machine_type) params.hm_machine_type = route.query.hm_machine_type;
        if (route.query.hm_machine_make) params.hm_machine_make = route.query.hm_machine_make;
        if (route.query.hm_tool_brand) params.hm_tool_brand = route.query.hm_tool_brand;
        if (route.query.industry_segment) params.hm_industry_segment = route.query.industry_segment;
        if (route.query.submitted_by) params.submitted_by = route.query.submitted_by;
    }

    fetch(params, currentTab.value === 'library');
}

onMounted(() => {
    fetchPage(page.value);

    mediaQueryFilters = window.matchMedia('(max-width: 767px)');
    isMobile.value = mediaQueryFilters.matches;
    mediaQueryFilters.addEventListener('change', updateMobileStateFilters);
});

onUnmounted(() => {
    if (mediaQueryFilters) {
        mediaQueryFilters.removeEventListener('change', updateMobileStateFilters);
    }
});

const casesForCurrentTab = computed(() => (casesData.value as unknown as CaseStudy[]) || []);

const updateMobileStateFilters = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches;
};

// CaseStudyCard (draft cards) emits @delete(caseId) — API call lives here.
const handleDelete = async (caseId: number) => {
    const success = await remove(caseId);
    if (success) {
        fetchPage(page.value);
    }
};

// CasesTable emits @success after any modal action (delete etc.).
// The modals call the API themselves, so we only need to refresh here.
const handleCaseSuccess = () => {
    fetchPage(page.value);
};
</script>

<template>
    <div class="mt-4">
        <div class="divider"></div>

        <h3 class="subtitle mt-3">Create and manage your case studies</h3>

        <div class="new-case-study border-linear">
            <div class="icon">
                <IconPlus />
            </div>
            <div class="title">Create New Case Study</div>
            <div class="text">
                Document a new field application with complete details, photos, and results
            </div>
            <router-link to="/case-study" class="new-case-study-btn btn btn-blue">
                Start new case study
            </router-link>
        </div>

        <h3 class="subtitle mt-3 mb-4">Recent Case Studies</h3>

        <div class="divider" />

        <DashboardTabs v-model="currentTab" :tabs="tabs" containerId="fa-dashboard-tabs" />

        <div class="divider" />

        <div class="case-library-heading-wrap" v-if="currentTab === 'library'">
            <h3 class="mb-0 title">Case Library</h3>
            <div class="filter-icon" @click="caseLibraryFiltersModal?.show()">
                <IconCaseLibraryFilters />
            </div>
        </div>

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
                <AppModal
                    v-if="isMobile && currentTab === 'library'"
                    ref="caseLibraryFiltersModal"
                    id="fieldAgentCaseLibraryFiltersModal"
                    title="Filters"
                >
                    <CaseLibraryFilters
                        @change="fetchPage(1)"
                        @close="caseLibraryFiltersModal?.hide()"
                    />
                </AppModal>

                <CaseLibraryFilters
                    v-if="!isMobile && currentTab === 'library'"
                    @change="fetchPage(1)"
                />
                <div v-if="loading" class="card shadow-sm border-0 text-center py-5">
                    <p class="text-muted">Loading case studies...</p>
                </div>
                <CasesTable
                    v-else
                    :cases="casesForCurrentTab"
                    :viewMode="currentTab"
                    @success="handleCaseSuccess"
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

<style scoped>
.case-library-heading-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 12px 0;
}

.title {
    color: #262469;
    font-weight: 700;
    font-size: 24px;
}

.filter-icon {
    display: block;
}

@media (min-width: 767px) {
    .title {
        font-size: 32px;
    }

    .filter-icon {
        display: none;
    }
}
</style>
