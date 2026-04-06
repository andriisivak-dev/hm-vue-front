<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useNotifications } from '@/api';
import NotificationModal from '@/components/dashboard/modals/NotificationModal.vue';
import type { Notification } from '@/api/types';
import { formatTime } from '@/utils';

const {
    data: notifications,
    unreadCount,
    loading,
    fetch,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
} = useNotifications();

const dropdownEl = ref<HTMLElement | null>(null);
const notifModal = ref<InstanceType<typeof NotificationModal> | null>(null);

const loadInitialNotifications = () => {
    if (!notifications.value || notifications.value.length === 0) {
        fetch({ per_page: 5 });
    }
};

onMounted(() => {
    fetchUnreadCount();
    dropdownEl.value?.addEventListener('show.bs.dropdown', loadInitialNotifications);
});

onUnmounted(() => {
    dropdownEl.value?.removeEventListener('show.bs.dropdown', loadInitialNotifications);
});

const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) {
        await markAsRead(notif.id);
    }
    notifModal.value?.open(notif);
};

const handleMarkAllAsRead = async () => {
    if (unreadCount.value > 0) {
        await markAllAsRead();
    }
};
</script>

<template>
    <NotificationModal ref="notifModal" />
    <li ref="dropdownEl" class="nav-item dropdown">
        <a class="nav-link" data-bs-toggle="dropdown" data-bs-auto-close="outside" href="#">
            <i class="bi bi-bell-fill" />
            <span v-if="unreadCount > 0" class="navbar-badge badge text-bg-warning">
                {{ unreadCount }}
            </span>
        </a>
        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
            <span class="dropdown-item dropdown-header"
                >{{ unreadCount }} Unread Notifications</span
            >
            <div class="dropdown-divider" />

            <div v-if="loading" class="dropdown-item text-center text-muted">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Loading...
            </div>

            <template v-else-if="notifications && notifications.length > 0">
                <div v-for="notif in notifications" :key="notif.id">
                    <a
                        href="#"
                        class="dropdown-item"
                        :class="{ 'bg-light': !notif.is_read }"
                        @click.prevent="handleNotifClick(notif)"
                        :title="notif.message"
                    >
                        <div class="d-flex w-100 justify-content-between">
                            <span class="d-block text-truncate" style="max-width: 200px">
                                <i
                                    class="bi me-2"
                                    :class="
                                        notif.is_read
                                            ? 'bi-envelope-open text-muted'
                                            : 'bi-envelope-fill text-primary'
                                    "
                                />
                                <span :class="{ 'fw-bold': !notif.is_read }">
                                    {{ notif.message }}
                                </span>
                            </span>
                        </div>
                        <div class="text-end text-muted text-sm mt-1" style="font-size: 0.75rem">
                            {{ formatTime(notif.created_at) }}
                        </div>
                    </a>
                    <div class="dropdown-divider" />
                </div>
            </template>

            <div v-else-if="!loading" class="dropdown-item text-center text-muted">
                No notifications
            </div>

            <a
                href="#"
                v-if="unreadCount > 0"
                class="dropdown-item dropdown-footer text-center mt-2"
                @click.prevent.stop="handleMarkAllAsRead"
            >
                Mark All as Read
            </a>
        </div>
    </li>
</template>
