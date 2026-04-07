<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import type { Notification } from '@/api/types';
import { formatTime } from '@/utils';

defineEmits(['read']);

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const notification = ref<Notification | null>(null);

function open(notif: Notification) {
    notification.value = notif;
    baseModal.value?.show();
}

function reset() {
    notification.value = null;
}

defineExpose({ open });

const iconMap: Record<string, string> = {
    case_submitted: 'bi-clipboard-check text-primary',
    case_approved: 'bi-check-circle-fill text-success',
    case_approved_global: 'bi-check-circle text-success',
    case_rejected: 'bi-x-circle-fill text-danger',
    case_rejected_global: 'bi-x-circle text-danger',
    case_returned: 'bi-arrow-counterclockwise text-warning'
};

function getIcon(type: string): string {
    return iconMap[type] ?? 'bi-bell-fill text-secondary';
}

const titleMap: Map<string, string> = new Map([
    ['case_submitted', 'New Case Submitted'],
    ['case_approved', 'Case Approved'],
    ['case_approved_global', 'Case Approved'],
    ['case_rejected', 'Case Rejected'],
    ['case_rejected_global', 'Case Rejected'],
    ['case_returned', 'Case Returned for Revision']
]);

function getTitle(type: string): string {
    return titleMap.get(type) ?? 'Notification';
}

const caseUrl = (caseId: number) => `/case-study/?cid=${caseId}`;
</script>

<template>
    <AppModal
        id="notificationModal"
        :title="notification ? getTitle(notification.type) : 'Notification'"
        ref="baseModal"
        @hidden="reset"
    >
        <template v-if="notification">
            <div class="d-flex align-items-center justify-content-center gap-1 mb-4 flex-column">
                <i class="bi fs-3 flex-shrink-0" :class="getIcon(notification.type)" />
                <h4 class="mb-0 notification-modal__title text-center">
                    {{ notification.message }}
                </h4>
            </div>

            <div class="mb-4 d-flex items-center justify-content-center gap-3">
                <div>
                    Case ID: <strong>#{{ notification.case_id }}</strong>
                </div>
                <div>
                    <i class="bi bi-clock me-1" />
                    {{ formatTime(notification.created_at) }}
                </div>
            </div>

            <div class="d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">
                    Close
                </button>

                <a :href="`${caseUrl(notification.case_id)}&mode=view`" class="btn btn-primary">
                    <i class="bi bi-box-arrow-up-right me-1" />
                    View Case
                </a>
            </div>
        </template>
    </AppModal>
</template>

<style scoped>
.notification-modal__title {
    font-weight: 600;
}
</style>
