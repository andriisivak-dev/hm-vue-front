<script setup lang="ts">
import { ref } from 'vue';
import UsersTable from './UsersTable.vue';
import AddUserModal from './modals/AddUserModal.vue';
import EditUserModal from './modals/EditUserModal.vue';
import DeleteUserModal from './modals/DeleteUserModal.vue';
import type { User } from '@/api/types';
import { IconAddNewUser } from '@/components/SVG';

const usersTableRef = ref<InstanceType<typeof UsersTable> | null>(null);
const editModalRef = ref<InstanceType<typeof EditUserModal> | null>(null);
const deleteModalRef = ref<InstanceType<typeof DeleteUserModal> | null>(null);
const addModalRef = ref<InstanceType<typeof AddUserModal> | null>(null);

function openAddUser() {
    if (addModalRef.value) {
        addModalRef.value.open();
    }
}

const emit = defineEmits(['users-changed']);

function refreshTable() {
    if (usersTableRef.value) {
        usersTableRef.value.refresh();
    }
    emit('users-changed');
}

function openEditUser(user: User) {
    if (editModalRef.value) {
        editModalRef.value.open(user);
    }
}

function openDeleteUser(user: User) {
    if (deleteModalRef.value) {
        deleteModalRef.value.open(user);
    }
}
</script>

<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-0 title">Users Management</h3>
                <p class="subtitle">Manage all system users and their assignments</p>
            </div>
            <div class="actions-btn">
                <button class="add-new-user-btn btn" @click="openAddUser">
                    <IconAddNewUser />
                    Add New User
                </button>
            </div>
        </div>

        <UsersTable ref="usersTableRef" @edit="openEditUser" @delete="openDeleteUser" />

        <!-- Modals -->
        <AddUserModal ref="addModalRef" @success="refreshTable" />
        <EditUserModal ref="editModalRef" @success="refreshTable" />
        <DeleteUserModal ref="deleteModalRef" @success="refreshTable" />
    </div>
</template>
