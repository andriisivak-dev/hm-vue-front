<script setup lang="ts">
import { onMounted } from 'vue';
import { useRecentActivity, type ActivityItem } from '@/api';
import {
    IconActionApprove,
    IconActionReject,
    IconActionReturn,
    IconAddNewUser,
    IconTime
} from '@/components/SVG';

const {
    activities,
    activitiesLoading,
    activitiesLoadingMore,
    activitiesError,
    activitiesHasMore,
    fetchRecentActivity,
    loadMore
} = useRecentActivity(10);

onMounted(() => fetchRecentActivity());

// ── Helpers ──────────────────────────────────────────────────────────────────

function activityTitle(item: ActivityItem): string {
    switch (item.type) {
        case 'case_approved':
            return 'Report Approved';
        case 'case_submitted':
            return 'New Report Submitted';
        case 'case_returned':
            return 'Report Returned';
        case 'case_rejected':
            return 'Report Rejected';
        case 'user_registered':
            return 'New User Added';
        default:
            return 'System Event';
    }
}

/**
 * Returns the main description sentence.
 * Format patterns:
 *  - submitted:  "{actor} submitted a report for review"
 *  - approved:   "{actor} approved {case} (by {author})"
 *  - returned:   "{actor} returned {case} (by {author}) for revision"
 *  - rejected:   "{case} (by {author}) was rejected"   [actor not tracked]
 *  - user:       "{name} joined as {role label} [under {manager}]"
 */
function activityDescription(item: ActivityItem): string {
    const caseLabel = item.case_title ?? `Case #${item.case_id}`;
    const byAuthor = item.case_author_name ? ` (by ${item.case_author_name})` : '';

    switch (item.type) {
        case 'case_submitted':
            return `${item.actor_name || item.case_author_name} submitted a report for review`;

        case 'case_approved':
            return `${item.actor_name || 'Someone'} approved ${caseLabel}${byAuthor}`;

        case 'case_returned':
            return `${item.actor_name || 'Someone'} returned ${caseLabel}${byAuthor} for revision`;

        case 'case_rejected':
            return `${caseLabel}${byAuthor} was rejected`;

        case 'user_registered': {
            const roleLabel = roleDisplayName(item.user_role ?? '');
            const managerPart = item.manager_name ? ` under ${item.manager_name}` : '';
            return `${item.user_name} joined as ${roleLabel}${managerPart}`;
        }

        default:
            return item.message ?? '';
    }
}

/**
 * Extracts the reason text for rejected/returned events.
 * The backend stores messages like: '...was rejected. Reason: some text'
 */
function activityReason(item: ActivityItem): string | null {
    if (item.type !== 'case_rejected' && item.type !== 'case_returned') return null;
    if (!item.message) return null;
    const match = item.message.match(/Reason:\s*(.+)/i);
    return match ? match[1].trim() : null;
}

function roleDisplayName(role: string): string {
    const map: Record<string, string> = {
        hm_field_agent: 'Field Agent',
        hm_manager: 'Supervisor',
        hm_marketing: 'Marketing',
        administrator: 'Super Admin'
    };
    return map[role] ?? role;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString();
}

const isCaseEvent = (type: string) =>
    ['case_approved', 'case_submitted', 'case_returned', 'case_rejected'].includes(type);
</script>

