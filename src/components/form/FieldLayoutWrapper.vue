<script setup lang="ts">
import { computed } from 'vue';
import type { GFLayout } from '@/form-engine/types';

const props = defineProps<{
    layout: GFLayout;
    isVisible?: boolean;
}>();

const spanStyle = computed(() => ({
    '--field-col-span': props.layout.columnSpan,
    '--field-spacer-span': props.layout.spacerColumnSpan
}));
</script>

<template>
    <div
        v-show="isVisible"
        class="gf-layout-field"
        :style="spanStyle"
        :data-col-span="layout.columnSpan"
    >
        <slot />
    </div>
</template>

<style scoped>
.gf-layout-field {
    grid-column: 1 / -1;
}

@media (min-width: 767px) {
    .gf-layout-field {
        grid-column: span var(--field-col-span, 12);
        min-width: 0;
    }
}
</style>
