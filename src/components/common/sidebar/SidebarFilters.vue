<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { dashboardService } from '@/api/services/dashboardService';
import type { DashboardFilters } from '@/api/types/dashboard';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useUserStore } from '@/stores/user';
import { decodeHtmlEntities } from '@/utils';

defineProps<{
    showFilters?: boolean;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const filters = ref<DashboardFilters | null>(null);

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isSuperAdmin = computed(() =>
    ['administrator', 'hm_administrator'].includes(userStore.user?.role || '')
);
const isSupervisor = computed(() => userStore.user?.role === 'hm_manager');
const isMarketing = computed(() => userStore.user?.role === 'hm_marketing');
const defaultStatus = computed(() => (isSupervisor.value ? 'draft' : 'all'));
const shouldMapLibraryToApproved = computed(() => isSuperAdmin.value || isSupervisor.value);

const statusQueryParam = computed(() => {
    return isSuperAdmin.value || isMarketing.value ? 'status' : 'tab';
});

const isCaseLibraryTab = computed(() => {
    return route.query.tab === 'library' || route.query.status === 'library';
});

const selectedStatus = computed({
    get() {
        const param = statusQueryParam.value;
        const statusVal = route.query[param] as string;
        if (!statusVal) {
            return defaultStatus.value;
        }
        if (shouldMapLibraryToApproved.value && statusVal === 'library') {
            return 'approved';
        }
        return statusVal;
    },
    set(newStatus) {
        const param = statusQueryParam.value;
        const routeStatusRaw = route.query[param] as string | undefined;
        const routeStatusNormalized =
            shouldMapLibraryToApproved.value && routeStatusRaw === 'library'
                ? 'approved'
                : routeStatusRaw;
        if (newStatus !== routeStatusNormalized) {
            const query: Record<string, any> = { ...route.query, page: 1 };
            if (newStatus === defaultStatus.value) {
                delete query[param];
            } else {
                const nextStatus =
                    isSuperAdmin.value && newStatus === 'approved' ? 'library' : newStatus;
                query[param] = nextStatus;
            }
            if (isSuperAdmin.value) {
                query.tab = 'sa-casestudy';
            } else if (isMarketing.value) {
                query.tab = 'mk-casestudy';
            }
            router.push({ query });
        }
    }
});

function createQuerySync(queryParam: string, defaultValue = '') {
    return computed({
        get() {
            return (route.query[queryParam] as string) || defaultValue;
        },
        set(newVal) {
            if (newVal !== route.query[queryParam]) {
                const newQuery: Record<string, any> = {
                    ...route.query,
                    [queryParam]: newVal,
                    page: 1
                };
                if (!newVal) delete newQuery[queryParam];

                if (isSuperAdmin.value) {
                    newQuery.tab = 'sa-casestudy';
                } else if (isMarketing.value) {
                    newQuery.tab = 'mk-casestudy';
                }

                router.push({ query: newQuery });
            }
        }
    });
}

const selectedProductType = createQuerySync('product_type');
const selectedIndustrySegment = createQuerySync('industry_segment');
const selectedSubmittedBy = createQuerySync('submitted_by');
const submittedDateFrom = createQuerySync('date_from');
const submittedDateTo = createQuerySync('date_to');

const today = new Date();
today.setHours(23, 59, 59, 999);

const maxDateFrom = computed(() => {
    if (!submittedDateTo.value) return today;
    const toDate = new Date(submittedDateTo.value);
    return toDate < today ? toDate : today;
});

const minDateTo = computed(() => {
    if (!submittedDateFrom.value) return undefined;
    return new Date(submittedDateFrom.value);
});

const maxDateTo = computed(() => {
    return today;
});

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
    const query: Record<string, any> = { ...route.query };
    delete query.product_type;
    delete query.industry_segment;
    delete query.submitted_by;
    delete query.date_from;
    delete query.date_to;

    if (isSuperAdmin.value) {
        delete query.status;
        query.tab = 'sa-casestudy';
    } else if (isMarketing.value) {
        delete query.status;
        query.tab = 'mk-casestudy';
    } else {
        query.tab = 'all';
    }
    query.page = '1';

    router.push({ query });
};
</script>

<template>
    <div v-if="showFilters" class="sidebar-filters" id="cases-sidebar-filters">
        <h2 class="filters-title fw-semibold mb-2">Filters:</h2>

        <div v-if="loading" class="text-white small mb-3">Loading filters...</div>
        <div v-else-if="error" class="text-danger small mb-3">{{ error }}</div>

        <template v-else>
            <div class="mb-2" v-if="!isMarketing">
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
                        :value="type.slug"
                    >
                        {{ decodeHtmlEntities(type.name) }}
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
                        :value="segment.slug"
                    >
                        {{ decodeHtmlEntities(segment.name) }}
                    </option>
                </select>
            </div>

            <div class="mb-2" v-show="!isCaseLibraryTab">
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
                        {{ decodeHtmlEntities(user.name) }}
                    </option>
                </select>
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-submitted-date-from">
                    SUBMITTED DATE (FROM)
                </label>
                <VueDatePicker
                    v-model="submittedDateFrom"
                    uid="cases-filter-submitted-date-from"
                    :time-config="{ enableTimePicker: false }"
                    :max-date="maxDateFrom"
                    prevent-min-max-navigation
                    auto-apply
                    model-type="yyyy-MM-dd"
                    format="yyyy-MM-dd"
                    placeholder="Select Date"
                    :dark="true"
                    input-class-name="form-control form-control-sm"
                />
            </div>

            <div class="mb-2">
                <label class="form-label small mb-1" for="cases-filter-submitted-date-to">
                    SUBMITTED DATE (TO)
                </label>
                <VueDatePicker
                    v-model="submittedDateTo"
                    uid="cases-filter-submitted-date-to"
                    :time-config="{ enableTimePicker: false }"
                    :min-date="minDateTo"
                    :max-date="maxDateTo"
                    prevent-min-max-navigation
                    auto-apply
                    model-type="yyyy-MM-dd"
                    format="yyyy-MM-dd"
                    placeholder="Select Date"
                    :dark="true"
                    input-class-name="form-control form-control-sm"
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

<style scoped>
.filters-title {
    font-weight: 700;
    font-size: 18px;
    color: #efefef;
}

.form-label {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
}

.sidebar-filters .form-select,
.sidebar-filters :deep(.form-control) {
    font-size: 16px;
    font-weight: 300;
    color: #000;
    width: 100%;
}

.btn-warning {
    font-size: 16px;
    width: 100%;
    min-height: unset;
    height: auto;
}

@media (min-width: 767px) {
    .filters-title {
        font-size: 28px;
    }

    .form-label {
        font-size: 16px;
    }

    .sidebar-filters .form-select,
    .sidebar-filters :deep(.form-control) {
        font-size: 20px;
    }

    .btn-warning {
        font-size: 20px;
        min-height: 43px;
    }
}
</style>
