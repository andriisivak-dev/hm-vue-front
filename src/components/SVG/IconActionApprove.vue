<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, default: 'Approve', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <polyline
            points="8,12.5 11,15.5 16,9"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </IconActionBase>
</template>
