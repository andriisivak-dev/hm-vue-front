<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { decodeHtmlEntities, decodeTextOrDash, formatLocation } from '@/utils';

export interface CaseStudyAuthor {
    id: number;
    full_name: string;
    role: string;
}

export interface CaseStudyReviewer {
    id: number;
    full_name: string;
}

export interface CaseStudy {
    id: number;
    status: string;
    title?: string;
    _case_customer_name?: string;
    _case_city?: string;
    _case_state?: string;
    submitted_at?: string;
    hm_product_type?: string;
    hm_industry_segment?: string;
    hm_machine_make?: string;
    hm_machine_type?: string;
    hm_tool_brand?: string;
    hm_solution_type?: string;
    _case_insert_specification?: string;
    _case_tool_specification?: string;
    hm_tool_life?: string;
    _case_total_cost_savings?: string;
    _case_down_time_savings?: string;
    _case_cycle_time_savings?: string;
    current_step?: number;
    total_steps?: number;
    progress?: number;
    author: CaseStudyAuthor;
    reviewer: CaseStudyReviewer;
    approved_by?: CaseStudyAuthor | null;
    returned_by?: CaseStudyAuthor | null;
    return_reason?: string;
}

const props = defineProps<{
    caseStudy: CaseStudy;
}>();

defineEmits<{
    (e: 'success'): void;
}>();

import { ref } from 'vue';
import CaseActionConfirmModal from './modals/CaseActionConfirmModal.vue';

const confirmModal = ref<InstanceType<typeof CaseActionConfirmModal> | null>(null);

const title = computed(() => {
    const rawTitle = props.caseStudy._case_customer_name || props.caseStudy.title;
    return decodeHtmlEntities(rawTitle) || `Case #${props.caseStudy.id}`;
});

const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        draft: 'Draft',
        in_review: 'In Review',
        returned: 'Returned',
        approved: 'Approved',
        rejected: 'Rejected'
    };
    return labels[props.caseStudy.status] || props.caseStudy.status || 'Unknown';
});

const isFinal = computed(
    () => (props.caseStudy.current_step || 0) === (props.caseStudy.total_steps || 6)
);
const userStore = useUserStore();
const currentUser = computed(() => userStore.user);

const isOwnCase = computed(() => props.caseStudy.author?.id === currentUser.value?.id);

const isReadonly = computed(() => {
    if (!isOwnCase.value) return true;
    return ['in_review', 'approved', 'rejected'].includes(props.caseStudy.status);
});

const actionUrl = computed(() => {
    return `/case-study/?cid=${props.caseStudy.id}`;
});

const progress = computed(() => props.caseStudy.progress || 0);
const stepCurrent = computed(() => props.caseStudy.current_step || 0);
const stepTotal = computed(() => props.caseStudy.total_steps || 6);

const promptDelete = () => {
    confirmModal.value?.open({
        action: 'delete',
        caseId: props.caseStudy.id,
        caseTitle: title.value,
        title: 'Delete Case Study',
        description: `Are you sure you want to delete case #${props.caseStudy.id} (${title.value})?`,
        buttonText: 'Delete Case',
        buttonClass: 'btn-danger'
    });
};
</script>

<template>
    <div class="fa-case-study-card case-study-card card" :data-id="caseStudy.id">
        <div class="card-status">{{ statusLabel }}</div>
        <div class="card-title title">{{ title }}</div>
        <div class="card-subtitle subtitle">
            {{ formatLocation(caseStudy._case_city, caseStudy._case_state) }}
        </div>

        <div class="card-info info">
            <p class="submitted" v-if="caseStudy.submitted_at">
                {{ caseStudy.submitted_at }}
            </p>
            <p class="customer">
                <span>• Customer:</span> {{ decodeTextOrDash(caseStudy._case_customer_name) }}
            </p>
            <p class="industry">
                <span>• Industry:</span>
                {{ decodeTextOrDash(caseStudy.hm_industry_segment) }}
            </p>
            <p class="product"><span>• Product:</span> {{ decodeTextOrDash(caseStudy.hm_product_type) }}</p>
            <p class="machine-make">
                <span>• Machine Make(Make & Model):</span>
                {{ decodeTextOrDash(caseStudy.hm_machine_make) }}
            </p>
            <p class="machine-type">
                <span>• Machine Type:</span> {{ decodeTextOrDash(caseStudy.hm_machine_type) }}
            </p>
            <p class="tool-spec">
                <span>• Tool Specification(Tool holder/cutter):</span>
                {{ decodeTextOrDash(caseStudy._case_tool_specification) }}
            </p>
            <p class="insert-spec">
                <span>• Insert specification / Round Tools:</span>
                {{ decodeTextOrDash(caseStudy._case_insert_specification) }}
            </p>
        </div>

        <div class="metrics" v-if="isFinal">
            <div class="metric">Tool Life {{ decodeTextOrDash(caseStudy.hm_tool_life) }}</div>
            <!--            <div class="metric">Savings ₹{{ caseStudy._case_savings || '—' }}</div>-->
            <div class="metric">
                Cycle Time {{ decodeTextOrDash(caseStudy._case_cycle_time_savings) }}
            </div>
        </div>

        <div class="progress-bar-title subtitle">
            Step {{ stepCurrent }}/{{ stepTotal }} Complete - <span>{{ progress }}%</span>
        </div>
        <div class="progress-bar-line" :style="`--progress: ${progress}%`"></div>

        <div class="card-actions-btn actions-btn">
            <router-link class="btn btn-blue" :to="actionUrl">
                {{ isReadonly ? 'View' : 'Continue' }}
            </router-link>
            <button
                v-if="caseStudy.status === 'draft' && isOwnCase"
                class="btn text-danger action-btn ms-2 js-delete-case"
                @click.prevent="promptDelete"
                aria-label="Delete draft case"
                title="Delete draft case"
            >
                <i class="bi bi-trash"></i>
            </button>
        </div>

        <CaseActionConfirmModal ref="confirmModal" @success="$emit('success')" />
    </div>
</template>
