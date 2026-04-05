<script setup lang="ts">
import type { CaseStudy } from './CaseStudyCard.vue';

const props = defineProps<{
    cases: CaseStudy[];
    viewMode: string;
}>();

const emit = defineEmits<{
    (e: 'delete', caseId: number, caseTitle: string): void;
}>();

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        draft: 'Draft',
        in_review: 'In Review',
        returned: 'Returned',
        approved: 'Approved',
        rejected: 'Rejected'
    };
    return labels[status] || status || 'Unknown';
};

const getStatusClass = (status: string) => {
    if (status === 'draft') return 'bg-secondary';
    if (status === 'in_review') return 'bg-info';
    if (status === 'returned') return 'bg-warning text-dark';
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-secondary';
};

const handleDelete = (caseId: number, caseTitle: string) => {
    emit('delete', caseId, caseTitle);
};

console.log(props.cases);
</script>

<template>
    <div class="card shadow-sm border-0">
        <div class="card-body p-0">
            <div class="table-responsive" v-if="cases.length > 0">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Case ID</th>
                            <th>Submitted By</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Industry</th>
                            <th>Product Type</th>
                            <th>Machine</th>
                            <th>Date</th>
                            <th v-if="viewMode === 'all'">Status</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cases" :key="item.id">
                            <td data-label="Case ID">#{{ item.id }}</td>
                            <td data-label="Submitted By">
                                {{ viewMode === 'library' ? item.author.full_name : 'You' }}
                            </td>

                            <td data-label="Company">{{ item._case_customer_name || '—' }}</td>
                            <td data-label="Location">
                                {{ item._case_city || '' }}, {{ item._case_state || '' }}
                            </td>
                            <td data-label="Industry">{{ item.hm_industry_segment || '—' }}</td>
                            <td data-label="Product Type">{{ item.hm_product_type || '—' }}</td>
                            <td data-label="Machine">{{ item.hm_machine_make || '—' }}</td>
                            <td data-label="Date" class="text-muted">
                                {{ item.submitted_at || '—' }}
                            </td>

                            <td v-if="viewMode === 'all'" data-label="Status">
                                <span class="badge" :class="getStatusClass(item.status)">
                                    {{ getStatusLabel(item.status) }}
                                </span>
                            </td>

                            <td data-label="Actions" class="text-center">
                                <template v-if="viewMode === 'library'">
                                    <a
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-info"
                                        >View</a
                                    >
                                </template>
                                <template v-else-if="viewMode === 'all'">
                                    <a
                                        v-if="['draft', 'returned'].includes(item.status)"
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-primary"
                                    >
                                        Continue
                                    </a>
                                    <a
                                        v-else
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-info"
                                    >
                                        View
                                    </a>
                                    <button
                                        v-if="item.status === 'draft'"
                                        class="btn btn-sm btn-link text-danger"
                                        @click.prevent="handleDelete(item.id, item.title || '')"
                                    >
                                        Delete
                                    </button>
                                </template>
                                <template
                                    v-else-if="
                                        viewMode === 'in_review' ||
                                        viewMode === 'approved' ||
                                        viewMode === 'rejected'
                                    "
                                >
                                    <a
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-info"
                                        >View</a
                                    >
                                </template>
                                <template v-else-if="viewMode === 'returned'">
                                    <a
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-primary"
                                        >Continue</a
                                    >
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="table-empty-state text-center py-5">
                <p class="mb-0 text-muted">No case studies found.</p>
            </div>
        </div>
    </div>
</template>
