<script setup lang="ts">
import { ref, computed } from 'vue';
import DashboardTabs from './DashboardTabs.vue';
import FieldAgentCaseStudyCard from './FieldAgentCaseStudyCard.vue';
import type { CaseStudy } from './FieldAgentCaseStudyCard.vue';
import { IconPlus } from '@/components/SVG';

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'in_review', label: 'Submitted' },
    { id: 'returned', label: 'Returned to Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' }
];

const currentTab = ref('all');

const mockCaseStudies = ref<CaseStudy[]>([
    {
        id: 1,
        status: 'draft',
        title: 'Draft Case Study Template',
        customer_name: 'Acme Corp',
        location: 'Mumbai, India',
        product: 'Drill Bit X200',
        progress: 40,
        step_current: 2,
        step_total: 5
    },
    {
        id: 2,
        status: 'in_review',
        title: 'Submitted Case Study',
        customer_name: 'Stark Industries',
        location: 'Delhi, India',
        submitted_at: '2023-10-25',
        progress: 100,
        step_current: 5,
        step_total: 5
    }
]);

const casesForCurrentTab = computed(() => {
    if (currentTab.value === 'all') return mockCaseStudies.value;
    return mockCaseStudies.value.filter((c) => c.status === currentTab.value);
});

const handleDelete = (caseId: number, caseTitle: string) => {
    // eslint-disable-next-line no-console
    console.log(`Delete intent for case ${caseId} (${caseTitle})`);
    // NOTE: In the future, this will open a delete confirmation modal and then call the API
};
</script>

<template>
    <div>
        <div class="divider"></div>

        <h3 class="subtitle mt-3">Create and manage your case studies</h3>

        <div class="new-case-study border-linear">
            <div class="icon">
                <IconPlus />
            </div>
            <div class="title">Create New Case Study</div>
            <div class="text">
                Document a new field application with complete details, photos, and results
            </div>
            <a href="/case-study/" class="new-case-study-btn btn btn-blue">
                Start new case study
            </a>
        </div>

        <h3 class="subtitle mt-3 mb-4">Recent Case Studies</h3>

        <div class="divider"></div>

        <DashboardTabs v-model="currentTab" :tabs="tabs" containerId="fa-dashboard-tabs" />

        <div class="divider"></div>

        <div class="fa-tab-content active" style="display: block">
            <div class="fa-case-study-cards case-study-cards js-fa-case-studies">
                <template v-if="casesForCurrentTab.length > 0">
                    <FieldAgentCaseStudyCard
                        v-for="item in casesForCurrentTab"
                        :key="item.id"
                        :case-study="item"
                        @delete="handleDelete"
                    />
                </template>

                <div v-else class="no-case-studies text-center py-5">
                    <p class="text-muted">No case studies found for this status.</p>
                </div>
            </div>
        </div>
    </div>
</template>
