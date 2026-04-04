<script setup lang="ts">
export interface DashboardTab {
    id: string;
    label: string;
}

defineProps<{
    modelValue: string;
    tabs: DashboardTab[];
    containerId?: string;
}>();

defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
    <div class="case-study-filters" :id="containerId">
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
</template>
