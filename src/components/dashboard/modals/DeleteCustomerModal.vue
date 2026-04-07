<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCustomerMutations } from '@/api';
import type { Customer } from '@/api/types';
import AppModal from '@/components/common/AppModal.vue';

const emit = defineEmits(['success']);
const { remove, loading } = useCustomerMutations();

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const customer = ref<Customer | null>(null);
const alertMsg = ref('');
const alertType = ref<'success' | 'danger'>('danger');

const displayName = computed(() => customer.value?.company_name || 'this customer');

function open(c: Customer) {
    customer.value = c;
    alertMsg.value = '';
    baseModal.value?.show();
}

defineExpose({ open });

async function onConfirm() {
    if (!customer.value?.id) {
        alertType.value = 'danger';
        alertMsg.value = 'No customer selected.';
        return;
    }

    alertMsg.value = '';
    try {
        const ok = await remove(customer.value.id);
        if (ok) {
            alertType.value = 'success';
            alertMsg.value = 'Customer deleted successfully.';
            emit('success');
            setTimeout(() => baseModal.value?.hide(), 1500);
        } else {
            alertType.value = 'danger';
            alertMsg.value = 'Failed to delete customer.';
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        alertMsg.value = e instanceof Error ? e.message : 'Failed to delete customer.';
    }
}

function onHidden() {
    customer.value = null;
    alertMsg.value = '';
}
</script>

<template>
    <AppModal id="deleteCustomerModal" title="Delete Customer" @hidden="onHidden" ref="baseModal">
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>

        <p class="mb-0">
            Delete <strong id="deleteCustomerName">{{ displayName }}</strong
            >? This action cannot be undone.
        </p>

        <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">Cancel</button>
            <button
                type="button"
                class="btn btn-danger"
                id="deleteCustomerConfirm"
                @click="onConfirm"
                :disabled="loading || !customer"
            >
                <span class="btn-text" :class="{ 'd-none': loading }">Delete</span>
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