<template>
    <div class="recent-activity">
        <!-- Header -->
        <div class="ra-header">
            <h3 class="ra-title">Recent Activity</h3>
            <p class="ra-subtitle">Latest system actions and updates</p>
        </div>

        <!-- Loading skeleton (initial load) -->
        <div v-if="activitiesLoading" class="ra-skeleton">
            <div v-for="n in 5" :key="n" class="ra-skeleton-item">
                <div class="ra-skeleton-icon"></div>
                <div class="ra-skeleton-body">
                    <div class="ra-skeleton-line ra-skeleton-line--title"></div>
                    <div class="ra-skeleton-line ra-skeleton-line--desc"></div>
                    <div class="ra-skeleton-line ra-skeleton-line--time"></div>
                </div>
            </div>
        </div>

        <template v-else-if="activities && activities.length > 0">
            <!-- Scrollable activity list -->
            <div class="ra-scroll-area">
                <ul class="ra-list">
                    <li
                        v-for="(item, index) in activities"
                        :key="item.id"
                        class="ra-item"
                        :class="[`ra-item--${item.type}`]"
                    >
                        <!-- Icon -->
                        <span class="ra-icon" :aria-label="activityTitle(item)">
                            <IconActionApprove v-if="item.type === 'case_approved'" />
                            <IconTime v-else-if="item.type === 'case_submitted'" />
                            <IconAddNewUser
                                v-else-if="item.type === 'user_registered'"
                                color="#1a1f5e"
                            />
                            <IconActionReject v-else-if="item.type === 'case_rejected'" />
                            <IconActionReturn v-else />
                        </span>

                        <!-- Text content -->
                        <div class="ra-content">
                            <span class="ra-event-title">{{ activityTitle(item) }}</span>

                            <!-- Description with optional case link -->
                            <span class="ra-desc">
                                <template v-if="isCaseEvent(item.type) && item.case_url">
                                    <template v-if="item.type === 'case_approved'">
                                        {{ item.actor_name || 'Someone' }} approved
                                        <a
                                            :href="item.case_url"
                                            class="ra-case-link"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ item.case_title }}
                                        </a>
                                        <template v-if="item.case_author_name">
                                            (by {{ item.case_author_name }})
                                        </template>
                                    </template>
                                    <template v-else-if="item.type === 'case_returned'">
                                        {{ item.actor_name || 'Someone' }} returned
                                        <a
                                            :href="item.case_url"
                                            class="ra-case-link"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ item.case_title }}
                                        </a>
                                        <template v-if="item.case_author_name">
                                            (by {{ item.case_author_name }})
                                        </template>
                                        for revision
                                    </template>
                                    <template v-else-if="item.type === 'case_submitted'">
                                        {{ item.actor_name || item.case_author_name }} submitted
                                        <a
                                            :href="item.case_url"
                                            class="ra-case-link"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ item.case_title }}
                                        </a>
                                        for review
                                    </template>
                                    <template v-else-if="item.type === 'case_rejected'">
                                        <a
                                            :href="item.case_url"
                                            class="ra-case-link"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ item.case_title }}
                                        </a>
                                        <template v-if="item.case_author_name">
                                            (by {{ item.case_author_name }})
                                        </template>
                                        was rejected
                                    </template>
                                </template>
                                <template v-else>{{ activityDescription(item) }}</template>
                            </span>

                            <!-- Reason line (rejected / returned) -->
                            <span v-if="activityReason(item)" class="ra-reason">
                                Reason: {{ activityReason(item) }}
                            </span>

                            <time
                                class="ra-time"
                                :datetime="item.created_at"
                                :title="new Date(item.created_at).toLocaleString()"
                            >
                                {{ timeAgo(item.created_at) }}
                            </time>
                        </div>

                        <!-- Gold divider between items (not after last) -->
                        <div
                            v-if="index < activities.length - 1"
                            class="ra-divider"
                            aria-hidden="true"
                        />
                    </li>
                </ul>

                <!-- Load More button -->
                <div v-if="activitiesHasMore || activitiesLoadingMore" class="ra-load-more">
                    <button
                        class="ra-load-more-btn"
                        :disabled="activitiesLoadingMore"
                        @click="loadMore"
                    >
                        <span v-if="activitiesLoadingMore" class="ra-spinner" aria-hidden="true" />
                        {{ activitiesLoadingMore ? 'Loading…' : 'Load More' }}
                    </button>
                </div>
            </div>
        </template>

        <!-- Empty state -->
        <div v-else-if="!activitiesLoading" class="ra-empty">
            <p>No recent activity to display.</p>
        </div>

        <!-- Error state -->
        <div v-if="activitiesError" class="ra-error">
            <p>Failed to load activity.</p>
        </div>
    </div>
</template>

<style scoped>
.recent-activity {
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 50%) border-box;
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 12px 10px 18px;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.ra-header {
    margin-bottom: 8px;
}

.ra-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1f5e;
    margin: 0 0 4px;
}

.ra-subtitle {
    font-size: 16px;
    margin: 0;
}

