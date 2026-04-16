<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, default: 'Approve', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <path
            d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <path
            d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </IconActionBase>
</template>
