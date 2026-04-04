<script setup lang="ts">
import { onMounted } from 'vue';
import { useActivitiesStore } from '@/stores/activities';

const props = defineProps<{
    showActivities?: boolean;
}>();

const activitiesStore = useActivitiesStore();

onMounted(() => {
    if (props.showActivities) {
        activitiesStore.fetchActivities();
    }
});

const activityItems = [
    { key: 'pending_review', label: 'Pending Review', icon: 'bi-eye' },
    { key: 'returned', label: 'Returned (Requested Info)', icon: 'bi-arrow-return-left' },
    { key: 'approved', label: 'Approved', icon: 'bi-hand-thumbs-up' },
    { key: 'rejected', label: 'Rejected', icon: 'bi-x-circle' },
    { key: 'draft', label: 'Draft', icon: 'bi-file-earmark' }
];
</script>

<template>
    <div v-if="showActivities" class="sidebar-activities js-case-activities">
        <div class="filters-title fw-semibold mb-3">Activities:</div>

        <div v-if="activitiesStore.loading" class="text-muted text-center py-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        </div>

        <div v-else class="d-flex flex-column gap-2">
            <div
                v-for="item in activityItems"
                :key="item.key"
                class="border-act d-flex justify-content-between align-items-center"
            >
                <div class="activity-info">
                    <div class="activity-label">
                        {{ item.label }}
                    </div>
                    <div class="activity-value js-case-activity-value">
                        {{ activitiesStore.stats[item.key] || 0 }}
                    </div>
                </div>
                <div class="icon fs-3 text-white">
                    <i class="bi" :class="item.icon"></i>
                </div>
            </div>
        </div>
    </div>
</template>
