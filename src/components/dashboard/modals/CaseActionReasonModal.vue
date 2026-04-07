<script setup lang="ts">
import { ref } from 'vue';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import type { SimpleField } from '@/form-engine/types';
import AppModal from '@/components/common/AppModal.vue';
import TextareaField from '@/components/form/fields/TextareaField.vue';
import { useCaseMutations } from '@/api';

const emit = defineEmits(['success']);

const { reject, returnForRevision, loading } = useCaseMutations();

const alertMsg = ref('');
const alertType = ref('danger');

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);

const modalState = ref({
    action: '',
    caseId: 0,
    title: 'Provide Reason',
    description: 'Please enter a reason:',
    buttonText: 'Submit',
    buttonClass: 'btn-primary'
});

const schema = toTypedSchema(
    z.object({
        reason: z.string().trim().min(5, 'Reason must be at least 5 characters.')
    })
);

const { handleSubmit, resetForm, submitCount } = useForm({
    validationSchema: schema,
    initialValues: { reason: '' }
});

const { value: reason, errorMessage: reasonError } = useField<string>('reason');

const reasonField: SimpleField = {
    id: 'caseReason',
    label: 'Reason',
    is_required: true,
    placeholder: 'Enter your reason here...'
};

function open(config: {
    action: string;
    caseId: number;
    title: string;
    description: string;
    buttonText: string;
    buttonClass: string;
}) {
    modalState.value = config;
    alertMsg.value = '';
    baseModal.value?.show();
}

defineExpose({ open });

const onSubmit = handleSubmit(async (values) => {
    alertMsg.value = '';
    const { action, caseId } = modalState.value;
    let success = false;

    try {
        if (action === 'reject') {
            success = await reject(caseId, values.reason);
        } else if (action === 'return') {
            success = await returnForRevision(caseId, values.reason);
        }

        if (success) {
            alertType.value = 'success';
            alertMsg.value = `Case successfully ${action === 'reject' ? 'rejected' : 'returned'}.`;
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
});

function onHidden() {
    resetForm();
    alertMsg.value = '';
}
</script>

<template>
    <AppModal
        id="caseActionReasonModal"
        :title="modalState.title"
        :description="modalState.description"
        @hidden="onHidden"
        ref="baseModal"
    >
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>
        <form @submit.prevent="onSubmit" novalidate>
            <div class="mb-4">
                <TextareaField
                    :field="reasonField"
                    v-model="reason"
                    :error="submitCount > 0 ? reasonError : undefined"
                />
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn"
                    :class="modalState.buttonClass"
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
        </form>
    </AppModal>
</template>
