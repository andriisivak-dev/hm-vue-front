<script setup lang="ts">
import AppLayout from '@/components/common/AppLayout.vue';
import AppHeader from '@/components/common/AppHeader.vue';
import AppFooter from '@/components/common/AppFooter.vue';
import AppSidebar from '@/components/common/AppSidebar.vue';
</script>

<template>
    <AppLayout>
        <AppHeader />
        <AppSidebar />

        <div class="app-main">
            <router-link to="/case">Go to Form</router-link>
        </div>

        <AppFooter />
    </AppLayout>
</template>

<style scoped></style>
