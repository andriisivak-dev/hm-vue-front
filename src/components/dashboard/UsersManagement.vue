<script setup lang="ts">
import { ref } from 'vue';
import UsersTable from './UsersTable.vue';
import AddUserModal from './modals/AddUserModal.vue';
import EditUserModal from './modals/EditUserModal.vue';
import DeleteUserModal from './modals/DeleteUserModal.vue';
import RecoverUserModal from './modals/RecoverUserModal.vue';
import type { User } from '@/api/types';
import { IconAddNewUser } from '@/components/SVG';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const usersTableRef = ref<InstanceType<typeof UsersTable> | null>(null);
const editModalRef = ref<InstanceType<typeof EditUserModal> | null>(null);
const deleteModalRef = ref<InstanceType<typeof DeleteUserModal> | null>(null);
const recoverModalRef = ref<InstanceType<typeof RecoverUserModal> | null>(null);
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

function openRecoverUser(user: User) {
    if (recoverModalRef.value) {
        recoverModalRef.value.open(user);
    }
}
</script>

<template>
    <div>
        <div class="user-management-header">
            <div>
                <h3 class="mb-0 title">Users Management</h3>
                <p class="subtitle">Manage all system users and their assignments</p>
            </div>
            <div class="actions-btn" v-if="userStore.user?.role !== 'hm_marketing'">
                <button class="add-new-user-btn btn" @click="openAddUser">
                    <IconAddNewUser />
                    Add New User
                </button>
            </div>
        </div>

        <UsersTable
            ref="usersTableRef"
            @edit="openEditUser"
            @delete="openDeleteUser"
            @recover="openRecoverUser"
        />

        <!-- Modals -->
        <AddUserModal ref="addModalRef" @success="refreshTable" />
        <EditUserModal ref="editModalRef" @success="refreshTable" />
        <DeleteUserModal ref="deleteModalRef" @success="refreshTable" />
        <RecoverUserModal ref="recoverModalRef" @success="refreshTable" />
    </div>
</template>

<style scoped>
.user-management-header {
    margin-bottom: 16px;
}

.title {
    color: #262469;
    font-weight: 700;
    font-size: 24px;
}

.subtitle {
    color: #262469;
    font-weight: 700;
    font-size: 16px;
}

.actions-btn {
    display: block;
}

.add-new-user-btn {
    font-size: 16px;
}

@media (min-width: 767px) {
    .user-management-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .title {
        font-size: 32px;
    }

    .subtitle {
        font-size: 22px;
    }

    .add-new-user-btn {
        font-size: 20px;
    }
}
</style>
