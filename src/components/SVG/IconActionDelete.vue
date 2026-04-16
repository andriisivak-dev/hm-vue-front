<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, default: 'Delete', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <path
            d="M9 3H15M3 6H21M19 6L18.2 19.1C18.1 20.2 17.1 21 16 21H8C6.9 21 5.9 20.2 5.8 19.1L5 6"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
        />
        <line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
        />
    </IconActionBase>
</template>
