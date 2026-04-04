<script setup lang="ts">
defineProps<{
    title: string;
    number: number | string;
    description?: string;
    cardClass?: string;
    loading?: boolean;
}>();
</script>

<template>
    <div class="statistic-card" :class="cardClass">
        <h3 class="statistic-title subtitle">
            {{ title }}
        </h3>
        <div class="number">
            <template v-if="loading">...</template>
            <template v-else>{{ number }}</template>
        </div>
        <div class="description" v-if="description">
            <span v-html="description"></span>
        </div>
        <div class="icon">
            <slot name="icon"></slot>
        </div>
    </div>
</template>
