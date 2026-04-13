<script setup lang="ts">
import { computed } from 'vue';
import SelectField from '@/components/form/fields/SelectField.vue';

export interface DashboardTab {
    id: string;
    label: string;
}

const props = defineProps<{
    modelValue: string;
    tabs: DashboardTab[];
    containerId?: string;
}>();

defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const mobileFieldProps = computed(
    () =>
        ({
            id: props.containerId || 'mobile_dashboard_tabs',
            type: 'select',
            label: '', // No label needed for tabs dropdown
            choices: props.tabs.map((tab) => ({
                value: tab.id,
                text: tab.label
            })),
            is_required: false
        }) as any
);
</script>

<template>
    <div class="dashboard-tabs-container" :id="containerId">
        <!-- Desktop Tabs -->
        <div class="desktop-tabs case-study-filters d-none d-md-flex">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                class="filter-btn btn"
                :class="modelValue === tab.id ? 'btn-blue active' : 'btn-lgrey'"
                @click="$emit('update:modelValue', tab.id)"
            >
                {{ tab.label }}
            </button>
        </div>

        <!-- Mobile Select -->
        <div class="mobile-tabs d-block d-md-none">
            <SelectField
                :model-value="modelValue"
                @update:model-value="$emit('update:modelValue', String($event))"
                :field="mobileFieldProps"
            />
        </div>
    </div>
</template>

<style scoped>
.dashboard-tabs-container {
    padding: 6px 0 10px;
}

.case-study-filters {
    padding: 10px 0;
    display: flex;
    gap: 15px;
}
</style>
