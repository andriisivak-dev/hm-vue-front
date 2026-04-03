<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotifications } from '@/api';

const {
    data: notifications,
    unreadCount,
    loading,
    fetch,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
} = useNotifications();

onMounted(() => {
    fetchUnreadCount();
});

const loadInitialNotifications = () => {
    // Load first page of notifications when opening the dropdown (if not loaded yet)
    if (!notifications.value || notifications.value.length === 0) {
        fetch({ per_page: 5 });
    }
};

const handleMarkAsRead = async (id: number, isRead: boolean) => {
    if (!isRead) {
        await markAsRead(id);
    }
    // Optional: Navigate to Case page depending on your router setup
    // router.push(`/cases/${caseId}`);
};

const handleMarkAllAsRead = async () => {
    if (unreadCount.value > 0) {
        await markAllAsRead();
    }
};

// Helper for formatting time (simple fallback)
const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    } catch {
        return dateStr;
    }
};
</script>

<template>
    <li class="nav-item dropdown">
        <a class="nav-link" data-bs-toggle="dropdown" href="#" @click="loadInitialNotifications">
            <i class="bi bi-bell-fill"></i>
            <span v-if="unreadCount > 0" class="navbar-badge badge text-bg-warning">{{
                unreadCount
            }}</span>
        </a>
        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
            <span class="dropdown-item dropdown-header"
                >{{ unreadCount }} Unread Notifications</span
            >
            <div class="dropdown-divider"></div>

            <div v-if="loading" class="dropdown-item text-center text-muted">
                <span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                ></span>
                Loading...
            </div>

            <template v-else-if="notifications && notifications.length > 0">
                <div v-for="notif in notifications" :key="notif.id">
                    <a
                        href="#"
                        class="dropdown-item"
                        :class="{ 'bg-light': !notif.is_read }"
                        @click.prevent="handleMarkAsRead(notif.id, notif.is_read)"
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
                                ></i>
                                <span :class="{ 'fw-bold': !notif.is_read }">{{
                                    notif.message
                                }}</span>
                            </span>
                        </div>
                        <div class="text-end text-muted text-sm mt-1" style="font-size: 0.75rem">
                            {{ formatTime(notif.created_at) }}
                        </div>
                    </a>
                    <div class="dropdown-divider"></div>
                </div>
            </template>

            <div v-else-if="!loading" class="dropdown-item text-center text-muted">
                No notifications
            </div>

            <a
                href="#"
                v-if="unreadCount > 0"
                class="dropdown-item dropdown-footer text-center mt-2"
                @click.prevent="handleMarkAllAsRead"
            >
                Mark All as Read
            </a>
        </div>
    </li>
</template>
