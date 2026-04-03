<script setup lang="ts">
import { onMounted } from 'vue';
import { useLayoutStore } from '@/stores/layout';

onMounted(() => {
    useLayoutStore().init();
});
</script>

<template>
    <router-view />
</template>
