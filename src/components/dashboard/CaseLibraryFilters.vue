<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useDashboard } from '@/api/composables/useDashboard';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/form/fields/AutocompleteField.vue';
import SelectField from '@/components/form/fields/SelectField.vue';

const route = useRoute();
const router = useRouter();
const { filters, fetchFilters } = useDashboard();

const emit = defineEmits<{
    (e: 'change'): void;
    (e: 'close'): void;
}>();

function createQuerySync(queryParam: string, defaultValue = '') {
    return computed({
        get() {
            return (route.query[queryParam] as string) || defaultValue;
        },
        set(newVal) {
            if (newVal !== route.query[queryParam]) {
                const newQuery: Record<string, any> = {
                    ...route.query,
                    [queryParam]: newVal
                };
                if (!newVal) delete newQuery[queryParam];
                if (newQuery.page) delete newQuery.page;

                router.push({ query: newQuery }).then(() => {
                    emit('change');
                });
            }
        }
    });
}

// Ensure the keys match those used in the dashboards
const customerName = createQuerySync('customer_name');
const toolSpecification = createQuerySync('tool_specification');
const insertSpecification = createQuerySync('insert_specification');
// Taxonomy keys in Dashboard are prefixed with hm_ except for industry_segment
const machineType = createQuerySync('hm_machine_type');
const machineMake = createQuerySync('hm_machine_make');
const toolBrand = createQuerySync('hm_tool_brand');
const industrySegment = createQuerySync('industry_segment');
const submittedBy = createQuerySync('submitted_by');

let timeout: number | null = null;
const debouncedUpdateInput = (key: string, value: string) => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => {
        const query = { ...route.query };
        if (value) {
            query[key] = value;
        } else {
            delete query[key];
        }
        if (query.page) delete query.page;
        router.push({ query }).then(() => {
            emit('change');
        });
    }, 500);
};

// For select inputs, since v-model uses the computed property's setter, they update directly
// For text inputs with debouncing, we will use ref for local state and watch to sync it back
const localCustomerName = ref(customerName.value);
const localToolSpec = ref(toolSpecification.value);
const localInsertSpec = ref(insertSpecification.value);

watch(
    () => route.query,
    (newQuery) => {
        localCustomerName.value = (newQuery.customer_name as string) || '';
        localToolSpec.value = (newQuery.tool_specification as string) || '';
        localInsertSpec.value = (newQuery.insert_specification as string) || '';
    }
);

onMounted(() => {
    fetchFilters('library');
});

const appliedSidebarFilters = computed(() => {
    const applied: string[] = [];
    if (route.query.product_type) {
        const pt = filters.value?.product_types?.find((p) => p.slug === route.query.product_type);
        applied.push(`Product Type: ${pt ? pt.name : route.query.product_type}`);
    }
    if (route.query.industry_segment) {
        const seg = filters.value?.industry_segments?.find(
            (s) => s.slug === route.query.industry_segment
        );
        applied.push(`Industry Segment: ${seg ? seg.name : route.query.industry_segment}`);
    }
    if (route.query.submitted_by) {
        const sb = filters.value?.submitted_by?.find(
            (u) => u.id.toString() === route.query.submitted_by
        );
        applied.push(`Submitted By: ${sb ? sb.name : route.query.submitted_by}`);
    }
    if (route.query.date_from) applied.push(`Date (From): ${route.query.date_from}`);
    if (route.query.date_to) applied.push(`Date (To): ${route.query.date_to}`);

    return applied;
});
</script>

