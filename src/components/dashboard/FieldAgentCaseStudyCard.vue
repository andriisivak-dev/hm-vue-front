<script setup lang="ts">
import { computed } from 'vue';

export interface CaseStudy {
    id: number;
    status: string;
    title?: string;
    customer_name?: string;
    location?: string;
    submitted_at?: string;
    product?: string;
    product_type?: string;
    industry?: string;
    industry_segment?: string;
    machine_make?: string;
    machine_type?: string;
    insert_specification?: string;
    tool_specification?: string;
    tool_life?: string;
    savings?: string;
    cycle_time?: string;
    step_current?: number;
    step_total?: number;
    progress?: number;
    gf_resume_url?: string;
}

const props = defineProps<{
    caseStudy: CaseStudy;
}>();

const emit = defineEmits<{
    (e: 'delete', caseId: number, caseTitle: string): void;
}>();

const title = computed(
    () => props.caseStudy.customer_name || props.caseStudy.title || `Case #${props.caseStudy.id}`
);

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
    () => (props.caseStudy.step_current || 0) === (props.caseStudy.step_total || 6)
);
const isReadonly = computed(() =>
    ['in_review', 'approved', 'rejected'].includes(props.caseStudy.status)
);

const actionUrl = computed(() => {
    const defaultUrl = `/case-study/?case_id=${props.caseStudy.id}`;
    if (props.caseStudy.status === 'draft' && props.caseStudy.gf_resume_url) {
        return props.caseStudy.gf_resume_url;
    }
    return defaultUrl;
});

const progress = computed(() => props.caseStudy.progress || 0);
const stepCurrent = computed(() => props.caseStudy.step_current || 0);
const stepTotal = computed(() => props.caseStudy.step_total || 6);

const onDelete = () => {
    emit('delete', props.caseStudy.id, title.value);
};
</script>

<template>
    <div class="fa-case-study-card case-study-card card" :data-id="caseStudy.id">
        <div class="card-status">{{ statusLabel }}</div>
        <div class="card-title title">{{ title }}</div>
        <div class="card-subtitle subtitle">{{ caseStudy.location || '' }}</div>

        <div class="card-info info">
            <p class="submitted" v-if="caseStudy.submitted_at">
                {{ caseStudy.submitted_at }}
            </p>
            <p class="customer"><span>• Customer:</span> {{ caseStudy.customer_name || '—' }}</p>
            <p class="industry">
                <span>• Industry:</span>
                {{ caseStudy.industry || caseStudy.industry_segment || '—' }}
            </p>
            <p class="product">
                <span>• Product:</span> {{ caseStudy.product || caseStudy.product_type || '—' }}
            </p>
            <p class="machine-make">
                <span>• Machine Make(Make & Model):</span> {{ caseStudy.machine_make || '—' }}
            </p>
            <p class="machine-type">
                <span>• Machine Type:</span> {{ caseStudy.machine_type || '—' }}
            </p>
            <p class="tool-spec">
                <span>• Tool Specification(Tool holder/cutter):</span>
                {{ caseStudy.tool_specification || '—' }}
            </p>
            <p class="insert-spec">
                <span>• Insert specification / Round Tools:</span>
                {{ caseStudy.insert_specification || '—' }}
            </p>
        </div>

        <div class="metrics" v-if="isFinal">
            <div class="metric">Tool Life {{ caseStudy.tool_life || '—' }}</div>
            <div class="metric">Savings ₹{{ caseStudy.savings || '—' }}</div>
            <div class="metric">Cycle Time {{ caseStudy.cycle_time || '—' }}</div>
        </div>

        <div class="progress-bar-title subtitle">
            Step {{ stepCurrent }}/{{ stepTotal }} Complete - <span>{{ progress }}%</span>
        </div>
        <div class="progress-bar-line" :style="`--progress: ${progress}%`"></div>

        <div class="card-actions-btn actions-btn">
            <a class="btn btn-blue" :href="actionUrl">{{ isReadonly ? 'View' : 'Continue' }}</a>
            <button
                v-if="caseStudy.status === 'draft'"
                class="btn text-danger action-btn ms-2 js-delete-case"
                @click.prevent="onDelete"
                aria-label="Delete draft case"
                title="Delete draft case"
            >
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</template>
