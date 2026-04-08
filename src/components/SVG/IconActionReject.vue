<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    color: { type: String, default: 'currentColor', required: false },
    label: { type: String, default: 'Approve', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <circle
            cx="12"
            cy="12"
            r="9"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
        />
        <line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
        />
    </IconActionBase>
</template>
