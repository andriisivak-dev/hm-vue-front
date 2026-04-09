<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormRenderer from '@/components/form/FormRenderer.vue';
import AppLayout from '@/components/common/AppLayout.vue';
import AppHeader from '@/components/common/AppHeader.vue';
import AppFooter from '@/components/common/AppFooter.vue';
import AppSidebar from '@/components/common/AppSidebar.vue';

const route = useRoute();
const router = useRouter();

/** Case Study form ID — GF form 4 */
const FORM_ID = 4;

/**
 * Read the current case ID from the ?cid= query parameter.
 * Returns undefined when creating a new case.
 */
const caseId = computed<number | undefined>(() => {
    const raw = route.query.cid;
    if (!raw) return undefined;
    const parsed = parseInt(String(raw), 10);
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
});

/**
 * Determine if we are in read-only view mode
 */
const isViewMode = computed<boolean>(() => route.query.mode === 'view');
const isEditMode = computed<boolean>(() => route.query.mode === 'edit');

/**
 * Called by FormRenderer when a brand-new case is created.
 * Updates the URL to ?cid={id} without triggering a full navigation.
 */
function onCaseCreated(id: number) {
    router.replace({ path: '/case-study', query: { cid: String(id) } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onCaseSubmitted(_id: number) {
    // Optionally redirect to dashboard or show a notification
    // router.push('/')
}
</script>

<template>
    <AppLayout>
        <AppHeader />
        <AppSidebar :showFilters="false" />

        <div class="app-main">
            <div class="form-page">
                <div class="header-section">
                    <h1>Case Study</h1>
                </div>

                <FormRenderer
                    :form-id="FORM_ID"
                    :case-id="caseId"
                    :is-view-mode="isViewMode"
                    :is-edit-mode="isEditMode"
                    @case-created="onCaseCreated"
                    @case-submitted="onCaseSubmitted"
                />
            </div>
        </div>

        <AppFooter />
    </AppLayout>
</template>

<style scoped>
.form-page {
    padding: 2rem;
    max-width: 1200px;
}

.header-section h1 {
    margin: 0;
    font-weight: 700;
    font-size: 32px;
    color: #262469;
}
</style>
