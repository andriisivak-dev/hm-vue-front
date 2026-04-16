<script setup lang="ts">
import { onMounted, type Component } from 'vue';
import { useActivitiesStore } from '@/stores/activities';
import {
    IconActivitiesArrow,
    IconActivitiesPen,
    IconActivitiesEye,
    IconActivitiesCheck,
    IconActivitiesThumb
} from '@/components/SVG';

const props = defineProps<{
    showActivities?: boolean;
}>();

const activitiesStore = useActivitiesStore();

onMounted(() => {
    if (props.showActivities) {
        activitiesStore.fetchActivities();
    }
});

interface ActivityItem {
    key: 'pending_review' | 'returned' | 'approved' | 'rejected' | 'draft';
    label: string;
    icon: Component;
}

const activityItems: ActivityItem[] = [
    { key: 'pending_review', label: 'Pending Review', icon: IconActivitiesEye },
    { key: 'returned', label: 'Returned (Requested Info)', icon: IconActivitiesArrow },
    { key: 'approved', label: 'Approved', icon: IconActivitiesThumb },
    { key: 'rejected', label: 'Rejected', icon: IconActivitiesPen },
    { key: 'draft', label: 'Draft', icon: IconActivitiesCheck }
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
                    <component :is="item.icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.filters-title {
    font-size: 20px;
    font-weight: 700;
    color: #efefef;
}

.border-act {
    background:
        linear-gradient(#262469, #262469) padding-box,
        linear-gradient(225deg, #f7931d 0%, white 56%, transparent 100%) border-box;
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 10px 17px;
    max-width: 260px;
    height: auto;
}

.sidebar-activities {
    padding: 14px 0 20px;
}

.activity-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.activity-label {
    font-weight: 300;
    font-size: 16px;
    text-transform: uppercase;
    color: #fff;
}

.activity-value {
    font-weight: 700;
    font-size: 28px;
    text-transform: uppercase;
    line-height: 1;
    color: #fff;
}

@media (min-width: 767px) {
    .filters-title {
        font-size: 28px;
    }

    .activity-value {
        font-size: 32px;
    }

    .sidebar-activities {
        padding: 18px 0 30px;
    }
}
</style>
