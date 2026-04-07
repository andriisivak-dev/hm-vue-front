<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import { useCaseMutations } from '@/api';

const emit = defineEmits(['success']);

const { remove, approve, loading } = useCaseMutations();

const alertMsg = ref('');
const alertType = ref('danger');

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);

const modalState = ref({
    action: '',
    caseId: 0,
    caseTitle: '',
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    buttonText: 'Confirm',
    buttonClass: 'btn-primary'
});

function open(config: {
    action: string;
    caseId: number;
    caseTitle?: string;
    title: string;
    description: string;
    buttonText: string;
    buttonClass: string;
}) {
    modalState.value = { ...modalState.value, ...config };
    alertMsg.value = '';
    baseModal.value?.show();
}

defineExpose({ open });

async function onConfirm() {
    alertMsg.value = '';
    const { action, caseId } = modalState.value;
    let success = false;

    try {
        if (action === 'delete') {
            success = await remove(caseId);
        } else if (action === 'approve') {
            success = await approve(caseId);
        }

        if (success) {
            alertType.value = 'success';
            alertMsg.value = `Case successfully ${action === 'delete' ? 'deleted' : 'approved'}.`;
            emit('success');
            setTimeout(() => {
                baseModal.value?.hide();
            }, 1000);
        } else {
            alertType.value = 'danger';
            alertMsg.value = `Failed to ${action} case.`;
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        alertMsg.value = e instanceof Error ? e.message : 'An error occurred.';
    }
}

function onHidden() {
    alertMsg.value = '';
}
</script>

<template>
    <AppModal
        id="caseActionConfirmModal"
        :title="modalState.title"
        ref="baseModal"
        @hidden="onHidden"
    >
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>
        <h4 v-html="modalState.description"></h4>

        <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">Cancel</button>
            <button
                type="button"
                class="btn"
                :class="modalState.buttonClass"
                @click="onConfirm"
                :disabled="loading"
            >
                <span class="btn-text" :class="{ 'd-none': loading }">{{
                    modalState.buttonText
                }}</span>
                <span
                    class="spinner-border spinner-border-sm btn-spinner"
                    :class="{ 'd-none': !loading }"
                    role="status"
                >
                    <span class="visually-hidden">Loading...</span>
                </span>
            </button>
        </div>
    </AppModal>
</template>
