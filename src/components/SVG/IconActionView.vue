<script setup lang="ts">
import IconActionBase from './IconActionBase.vue';

defineProps({
    size: { type: [Number, String], default: 24, required: false },
    color: { type: String, default: 'currentColor', required: false },
    label: { type: String, default: 'View', required: false }
});
</script>

<template>
    <IconActionBase :size="size" :label="label">
        <path
            d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <circle
            cx="12"
            cy="12"
            r="3.5"
            :stroke="color"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <circle cx="12" cy="12" r="1.5" :fill="color" />
    </IconActionBase>
</template>
