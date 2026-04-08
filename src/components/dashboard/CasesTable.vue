<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import type { CaseStudy } from './CaseStudyCard.vue';
import CaseActionReasonModal from './modals/CaseActionReasonModal.vue';
import CaseActionConfirmModal from './modals/CaseActionConfirmModal.vue';
import {
    IconActionApprove,
    IconActionView,
    IconActionDelete,
    IconActionViewDetails,
    IconActionReturn
} from '../SVG';
import { IconActionContinue, IconActionEdit, IconActionReject } from '@/components/SVG';
import AppTable from '@/components/common/AppTable.vue';

const userStore = useUserStore();
const currentUser = computed(() => userStore.user);

defineProps<{
    cases: CaseStudy[];
    viewMode: string;
}>();

defineEmits<{
    (e: 'success'): void;
}>();

const reasonModal = ref<InstanceType<typeof CaseActionReasonModal> | null>(null);
const confirmModal = ref<InstanceType<typeof CaseActionConfirmModal> | null>(null);

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

const promptDelete = (caseId: number, caseTitle: string) => {
    confirmModal.value?.open({
        action: 'delete',
        caseId,
        caseTitle,
        title: 'Delete Case Study',
        description: `Are you sure you want to delete case #${caseId} (${caseTitle})?`,
        buttonText: 'Delete Case',
        buttonClass: 'btn-danger'
    });
};

const promptApprove = (caseId: number) => {
    confirmModal.value?.open({
        action: 'approve',
        caseId,
        title: 'Approve Case Study',
        description: `Are you sure you want to approve case #${caseId}?`,
        buttonText: 'Approve',
        buttonClass: 'btn-success'
    });
};

const promptReject = (caseId: number) => {
    reasonModal.value?.open({
        action: 'reject',
        caseId,
        title: 'Reject Case Study',
        description: `Please enter a reason for rejecting case #${caseId}:`,
        buttonText: 'Reject Case',
        buttonClass: 'btn-danger'
    });
};

const promptReturn = (caseId: number) => {
    reasonModal.value?.open({
        action: 'return',
        caseId,
        title: 'Return Case for Revision',
        description: `Please enter a reason for returning case #${caseId}:`,
        buttonText: 'Return Case',
        buttonClass: 'btn-warning'
    });
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
</script>

<template>
    <div class="card mt-4 border-0">
        <div class="card-body p-0 app-case-table">
            <AppTable v-if="cases.length > 0" :show="cases.length > 0">
                <template #head>
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
                </template>
                <template #body>
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
                            <div class="d-flex align-items-center justify-content-center">
                                <template v-if="viewMode === 'library' || viewMode === 'approved'">
                                    <a
                                        :href="`/case-study/?cid=${item.id}&mode=view`"
                                        class="action-btn"
                                        title="View Case Study"
                                    >
                                        <IconActionView color="#0dcaf0" />
                                    </a>
                                    <a
                                        href="#"
                                        @click.prevent
                                        class="action-btn"
                                        title="View Case Study Details"
                                    >
                                        <IconActionViewDetails color="#262469" />
                                    </a>
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
                                            :href="`/case-study/?cid=${item.id}`"
                                            class="action-btn"
                                            title="Continue Case Study"
                                        >
                                            <IconActionContinue color="#262469" />
                                        </a>
                                        <a
                                            v-else-if="
                                                item.status === 'in_review' &&
                                                ['administrator'].includes(currentUser?.role || '')
                                            "
                                            href="#"
                                            class="action-btn"
                                            title="Edit Case Study"
                                        >
                                            <IconActionEdit color="#262469" />
                                        </a>
                                        <a
                                            v-else
                                            :href="`/case-study/?cid=${item.id}&mode=view`"
                                            class="action-btn"
                                            title="View Case Study"
                                        >
                                            <IconActionView color="#0dcaf0" />
                                        </a>
                                        <button
                                            v-if="item.status === 'draft'"
                                            class="action-btn"
                                            @click.prevent="promptDelete(item.id, item.title || '')"
                                            title="Delete Case Study"
                                        >
                                            <IconActionDelete />
                                        </button>
                                    </template>
                                    <template v-else>
                                        <!-- Subordinate cases -->
                                        <a
                                            :href="`/case-study/?cid=${item.id}&mode=view`"
                                            class="action-btn"
                                            title="View Case Study"
                                        >
                                            <IconActionView color="#0dcaf0" />
                                        </a>
                                        <a
                                            v-if="item.status === 'in_review'"
                                            href="#"
                                            class="action-btn"
                                            title="Edit Case Study"
                                        >
                                            <IconActionEdit color="#262469" />
                                        </a>
                                        <template v-if="item.status === 'in_review'">
                                            <button
                                                class="action-btn"
                                                @click.prevent="promptApprove(item.id)"
                                                title="Approve Case Study"
                                            >
                                                <IconActionApprove color="#5eab1d" />
                                            </button>
                                            <button
                                                class="action-btn"
                                                @click.prevent="promptReturn(item.id)"
                                                title="Return Case for Revision"
                                            >
                                                <IconActionReturn color="#f7931d" />
                                            </button>
                                            <button
                                                class="action-btn"
                                                @click.prevent="promptReject(item.id)"
                                                title="Reject Case Study"
                                            >
                                                <IconActionReject color="#d91e18" />
                                            </button>
                                        </template>
                                    </template>
                                </template>
                                <template v-else-if="currentUser?.role === 'hm_marketing'">
                                    <!-- Marketing Actions -->
                                    <a
                                        :href="`/case-study/?cid=${item.id}&mode=view`"
                                        class="action-btn"
                                        title="View Case Study"
                                    >
                                        <IconActionView color="#0dcaf0" />
                                    </a>
                                </template>
                                <template v-else>
                                    <!-- Field Agent Actions -->
                                    <a
                                        v-if="['draft', 'returned'].includes(item.status)"
                                        :href="`/case-study/?cid=${item.id}`"
                                        class="btn btn-sm btn-link text-primary"
                                        >Continue</a
                                    >
                                    <a
                                        v-else
                                        :href="`/case-study/?cid=${item.id}&mode=view`"
                                        class="action-btn"
                                        title="View Case Study"
                                    >
                                        <IconActionView color="#0dcaf0" />
                                    </a>
                                    <button
                                        v-if="item.status === 'draft'"
                                        class="action-btn"
                                        @click.prevent="promptDelete(item.id, item.title || '')"
                                        title="Delete Case Study"
                                    >
                                        <IconActionDelete />
                                    </button>
                                </template>
                            </div>
                        </td>
                    </tr>
                </template>
            </AppTable>
            <div v-else class="table-empty-state text-center py-5">
                <p class="mb-0 text-muted">No case studies found.</p>
            </div>
        </div>

        <CaseActionReasonModal ref="reasonModal" @success="$emit('success')" />
        <CaseActionConfirmModal ref="confirmModal" @success="$emit('success')" />
    </div>
</template>

<style scoped>
.app-case-table {
    min-height: 400px;
    position: relative;
}

.action-btn {
    margin: 0;
    padding: 4px;
    border: none;
    background: none;
    cursor: pointer;
}

.action-btn:hover {
    opacity: 0.75;
}

td[data-label='Date'] {
    white-space: nowrap;
}
</style>
