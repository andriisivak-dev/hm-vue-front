<script setup lang="ts">
defineProps<{
    show: boolean;
    ariaLabel?: string;
}>();
</script>

<template>
    <transition name="fade">
        <div class="app-table-wrapper" v-show="show">
            <table class="table table-hover mb-0" :aria-label="ariaLabel">
                <thead class="table-light">
                    <slot name="head"></slot>
                </thead>
                <TransitionGroup name="table-row" tag="tbody">
                    <slot name="body"></slot>
                </TransitionGroup>
            </table>
        </div>
    </transition>
</template>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.table-row-move,
.table-row-enter-active,
.table-row-leave-active {
    transition:
        opacity 0.3s ease,
        background-color 0.3s ease;
}
.table-row-enter-from,
.table-row-leave-to {
    opacity: 0;
}

/* Table */
.app-table-wrapper {
    border-radius: 5px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 50%) border-box;
    border: 1px solid transparent;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 80vh;
}

.table {
    border-collapse: separate;
    border-spacing: 0;
}

:deep(td),
:deep(th) {
    color: #262469;
}

:deep(tbody td) {
    background: #fff;
}

:deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 3;
    background: #f8f9fa;
    box-shadow: 0 1px 0 #dee2e6;
    white-space: nowrap;
}

:deep(th:first-child),
:deep(td:first-child) {
    position: sticky;
    left: 0;
    z-index: 2;
    border-right: 1px solid #dee2e6;
}
:deep(td:first-child) {
    background: #fff;
}
:deep(thead th:first-child) {
    background: #fff;
}

:deep(th:last-child),
:deep(td:last-child) {
    position: sticky;
    right: 0;
    z-index: 2;
    border-left: 1px solid #dee2e6;
}
:deep(td:last-child) {
    background: #fff;
}
:deep(thead th:last-child) {
    background: #fff;
}

:deep(thead th:first-child),
:deep(thead th:last-child) {
    z-index: 4;
}

:deep(tbody td:last-child),
:deep(thead th:last-child) {
    padding-right: 8px !important;
}

:deep(tbody td:first-child),
:deep(thead th:first-child) {
    padding-left: 8px !important;
    min-width: 50px;
}
</style>
