<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserMutations } from '@/api';
import type { User } from '@/api/types';
import AppModal from '@/components/common/AppModal.vue';

const emit = defineEmits(['success']);

const { remove, loading } = useUserMutations();

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const alertMsg = ref('');
const alertType = ref('danger');
const user = ref<User | null>(null);

function open(userData: User) {
    user.value = userData;
    baseModal.value?.show();
    alertMsg.value = '';
}

const displayUserName = computed(() => {
    if (!user.value) return 'this user';
    return (
        user.value.full_name ||
        (user.value as unknown as Record<string, string>).display_name ||
        'this user'
    );
});

defineExpose({ open });

async function onConfirm() {
    if (!user.value?.id) {
        alertType.value = 'danger';
        alertMsg.value = 'No user selected.';
        return;
    }
    alertMsg.value = '';
    try {
        const result = await remove(user.value.id);
        if (result) {
            alertType.value = 'success';
            alertMsg.value = 'User deactivated successfully.';
            emit('success');
            setTimeout(() => {
                baseModal.value?.hide();
            }, 1500);
        } else {
            alertType.value = 'danger';
            alertMsg.value = 'Failed to deactivate user.';
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        if (e instanceof Error) alertMsg.value = e.message;
        else if (e) alertMsg.value = (e as Record<string, string>).message;
        else alertMsg.value = 'An error occurred.';
    }
}

function reset() {
    user.value = null;
    alertMsg.value = '';
}
</script>

<template>
    <AppModal id="deleteUserModal" title="Deactivate User" @hidden="reset" ref="baseModal">
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>
        <p>
            Are you sure you want to deactivate
            <strong id="deleteUserName">{{ displayUserName }}</strong
            >?
        </p>
        <p class="text-muted small">
            The user will not be able to log in, but their historical case data will be preserved.
        </p>
        <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">Cancel</button>
            <button
                type="button"
                class="btn btn-danger"
                id="deleteUserConfirm"
                @click="onConfirm"
                :disabled="loading || !user"
            >
                <span class="btn-text" :class="{ 'd-none': loading }">Deactivate User</span>
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
