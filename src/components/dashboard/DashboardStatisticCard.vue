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
        <h3 class="statistic-title">
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

<style scoped>
.statistic-card {
    position: relative;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 50%) border-box;
    border: 1px solid transparent;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 12px;
    flex: 0 1 293px;
    line-height: normal;
}

.icon {
    display: none;
}

.number {
    font-size: 24px;
    font-weight: 700;
    text-transform: uppercase;
}

.description {
    font-size: 16px;
    font-weight: 300;
}

.statistic-title {
    color: #262469;
    font-weight: 700;
    font-size: 16px;
    margin: 0;
}

@media (min-width: 767px) {
    .statistic-card {
        padding: 12px 60px 20px 20px;
    }

    .statistic-title {
        font-size: 22px;
    }

    .icon {
        position: absolute;
        display: block;
        bottom: 20px;
        right: 20px;
    }

    .number {
        font-size: 32px;
    }

    .description {
        font-size: 18px;
    }
}
</style>
