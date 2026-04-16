<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, default: 'Return', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <path
            d="M14 7H18C19.7 7 21 8.3 21 10V14C21 15.7 19.7 17 18 17H5"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <polyline
            points="9,12 4,17 9,22"
            stroke="#262469"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </IconActionBase>
</template>
