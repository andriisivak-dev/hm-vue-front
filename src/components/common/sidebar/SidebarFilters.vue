<script setup lang="ts">
const props = defineProps<{
    showFilters?: boolean;
}>();
</script>

<template>
    <div v-if="showFilters" class="sidebar-filters with-bottom-line" id="cases-sidebar-filters">
        <h2 class="filters-title fw-semibold mb-2">Filters:</h2>

        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-status">STATUS</label>
            <select class="form-select form-select-sm" id="cases-filter-status">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="in_review">Submitted</option>
                <option value="returned">Returned</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-product-type">PRODUCT TYPE</label>
            <select class="form-select form-select-sm" id="cases-filter-product-type">
                <option value="">All</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-industry-segment">INDUSTRY SEGMENT</label>
            <select class="form-select form-select-sm" id="cases-filter-industry-segment">
                <option value="">All</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-submitted-by">SUBMITTED BY</label>
            <select class="form-select form-select-sm" id="cases-filter-submitted-by">
                <option value="">All</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-submitted-date-from">SUBMITTED DATE (FROM)</label>
            <input type="date" class="form-control form-control-sm" id="cases-filter-submitted-date-from" />
        </div>
        
        <div class="mb-2">
            <label class="form-label small mb-1" for="cases-filter-submitted-date-to">SUBMITTED DATE (TO)</label>
            <input type="date" class="form-control form-control-sm" id="cases-filter-submitted-date-to" />
        </div>

        <div class="d-grid pt-2">
            <button type="button" class="btn btn-sm btn-warning mb-3">
                Reset Filters
            </button>
        </div>
    </div>
</template>
