<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, default: 'View details', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <path
            d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <!-- fold crease -->
        <polyline
            points="14,2 14,8 20,8"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <!-- text lines -->
        <line
            x1="8"
            y1="13"
            x2="16"
            y2="13"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
        />
        <line
            x1="8"
            y1="17"
            x2="13"
            y2="17"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
        />
    </IconActionBase>
</template>
