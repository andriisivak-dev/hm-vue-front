<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { usersService } from '@/api';

const userStore = useUserStore();

const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const message = ref('');
const messageType = ref(''); // 'success', 'danger', 'warning'

const displayName = computed(() => userStore.user?.name || 'Имя Пользователя');
const avatarUrl = computed(() => userStore.user?.avatar || '/path-to-default-avatar.jpg');
const memberSince = computed(() => userStore.user?.memberSince || '');
const logoutUrl = computed(() => userStore.logoutUrl || '/logout');

const triggerUpload = () => {
    if (!isUploading.value && fileInput.value) {
        fileInput.value.click();
    }
};

const setMessage = (text: string, type: 'success' | 'danger' | 'warning' | '' = '') => {
    message.value = text;
    messageType.value = type;
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        setMessage('Only formats JPG, PNG, WEBP, or JPG.', 'danger');
        target.value = '';
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        setMessage('Avatar size must be no more than 3MB.', 'danger');
        target.value = '';
        return;
    }

    setMessage('Loading...', 'warning');
    isUploading.value = true;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const payload = await usersService.updateAvatar(formData);

        if (payload?.avatar_url) {
            const newUrl = payload.avatar_url;
            userStore.updateAvatar(`${newUrl}${newUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
        }

        setMessage('Avatar changed.', 'success');
    } catch (error) {
        let errorMessage = 'Error updating avatar.';

        if (error instanceof Error) {
            errorMessage = error.message;
        }
        // Optional: handle cases where a string or custom object was thrown
        else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String(error.message);
        }

        setMessage(errorMessage, 'danger');
    } finally {
        isUploading.value = false;
        target.value = ''; // Reset input
    }
};
</script>

<template>
    <li class="nav-item dropdown user-menu">
        <a
            href="#"
            class="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
        >
            <img :src="avatarUrl" class="user-image rounded-circle shadow" alt="User Avatar" />
            <span class="d-none d-md-inline">{{ displayName }}</span>
        </a>

        <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
            <li class="user-header text-bg-primary">
                <div class="position-relative d-inline-block">
                    <img
                        :src="avatarUrl"
                        class="rounded-circle shadow"
                        width="90"
                        height="90"
                        alt="User Avatar"
                    />

                    <button
                        type="button"
                        class="btn btn-warning btn-sm rounded-circle position-absolute bottom-0 end-0 p-1 user-profile-dropdown-avatar-button"
                        aria-label="Change avatar"
                        title="Change avatar"
                        :disabled="isUploading"
                        @click.prevent="triggerUpload"
                    >
                        <i class="bi bi-camera-fill"></i>
                    </button>

                    <input
                        ref="fileInput"
                        type="file"
                        class="d-none"
                        accept="image/jpeg,image/png,image/webp"
                        @change="handleFileChange"
                    />
                </div>

                <p>
                    {{ displayName }}
                    <small v-if="memberSince">Member since {{ memberSince }}</small>

                    <small
                        v-if="message"
                        class="d-block mt-2 user-profile-dropdown-notice"
                        :class="`text-${messageType}`"
                    >
                        {{ message }}
                    </small>
                </p>
            </li>

            <li class="user-footer">
                <a :href="logoutUrl" class="btn btn-default btn-flat float-end">Sign Out</a>
            </li>
        </ul>
    </li>
</template>