/* ── Scrollable area ─────────────────────────────────────────────────────────  */
.ra-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 8px;
    /* custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #1a1f5e #f7f8fc;
}

.ra-scroll-area::-webkit-scrollbar {
    width: 4px;
}
.ra-scroll-area::-webkit-scrollbar-track {
    background: #f7f8fc;
}
.ra-scroll-area::-webkit-scrollbar-thumb {
    background: #1a1f5e;
    border-radius: 4px;
}

/* ── List ───────────────────────────────────────────────────────────────────── */
.ra-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

/* ── Item ───────────────────────────────────────────────────────────────────── */
.ra-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 8px 14px 0;
}

/* ── Icon ───────────────────────────────────────────────────────────────────── */
.ra-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 4px;
    color: #1a1f5e;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ra-icon svg {
    width: 100%;
    display: block;
    height: auto;
}

/* Per-type colour overrides */
.ra-item--case_approved .ra-icon {
    color: #1a7c4e;
}
.ra-item--case_submitted .ra-icon {
    color: #1a1f5e;
}
.ra-item--user_registered .ra-icon {
    color: #1a1f5e;
}
.ra-item--case_rejected .ra-icon {
    color: #b91c1c;
}
.ra-item--case_returned .ra-icon {
    color: #b45309;
}

/* ── Text content ────────────────────────────────────────────────────────────  */
.ra-content {
    gap: 4px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.ra-event-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1f5e;
    line-height: 1.3;
}

.ra-desc {
    font-size: 16px;
    color: #1a1f5e;
    line-height: 1.5;
    word-break: break-word;
}

/* Inline case link */
.ra-case-link {
    color: #262469;
    font-weight: 600;
    text-decoration: none;
}

.ra-case-link:hover {
    text-decoration: underline;
}

.ra-reason {
    font-size: 16px;
    color: #5a3e00;
    background: rgba(212, 160, 23, 0.1);
    border-left: 3px solid #d4a017;
    padding: 3px 8px;
    border-radius: 0 4px 4px 0;
    font-style: italic;
    word-break: break-word;
}

.ra-time {
    font-size: 14px;
    color: #1a1f5e;
}

/* ── Gold divider ─────────────────────────────────────────────────────────── */
.ra-divider {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: #262469;
}

/* ── Load More ────────────────────────────────────────────────────────────── */
.ra-load-more {
    display: flex;
    justify-content: center;
    padding: 20px 0 4px;
}

.ra-load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    border-radius: 5px;
    border: 1px solid #1a1f5e;
    background: transparent;
    color: #1a1f5e;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background 0.15s,
        color 0.15s;
}

.ra-load-more-btn:hover:not(:disabled) {
    background: #1a1f5e;
    color: #fff;
}

.ra-load-more-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

/* Loading spinner inside button */
.ra-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ── Empty / Error states ─────────────────────────────────────────────────── */
.ra-empty,
.ra-error {
    font-size: 14px;
    color: #7b82a8;
    padding: 8px 0 24px;
}
.ra-error {
    color: #c0392b;
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
.ra-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-bottom: 24px;
}

.ra-skeleton-item {
    display: flex;
    gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(212, 160, 23, 0.2);
}

.ra-skeleton-item:last-child {
    border-bottom: none;
}

.ra-skeleton-icon {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(90deg, #ebebf5 25%, #f5f5fc 50%, #ebebf5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
}

.ra-skeleton-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ra-skeleton-line {
    border-radius: 4px;
    background: linear-gradient(90deg, #ebebf5 25%, #f5f5fc 50%, #ebebf5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
}

.ra-skeleton-line--title {
    height: 15px;
    width: 50%;
}
.ra-skeleton-line--desc {
    height: 12px;
    width: 82%;
}
.ra-skeleton-line--time {
    height: 11px;
    width: 22%;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (min-width: 767px) {
    .recent-activity {
        padding: 12px 10px 24px 20px;
    }

    .ra-title {
        font-size: 22px;
    }

    .ra-subtitle {
        font-size: 18px;
    }

    .ra-event-title {
        font-size: 20px;
    }

    .ra-desc {
        font-size: 18px;
    }

    .ra-content {
        gap: 2px;
    }

    .ra-time {
        font-size: 16px;
    }
}
</style>
