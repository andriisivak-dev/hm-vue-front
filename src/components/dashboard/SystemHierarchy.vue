<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserHierarchy } from '@/api';
import type { HierarchyManager } from '@/api';
import { IconAddNewUser, IconShield, IconToggle, IconUsers } from '@/components/SVG';

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
                    <IconShield />
                </div>
                <div class="sa-info">
                    <span class="sa-name">Super Admin</span>
                    <span class="sa-desc">Full system access and control</span>
                </div>
            </div>

            <!-- Marketings list -->
            <div class="managers-list marketing-list mb-3">
                <div
                    v-for="marketing in hierarchy.marketing"
                    :key="marketing.id"
                    class="manager-block"
                >
                    <div class="manager-row">
                        <div class="manager-left">
                            <span class="manager-icon">
                                <IconAddNewUser />
                            </span>
                            <div class="manager-info">
                                <span class="manager-name">{{ marketing.full_name }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Managers list -->
            <div class="managers-list">
                <div v-for="manager in hierarchy.managers" :key="manager.id" class="manager-block">
                    <!-- Manager row (clickable to expand) -->
                    <button
                        class="manager-row"
                        :aria-expanded="isExpanded(manager.id)"
                        :aria-controls="`agents-${manager.id}`"
                        @click="toggleManager(manager.id)"
                    >
                        <div class="manager-left">
                            <span class="manager-icon">
                                <IconUsers />
                            </span>
                            <div class="manager-info">
                                <span class="manager-name">{{ manager.full_name }}</span>
                                <span class="manager-meta"
                                    >Supervisor &bull; {{ manager.agents_count }} field agent{{
                                        manager.agents_count !== 1 ? 's' : ''
                                    }}</span
                                >
                            </div>
                        </div>
                        <span
                            class="toggle-icon"
                            :class="{ 'toggle-icon--open': isExpanded(manager.id) }"
                        >
                            <IconToggle />
                        </span>
                    </button>

                    <!-- Agents list (collapsible) -->
                    <div
                        v-if="isExpanded(manager.id)"
                        :id="`agents-${manager.id}`"
                        class="agents-list"
                    >
                        <div v-for="agent in manager.agents" :key="agent.id" class="agent-row">
                            <span class="agent-dot" />
                            <span class="agent-name"
                                >{{ agent.full_name }}
                                <span class="agent-role">(Field Agent)</span></span
                            >
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
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 50%) border-box;
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 12px 10px 18px;
}

/* Header */
.hierarchy-header {
    margin-bottom: 12px;
}

.hierarchy-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1f5e;
    margin: 0 0 4px;
}

.hierarchy-subtitle {
    font-size: 16px;
    margin: 0;
}

/* Super Admin row */
.sa-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: linear-gradient(225deg, #f7931d 10px, #262469 242px);
    border-radius: 5px;
    padding: 8px 16px 6px;
    color: #fff;
    margin-bottom: 14px;
}

.sa-icon {
    flex-shrink: 0;
    color: #fff;
}

.sa-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sa-name {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
}

.sa-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.75);
}

/* Marketing list */
.marketing-list .manager-icon {
    margin-top: 3px;
    width: 20px;
}

.marketing-list .manager-block {
    background-color: #fff;
}

.marketing-list .manager-icon svg {
    display: block;
    width: 100%;
    height: auto;
}

/* Managers list */
.managers-list {
    padding-left: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.manager-block {
    border-radius: 5px;
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
    padding: 8px 18px 6px 16px;
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
    align-items: flex-start;
    gap: 12px;
}

.manager-icon {
    flex-shrink: 0;
}

.manager-info {
    display: flex;
    flex-direction: column;
}

.manager-name {
    font-size: 18px;
    font-weight: 700;
    color: #1a1f5e;
    line-height: 1.3;
}

.manager-meta {
    font-size: 16px;
    color: #1a1f5e;
}

/* Toggle chevron */
.toggle-icon {
    width: 16px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
}

.toggle-icon--open {
    transform: rotate(180deg);
}

/* Agents list */
.agents-list {
    padding: 10px 10px 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid #e8eaf2;
    background: #fff;
}

.agent-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.agent-dot {
    flex-shrink: 0;
    width: 15px;
    height: 15px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    border-radius: 50%;
}

.agent-name {
    font-size: 16px;
    color: #2d3580;
}

.agent-role {
    color: #2d3580;
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
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (min-width: 767px) {
    .system-hierarchy {
        padding: 12px 20px 24px;
    }

    .hierarchy-title {
        font-size: 22px;
    }

    .hierarchy-subtitle {
        font-size: 18px;
    }

    .sa-name {
        font-size: 20px;
    }

    .manager-name {
        font-size: 20px;
    }

    .toggle-icon {
        width: 21px;
    }

    .managers-list {
        padding-left: 20px;
    }

    .agents-list {
        padding: 14px 18px 14px 20px;
    }
}
</style>

<style>
.marketing-list .manager-icon svg line {
    display: none;
}
</style>
