<script setup lang="ts">
defineProps({
    size: { type: [Number, String], default: 24, required: false },
    label: { type: String, required: true }
});
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        :aria-label="label"
        role="img"
    >
        <slot />
    </svg>
</template>
