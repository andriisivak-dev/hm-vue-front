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
        <polyline
            points="10,8 15,12 10,16"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </IconActionBase>
</template>

<style scoped></style>
