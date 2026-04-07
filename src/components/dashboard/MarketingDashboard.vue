<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCaseList } from '@/api';
import CasesTable from './CasesTable.vue';
import CaseLibraryFilters from './CaseLibraryFilters.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import type { CaseStudy } from './CaseStudyCard.vue';

const route = useRoute();
const router = useRouter();

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
        perPage,
        () => route.query.product_type,
        () => route.query.industry_segment,
        () => route.query.submitted_by,
        () => route.query.date_from,
        () => route.query.date_to
    ],
    () => {
        fetchCasePage(1);
    }
);

function fetchCasePage(p: number) {
    page.value = p;
    router.replace({ query: { ...route.query, page: p } });

    const params: Record<string, unknown> = {
        page: p,
        per_page: perPage.value
    };

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

    fetchCases(params, true); // true sets the endpoint to /case-library
}

const casesForCurrentTab = computed(() => (casesData.value as unknown as CaseStudy[]) || []);

onMounted(() => {
    fetchCasePage(page.value);
});
</script>

<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4 mt-4">
            <div>
                <h3 class="mb-0 title">Case Library</h3>
            </div>
        </div>

        <div class="fa-tab-content active" style="display: block">
            <CaseLibraryFilters @change="fetchCasePage(1)" />

            <div v-if="casesLoading" class="card shadow-sm border-0 text-center py-5">
                <p class="text-muted">Loading case studies...</p>
            </div>

            <CasesTable v-else :cases="casesForCurrentTab" viewMode="library" />

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
</template>
