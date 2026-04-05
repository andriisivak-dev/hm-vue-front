<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import type { CaseStudy } from './CaseStudyCard.vue';

const userStore = useUserStore();
const currentUser = computed(() => userStore.user);

const props = defineProps<{
    cases: CaseStudy[];
    viewMode: string;
}>();

const emit = defineEmits<{
    (e: 'delete', caseId: number, caseTitle: string): void;
    (e: 'approve', caseId: number): void;
    (e: 'reject', caseId: number): void;
    (e: 'return', caseId: number): void;
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

const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const regex = /^(\d{4})-(\d{2})-(\d{2})(?:[\sT]+(\d{2}:\d{2})(?::\d{2})?)?/;
    const match = dateString.match(regex);
    if (match) {
        const [, year, month, day, timePart] = match;
        return timePart ? `${day}/${month}/${year} ${timePart}` : `${day}/${month}/${year}`;
    }
    return dateString;
};

console.log(props.cases);
</script>

<template>
    <div class="card mt-4 hm-case-table">
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
                                {{
                                    item.author?.id === currentUser?.id
                                        ? 'You'
                                        : item.author?.full_name || '—'
                                }}
                            </td>

                            <td data-label="Company">{{ item._case_customer_name || '—' }}</td>
                            <td data-label="Location">
                                {{ item._case_city || '' }}, {{ item._case_state || '' }}
                            </td>
                            <td data-label="Industry">{{ item.hm_industry_segment || '—' }}</td>
                            <td data-label="Product Type">{{ item.hm_product_type || '—' }}</td>
                            <td data-label="Machine">{{ item.hm_machine_make || '—' }}</td>
                            <td data-label="Date" class="text-muted">
                                {{ formatDate(item.submitted_at) }}
                            </td>

                            <td v-if="viewMode === 'all'" data-label="Status">
                                <span class="badge" :class="getStatusClass(item.status)">
                                    {{ getStatusLabel(item.status) }}
                                </span>
                            </td>

                            <td data-label="Actions" class="text-center">
                                <template v-if="viewMode === 'library' || viewMode === 'approved'">
                                    <a
                                        :href="`/case/?cid=${item.id}&mode=view`"
                                        class="btn btn-sm btn-link text-info"
                                        >View</a
                                    >
                                    <a href="#" class="btn btn-sm btn-link text-info"
                                        >View Details</a
                                    >
                                </template>
                                <template
                                    v-else-if="
                                        currentUser?.role === 'hm_manager' ||
                                        currentUser?.role === 'hm_administrator' ||
                                        currentUser?.role === 'administrator'
                                    "
                                >
                                    <template v-if="item.author?.id === currentUser?.id">
                                        <!-- Own cases -->
                                        <a
                                            v-if="['draft', 'returned'].includes(item.status)"
                                            :href="`/case/?cid=${item.id}`"
                                            class="btn btn-sm btn-link text-primary"
                                            >Continue</a
                                        >
                                        <a
                                            v-else-if="
                                                item.status === 'in_review' &&
                                                ['administrator', 'hm_administrator'].includes(
                                                    currentUser?.role || ''
                                                )
                                            "
                                            href="#"
                                            class="btn btn-sm btn-link text-primary"
                                            >Edit</a
                                        >
                                        <a
                                            v-else
                                            :href="`/case/?cid=${item.id}&mode=view`"
                                            class="btn btn-sm btn-link text-info"
                                            >View</a
                                        >
                                        <button
                                            v-if="item.status === 'draft'"
                                            class="btn btn-sm btn-link text-danger"
                                            @click.prevent="handleDelete(item.id, item.title || '')"
                                        >
                                            Delete
                                        </button>
                                    </template>
                                    <template v-else>
                                        <!-- Subordinate cases -->
                                        <a
                                            :href="`/case/?cid=${item.id}&mode=view`"
                                            class="btn btn-sm btn-link text-info"
                                            >View</a
                                        >
                                        <a
                                            v-if="item.status === 'in_review'"
                                            href="#"
                                            class="btn btn-sm btn-link text-primary"
                                            >Edit</a
                                        >
                                        <template v-if="item.status === 'in_review'">
                                            <button
                                                class="btn btn-sm btn-link text-success"
                                                @click.prevent="$emit('approve', item.id)"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                class="btn btn-sm btn-link text-danger"
                                                @click.prevent="$emit('reject', item.id)"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                class="btn btn-sm btn-link text-warning"
                                                @click.prevent="$emit('return', item.id)"
                                            >
                                                Return
                                            </button>
                                        </template>
                                    </template>
                                </template>
                                <template v-else-if="currentUser?.role === 'hm_marketing'">
                                    <!-- Marketing Actions -->
                                    <a
                                        :href="`/case/?cid=${item.id}&mode=view`"
                                        class="btn btn-sm btn-link text-info"
                                        >View</a
                                    >
                                </template>
                                <template v-else>
                                    <!-- Field Agent Actions -->
                                    <a
                                        v-if="['draft', 'returned'].includes(item.status)"
                                        :href="`/case/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-primary"
                                        >Continue</a
                                    >
                                    <a
                                        v-else
                                        :href="`/case/?cid=${item.id}&mode=view`"
                                        class="btn btn-sm btn-link text-info"
                                        >View</a
                                    >
                                    <button
                                        v-if="item.status === 'draft'"
                                        class="btn btn-sm btn-link text-danger"
                                        @click.prevent="handleDelete(item.id, item.title || '')"
                                    >
                                        Delete
                                    </button>
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

<style scoped>
.hm-case-table {
    border-radius: 10px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 50%) border-box;
    border: 1px solid transparent;
    overflow: hidden;
}

.table-responsive td,
.table-responsive th {
    color: #262469;
}
</style>
