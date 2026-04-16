<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useNotifications } from '@/api';
import NotificationModal from '@/components/dashboard/modals/NotificationModal.vue';
import type { Notification } from '@/api/types';
import { formatTime } from '@/utils';

const {
    data: notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    fetch,
    fetchNextPage,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
} = useNotifications();

const dropdownEl = ref<HTMLElement | null>(null);
const notifModal = ref<InstanceType<typeof NotificationModal> | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);
const listEl = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

const setupObserver = () => {
    observer?.disconnect();
    if (!sentinelEl.value) return;

    observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
                fetchNextPage(5);
            }
        },
        { root: listEl.value, threshold: 0.1 }
    );
    observer.observe(sentinelEl.value);
};

watch(sentinelEl, (el) => {
    if (el) setupObserver();
    else observer?.disconnect();
});

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
    observer?.disconnect();
});

const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    notifModal.value?.open(notif);
};

const handleMarkAllAsRead = async () => {
    if (unreadCount.value > 0) await markAllAsRead();
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

        <div class="dropdown-menu dropdown-menu-xl dropdown-menu-end">
            <span class="dropdown-item dropdown-header">
                {{ unreadCount }} Unread Notifications
            </span>
            <div class="dropdown-divider" />

            <div v-if="loading" class="dropdown-item text-center text-muted py-3">
                <span
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                />
                Loading...
            </div>

            <template v-else>
                <div v-if="notifications && notifications.length > 0">
                    <div ref="listEl" class="notif-list">
                        <TransitionGroup name="notif" tag="div">
                            <div v-for="notif in notifications" :key="notif.id">
                                <a
                                    href="#"
                                    class="dropdown-item"
                                    :class="{ 'bg-light': !notif.is_read }"
                                    :title="notif.message"
                                    @click.prevent="handleNotifClick(notif)"
                                >
                                    <div class="d-flex w-100 justify-content-between">
                                        <span class="d-flex">
                                            <i
                                                class="bi me-2 mt-0.5"
                                                :class="
                                                    notif.is_read
                                                        ? 'bi-envelope-open'
                                                        : 'bi-envelope-fill'
                                                "
                                            />
                                            <span
                                                class="notif-message"
                                                :class="{ 'fw-bold': !notif.is_read }"
                                            >
                                                {{ notif.message }}
                                            </span>
                                        </span>
                                    </div>
                                    <div
                                        class="text-end text-muted mt-1"
                                        style="font-size: 0.75rem"
                                    >
                                        {{ formatTime(notif.created_at) }}
                                    </div>
                                </a>
                                <div class="dropdown-divider" />
                            </div>
                        </TransitionGroup>

                        <div v-if="hasMore" ref="sentinelEl" class="notif-sentinel">
                            <span
                                v-if="loadingMore"
                                class="spinner-border spinner-border-sm text-muted"
                                role="status"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </div>

                <div v-else class="dropdown-item text-center text-muted py-3">No notifications</div>
            </template>

            <a
                v-if="unreadCount > 0"
                href="#"
                class="dropdown-item dropdown-footer text-center mt-2"
                @click.prevent.stop="handleMarkAllAsRead"
            >
                Mark All as Read
            </a>
        </div>
    </li>
</template>

<style scoped>
.notif-list {
    max-height: 340px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
}

.notif-sentinel {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 36px;
    padding: 4px;
}

.notif-enter-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}
.notif-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.dropdown-menu-end[data-bs-popper] {
    right: -45px;
}

.bi {
    color: var(--hm-primary);
}

.notif-message {
    font-size: 14px;
    display: -webkit-box !important;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
}

@media (min-width: 767px) {
    .dropdown-menu-end[data-bs-popper] {
        right: 0;
    }
}
</style>
