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
    <!-- Spacer — rendered only when GF has explicit empty columns after the field -->
    <div
        v-if="layout.spacerColumnSpan > 0"
        v-show="isVisible"
        class="gf-layout-spacer"
        :style="{ '--spacer-col-span': layout.spacerColumnSpan }"
        aria-hidden="true"
    />
</template>

<style scoped>
.gf-layout-field {
    grid-column: span var(--field-col-span, 12);
    min-width: 0;
}

.gf-layout-spacer {
    grid-column: span var(--spacer-col-span, 0);
}
</style>