<template>
    <div class="users-toolbar users-toolbar--case-library" id="sa-case-library-toolbar">
        <div class="filters-grid">
            <AutocompleteField
                :field="{
                    id: 'sa-case-library-customer-name',
                    label: '',
                    placeholder: 'Customer name',
                    inputType: 'search'
                }"
                v-model="localCustomerName"
                endpoint="/dashboard/autocomplete"
                :extraParams="{ field: 'customer_name', context: 'library' }"
                @update:modelValue="debouncedUpdateInput('customer_name', $event)"
            />

            <SelectField
                :field="{
                    id: 'sa-case-library-industry-segment',
                    label: '',
                    choices: [
                        { text: 'All Industry Segment', value: '' },
                        ...(filters?.industry_segments || []).map((t) => ({
                            text: t.name,
                            value: t.slug
                        }))
                    ]
                }"
                v-model="industrySegment"
            />

            <SelectField
                :field="{
                    id: 'sa-case-library-tool-brand',
                    label: '',
                    choices: [
                        { text: 'All tool brands', value: '' },
                        ...(filters?.tool_brands || []).map((t) => ({
                            text: t.name,
                            value: t.slug
                        }))
                    ]
                }"
                v-model="toolBrand"
            />

            <SelectField
                :field="{
                    id: 'sa-case-library-submitted-by',
                    label: '',
                    choices: [
                        { text: 'Submited by', value: '' },
                        ...(filters?.submitted_by || []).map((u) => ({
                            text: u.name,
                            value: u.id.toString()
                        }))
                    ]
                }"
                v-model="submittedBy"
            />

            <SelectField
                :field="{
                    id: 'sa-case-library-machine-type',
                    label: '',
                    choices: [
                        { text: 'All machine types', value: '' },
                        ...(filters?.machine_types || []).map((t) => ({
                            text: t.name,
                            value: t.slug
                        }))
                    ]
                }"
                v-model="machineType"
            />

            <SelectField
                :field="{
                    id: 'sa-case-library-machine-makes',
                    label: '',
                    choices: [
                        { text: 'All machine makes', value: '' },
                        ...(filters?.machine_makes || []).map((t) => ({
                            text: t.name,
                            value: t.slug
                        }))
                    ]
                }"
                v-model="machineMake"
            />

            <AutocompleteField
                :field="{
                    id: 'sa-case-library-tool-specification',
                    label: '',
                    placeholder: 'Tool Specification',
                    inputType: 'search'
                }"
                v-model="localToolSpec"
                endpoint="/dashboard/autocomplete"
                :extraParams="{ field: 'tool_specification', context: 'library' }"
                @update:modelValue="debouncedUpdateInput('tool_specification', $event)"
            />

            <AutocompleteField
                :field="{
                    id: 'sa-case-library-insert-specification',
                    label: '',
                    placeholder: 'Insert Specification',
                    inputType: 'search'
                }"
                v-model="localInsertSpec"
                endpoint="/dashboard/autocomplete"
                :extraParams="{ field: 'insert_specification', context: 'library' }"
                @update:modelValue="debouncedUpdateInput('insert_specification', $event)"
            />
        </div>

        <div class="d-block d-md-none mt-4 w-100">
            <div v-if="appliedSidebarFilters.length > 0" class="mobile-filters-warning mb-3">
                <div class="fw-bold text-muted small mb-1">Applied Sidebar Filters:</div>
                <ul class="text-muted small mb-0 ps-3">
                    <li v-for="(f, idx) in appliedSidebarFilters" :key="idx">{{ f }}</li>
                </ul>
            </div>
            <button class="btn btn-apply-filters w-100" @click="$emit('close')">
                Apply filters
            </button>
        </div>
    </div>
</template>

<style scoped>
.users-toolbar {
    margin-bottom: 20px;
}

.filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px 10px;
}

.btn-apply-filters {
    background-color: #262469;
    color: white;
    font-size: 20px;
    font-weight: 300;
    border-radius: 5px;
    padding: 10px;
}

@media (min-width: 768px) {
    .filters-grid {
        gap: 10px 15px;
        grid-template-columns: repeat(4, 1fr);
    }

    .users-toolbar--case-library {
        max-width: 900px;
        margin-bottom: 20px;
    }
}
</style>
