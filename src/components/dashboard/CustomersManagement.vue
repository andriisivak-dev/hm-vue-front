<script setup lang="ts">
import { ref } from 'vue';
import CustomersTable from './CustomersTable.vue';
import AddCustomerModal from './modals/AddCustomerModal.vue';
import EditCustomerModal from './modals/EditCustomerModal.vue';
import DeleteCustomerModal from './modals/DeleteCustomerModal.vue';
import type { Customer } from '@/api/types';

const emit = defineEmits(['customers-changed']);

const tableRef = ref<InstanceType<typeof CustomersTable> | null>(null);
const addModalRef = ref<InstanceType<typeof AddCustomerModal> | null>(null);
const editModalRef = ref<InstanceType<typeof EditCustomerModal> | null>(null);
const deleteModalRef = ref<InstanceType<typeof DeleteCustomerModal> | null>(null);

function openAdd() {
    addModalRef.value?.open();
}

function openEdit(customer: Customer) {
    editModalRef.value?.open(customer);
}

function openDelete(customer: Customer) {
    deleteModalRef.value?.open(customer);
}

function onSuccess() {
    tableRef.value?.refresh();
    emit('customers-changed');
}
</script>

<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-0 title">Customer Management</h3>
                <p class="subtitle">Manage all customers and their details</p>
            </div>
            <div class="actions-btn">
                <button class="btn btn-blue" @click="openAdd">
                    <i class="bi bi-plus-lg me-2" />
                    Add New Customer
                </button>
            </div>
        </div>

        <CustomersTable ref="tableRef" @edit="openEdit" @delete="openDelete" />

        <!-- Modals -->
        <AddCustomerModal ref="addModalRef" @success="onSuccess" />
        <EditCustomerModal ref="editModalRef" @success="onSuccess" />
        <DeleteCustomerModal ref="deleteModalRef" @success="onSuccess" />
    </div>
</template>
