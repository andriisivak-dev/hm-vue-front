<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dashboardService } from '@/api/services/dashboardService';
import type { DashboardFilters } from '@/api/types/dashboard';

defineProps<{
    showFilters?: boolean;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const filters = ref<DashboardFilters | null>(null);

const selectedStatus = ref('all');
const selectedProductType = ref('');
const selectedIndustrySegment = ref('');
const selectedSubmittedBy = ref('');
const submittedDateFrom = ref('');
const submittedDateTo = ref('');

onMounted(async () => {
    try {
        loading.value = true;
        filters.value = await dashboardService.getFilters();
    } catch (e: unknown) {
        if (e instanceof Error) {
            error.value = e.message;
        } else {
            error.value = 'Failed to load filters';
        }
    } finally {
        loading.value = false;
    }
});

const resetFilters = () => {
    selectedStatus.value = 'all';
    selectedProductType.value = '';
    selectedIndustrySegment.value = '';
    selectedSubmittedBy.value = '';
    submittedDateFrom.value = '';
    submittedDateTo.value = '';
};
</script>

<template>
    <div v-if="showFilters" class="sidebar-filters with-bottom-line" id="cases-sidebar-filters">
        <h2 class="filters-title fw-semibold mb-2">Filters:</h2>

        <div v-if="loading" class="text-white small mb-3">Loading filters...</div>
        <div v-else-if="error" class="text-danger small mb-3">{{ error }}</div>

        <template v-else>
            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-status">STATUS</label>
                <select
                    v-model="selectedStatus"
                    class="form-select form-select-sm"
                    id="cases-filter-status"
                >
                    <option value="all">All</option>
                    <option v-for="status in filters?.statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-product-type">
                    PRODUCT TYPE
                </label>
                <select
                    v-model="selectedProductType"
                    class="form-select form-select-sm"
                    id="cases-filter-product-type"
                >
                    <option value="">All</option>
                    <option
                        v-for="type in filters?.product_types"
                        :key="type.term_id"
                        :value="type.term_id"
                    >
                        {{ type.name }}
                    </option>
                </select>
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-industry-segment">
                    INDUSTRY SEGMENT
                </label>
                <select
                    v-model="selectedIndustrySegment"
                    class="form-select form-select-sm"
                    id="cases-filter-industry-segment"
                >
                    <option value="">All</option>
                    <option
                        v-for="segment in filters?.industry_segments"
                        :key="segment.term_id"
                        :value="segment.term_id"
                    >
                        {{ segment.name }}
                    </option>
                </select>
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-submitted-by">
                    SUBMITTED BY
                </label>
                <select
                    v-model="selectedSubmittedBy"
                    class="form-select form-select-sm"
                    id="cases-filter-submitted-by"
                >
                    <option value="">All</option>
                    <option v-for="user in filters?.submitted_by" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-submitted-date-from">
                    SUBMITTED DATE (FROM)
                </label>
                <input
                    v-model="submittedDateFrom"
                    type="date"
                    class="form-control form-control-sm"
                    id="cases-filter-submitted-date-from"
                />
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-submitted-date-to">
                    SUBMITTED DATE (TO)
                </label>
                <input
                    v-model="submittedDateTo"
                    type="date"
                    class="form-control form-control-sm"
                    id="cases-filter-submitted-date-to"
                />
            </div>

            <div class="d-grid pt-2">
                <button type="button" @click="resetFilters" class="btn btn-sm btn-warning mb-3">
                    Reset Filters
                </button>
            </div>
        </template>
    </div>
</template>
