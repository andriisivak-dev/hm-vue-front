<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserHierarchy } from '@/api';
import type { HierarchyManager } from '@/api';

const { hierarchy, hierarchyLoading, fetchHierarchy } = useUserHierarchy();

// Track which managers are expanded (expanded by default)
const expandedManagers = ref<Set<number>>(new Set());

function toggleManager(managerId: number) {
    if (expandedManagers.value.has(managerId)) {
        expandedManagers.value.delete(managerId);
    } else {
        expandedManagers.value.add(managerId);
    }
    // Trigger reactivity
    expandedManagers.value = new Set(expandedManagers.value);
}

function isExpanded(managerId: number): boolean {
    return expandedManagers.value.has(managerId);
}

onMounted(async () => {
    await fetchHierarchy();
    // Expand all managers by default after load
    if (hierarchy.value?.managers) {
        expandedManagers.value = new Set(
            hierarchy.value.managers
                .filter((m: HierarchyManager) => m.agents_count > 0)
                .map((m: HierarchyManager) => m.id)
        );
    }
});
</script>

<template>
    <div class="system-hierarchy">
        <div class="hierarchy-header">
            <h3 class="hierarchy-title">System Hierarchy</h3>
            <p class="hierarchy-subtitle">User roles and assignments structure</p>
        </div>

        <!-- Loading skeleton -->
        <div v-if="hierarchyLoading" class="hierarchy-skeleton">
            <div class="skeleton-superadmin"></div>
            <div class="skeleton-manager"></div>
            <div class="skeleton-manager"></div>
        </div>

        <template v-else-if="hierarchy">
            <!-- Super Admin row -->
            <div class="sa-row">
                <div class="sa-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                            stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
                    </svg>
                </div>
                <div class="sa-info">
                    <span class="sa-name">Super Admin</span>
                    <span class="sa-desc">Full system access and control</span>
                </div>
            </div>

            <!-- Managers list -->
            <div class="managers-list">
                <div
                    v-for="manager in hierarchy.managers"
                    :key="manager.id"
                    class="manager-block"
                >
                    <!-- Manager row (clickable to expand) -->
                    <button
                        class="manager-row"
                        :aria-expanded="isExpanded(manager.id)"
                        :aria-controls="`agents-${manager.id}`"
                        @click="toggleManager(manager.id)"
                    >
                        <div class="manager-left">
                            <span class="manager-icon">
                                <!-- dual-person icon -->
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
                                        fill="currentColor" />
                                </svg>
                            </span>
                            <div class="manager-info">
                                <span class="manager-name">{{ manager.full_name }}</span>
                                <span class="manager-meta">Supervisor &bull; {{ manager.agents_count }} field agent{{ manager.agents_count !== 1 ? 's' : '' }}</span>
                            </div>
                        </div>
                        <span class="toggle-icon" :class="{ 'toggle-icon--open': isExpanded(manager.id) }">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </span>
                    </button>

                    <!-- Agents list (collapsible) -->
                    <div
                        v-if="isExpanded(manager.id)"
                        :id="`agents-${manager.id}`"
                        class="agents-list"
                    >
                        <div
                            v-for="agent in manager.agents"
                            :key="agent.id"
                            class="agent-row"
                        >
                            <span class="agent-dot">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="9" stroke="#D4A017" stroke-width="2" />
                                </svg>
                            </span>
                            <span class="agent-name">{{ agent.full_name }} <span class="agent-role">(Field Agent)</span></span>
                        </div>

                        <div v-if="manager.agents.length === 0" class="no-agents">
                            No field agents assigned yet.
                        </div>
                    </div>
                </div>

                <!-- Empty state if no managers -->
                <div v-if="hierarchy.managers.length === 0" class="no-managers">
                    No supervisors have been created yet.
                </div>
            </div>
        </template>

        <!-- Error state -->
        <div v-else class="hierarchy-error">
            <p>Unable to load hierarchy.</p>
        </div>
    </div>
</template>

<style scoped>
.system-hierarchy {
    background: #fff;
    border: 1px solid #e5e7f0;
    border-radius: 16px;
    padding: 28px 28px 32px;
    max-width: 720px;
}

/* Header */
.hierarchy-header {
    margin-bottom: 24px;
}

.hierarchy-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1f5e;
    margin: 0 0 4px;
}

.hierarchy-subtitle {
    font-size: 14px;
    color: #7b82a8;
    margin: 0;
}

/* Super Admin row */
.sa-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(90deg, #1a1f5e 0%, #8a4f10 100%);
    border-radius: 10px;
    padding: 18px 22px;
    color: #fff;
    margin-bottom: 16px;
}

.sa-icon {
    flex-shrink: 0;
    color: #fff;
    opacity: 0.9;
}

.sa-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sa-name {
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
}

.sa-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.75);
}

/* Managers list */
.managers-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 20px;
}

.manager-block {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e8eaf2;
    background: #f7f8fc;
}

/* Manager row button */
.manager-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
}

.manager-row:hover {
    background: #eef0f9;
}

.manager-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.manager-icon {
    color: #262469;
    flex-shrink: 0;
}

.manager-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.manager-name {
    font-size: 16px;
    font-weight: 700;
    color: #1a1f5e;
    line-height: 1.3;
}

.manager-meta {
    font-size: 13px;
    color: #7b82a8;
}

/* Toggle chevron */
.toggle-icon {
    flex-shrink: 0;
    color: #262469;
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
}

.toggle-icon--open {
    transform: rotate(180deg);
}

/* Agents list */
.agents-list {
    padding: 8px 18px 16px 46px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid #e8eaf2;
    background: #fff;
}

.agent-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.agent-dot {
    flex-shrink: 0;
    color: #D4A017;
}

.agent-name {
    font-size: 14px;
    color: #2d3580;
    font-weight: 500;
}

.agent-role {
    font-weight: 400;
    color: #7b82a8;
}

/* Empty / error states */
.no-agents,
.no-managers {
    font-size: 14px;
    color: #7b82a8;
    padding: 8px 0;
}

.hierarchy-error {
    color: #c0392b;
    font-size: 14px;
    padding: 12px 0;
}

/* Loading skeleton */
.hierarchy-skeleton {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-superadmin,
.skeleton-manager {
    border-radius: 10px;
    background: linear-gradient(90deg, #ebebf5 25%, #f5f5fc 50%, #ebebf5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
}

.skeleton-superadmin {
    height: 68px;
}

.skeleton-manager {
    height: 56px;
    margin-left: 20px;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

@media (max-width: 767px) {
    .system-hierarchy {
        padding: 20px 16px 24px;
    }

    .managers-list {
        padding-left: 0;
    }

    .agents-list {
        padding-left: 36px;
    }
}
</style>
