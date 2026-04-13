<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import type { CaseStudy } from './CaseStudyCard.vue';
import CaseActionReasonModal from './modals/CaseActionReasonModal.vue';
import CaseActionConfirmModal from './modals/CaseActionConfirmModal.vue';
import CaseViewDetailsModal from './modals/CaseViewDetailsModal.vue';
import {
    IconActionApprove,
    IconActionView,
    IconActionDelete,
    IconActionViewDetails,
    IconActionReturn
} from '../SVG';
import { IconActionContinue, IconActionEdit, IconActionReject } from '@/components/SVG';
import AppTable from '@/components/common/AppTable.vue';
import { decodeTextOrDash, formatLocation } from '@/utils';

const userStore = useUserStore();
const currentUser = computed(() => userStore.user);

const props = defineProps<{
    cases: CaseStudy[];
    viewMode: string;
}>();

// Show 'Approved By' column for modes where a case can be approved
const showApprovedBy = computed(() => ['approved', 'library', 'all'].includes(props.viewMode));
// Show 'Returned By' column for modes where a case can be returned
const showReturnedBy = computed(() => ['returned', 'all'].includes(props.viewMode));

defineEmits<{
    (e: 'success'): void;
}>();

const reasonModal = ref<InstanceType<typeof CaseActionReasonModal> | null>(null);
const confirmModal = ref<InstanceType<typeof CaseActionConfirmModal> | null>(null);
const mediaModal = ref<InstanceType<typeof CaseViewDetailsModal> | null>(null);

const promptViewMedia = (caseId: number, caseTitle: string) => {
    mediaModal.value?.open({ caseId, caseTitle });
};

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
    <div class="cases-wrapper mt-4">
        <template v-if="cases.length > 0">
            <!-- Mobile View -->
            <div class="d-md-none mobile-cases-list">
                <div
                    class="mobile-case-card border-linear mb-3"
                    v-for="item in cases"
                    :key="`mobile-${item.id}`"
                >
                    <div class="mobile-case-header">
                        <div class="fw-bold fs-5 text-primary" style="color: #262469 !important">
                            #{{ item.id }}
                        </div>
                        <div class="d-flex align-items-center justify-content-end gap-1">
                            <template v-if="viewMode === 'library' || viewMode === 'approved'">
                                <router-link
                                    :to="`/case-study/?cid=${item.id}&mode=view`"
                                    class="action-btn"
                                    title="View Case Study"
                                >
                                    <IconActionView color="#0dcaf0" />
                                </router-link>
                                <button
                                    type="button"
                                    class="action-btn"
                                    title="View Case Study Details"
                                    @click="
                                        promptViewMedia(item.id, item.title || `Case #${item.id}`)
                                    "
                                >
                                    <IconActionViewDetails color="#262469" />
                                </button>
                                <template v-if="currentUser?.role === 'administrator'">
                                    <router-link
                                        :to="`/case-study/?cid=${item.id}&mode=edit`"
                                        class="action-btn"
                                        title="Edit Case Study"
                                    >
                                        <IconActionEdit color="#262469" />
                                    </router-link>
                                    <button
                                        class="action-btn"
                                        @click.prevent="promptDelete(item.id, item.title || '')"
                                        title="Delete Case Study"
                                    >
                                        <IconActionDelete />
                                    </button>
                                </template>
                            </template>
                            <template
                                v-else-if="
                                    currentUser?.role === 'hm_manager' ||
                                    currentUser?.role === 'hm_administrator' ||
                                    currentUser?.role === 'administrator'
                                "
                            >
                                <template v-if="item.author?.id === currentUser?.id">
                                    <router-link
                                        v-if="['draft', 'returned'].includes(item.status)"
                                        :to="`/case-study/?cid=${item.id}`"
                                        class="action-btn"
                                        title="Continue Case Study"
                                    >
                                        <IconActionContinue color="#262469" />
                                    </router-link>
                                    <router-link
                                        v-else-if="
                                            item.status === 'in_review' &&
                                            ['administrator'].includes(currentUser?.role || '')
                                        "
                                        :to="`/case-study/?cid=${item.id}&mode=edit`"
                                        class="action-btn"
                                        title="Edit Case Study"
                                    >
                                        <IconActionEdit color="#262469" />
                                    </router-link>
                                    <router-link
                                        v-else
                                        :to="`/case-study/?cid=${item.id}&mode=view`"
                                        class="action-btn"
                                        title="View Case Study"
                                    >
                                        <IconActionView color="#0dcaf0" />
                                    </router-link>
                                    <button
                                        v-if="
                                            item.status === 'draft' ||
                                            (['approved', 'rejected'].includes(item.status) &&
                                                ['administrator'].includes(currentUser?.role || ''))
                                        "
                                        class="action-btn"
                                        @click.prevent="promptDelete(item.id, item.title || '')"
                                        title="Delete Case Study"
                                    >
                                        <IconActionDelete />
                                    </button>
                                </template>
                                <template v-else>
                                    <router-link
                                        :to="`/case-study/?cid=${item.id}&mode=view`"
                                        class="action-btn"
                                        title="View Case Study"
                                    >
                                        <IconActionView color="#0dcaf0" />
                                    </router-link>
                                    <router-link
                                        v-if="['in_review', 'returned'].includes(item.status)"
                                        :to="`/case-study/?cid=${item.id}&mode=edit`"
                                        class="action-btn"
                                        title="Edit Case Study"
                                    >
                                        <IconActionEdit color="#262469" />
                                    </router-link>
                                    <router-link
                                        v-if="
                                            item.status === 'approved' &&
                                            ['administrator'].includes(currentUser?.role || '')
                                        "
                                        :to="`/case-study/?cid=${item.id}&mode=edit`"
                                        class="action-btn"
                                        title="Edit Approved Case"
                                    >
                                        <IconActionEdit color="#262469" />
                                    </router-link>
                                    <button
                                        v-if="
                                            ['approved', 'rejected'].includes(item.status) &&
                                            ['administrator'].includes(currentUser?.role || '')
                                        "
                                        class="action-btn"
                                        @click.prevent="promptDelete(item.id, item.title || '')"
                                        title="Delete Case Study"
                                    >
                                        <IconActionDelete />
                                    </button>
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
                                <router-link
                                    :to="`/case-study/?cid=${item.id}&mode=view`"
                                    class="action-btn"
                                    title="View Case Study"
                                >
                                    <IconActionView color="#0dcaf0" />
                                </router-link>
                            </template>
                            <template v-else>
                                <router-link
                                    v-if="item.status === 'returned'"
                                    :to="`/case-study/?cid=${item.id}`"
                                    class="action-btn"
                                    title="Edit Case Study"
                                >
                                    <IconActionEdit color="#262469" />
                                </router-link>
                                <router-link
                                    v-else-if="item.status === 'draft'"
                                    :to="`/case-study/?cid=${item.id}`"
                                    class="action-btn"
                                    title="Edit Case Study"
                                >
                                    <IconActionContinue color="#262469" />
                                </router-link>

                                <router-link
                                    v-else
                                    :to="`/case-study/?cid=${item.id}&mode=view`"
                                    class="action-btn"
                                    title="View Case Study"
                                >
                                    <IconActionView color="#0dcaf0" />
                                </router-link>
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
                    </div>
                    <div class="mobile-case-body">
                        <div class="mobile-case-row">
                            <span class="label">Submitted By</span>
                            <span class="value">{{
                                item.author?.id === currentUser?.id
                                    ? 'You'
                                    : decodeTextOrDash(item.author?.full_name)
                            }}</span>
                        </div>
                        <div class="mobile-case-row" v-if="showApprovedBy">
                            <span class="label">Approved By</span>
                            <span class="value">{{
                                decodeTextOrDash(item.approved_by?.full_name)
                            }}</span>
                        </div>
                        <div class="mobile-case-row" v-if="showReturnedBy">
                            <span class="label">Returned By</span>
                            <span class="value">{{
                                decodeTextOrDash(item.returned_by?.full_name)
                            }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Company</span>
                            <span class="value">{{
                                decodeTextOrDash(item._case_customer_name)
                            }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Location</span>
                            <span class="value">{{
                                formatLocation(item._case_city, item._case_state)
                            }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Industry</span>
                            <span class="value">{{
                                decodeTextOrDash(item.hm_industry_segment)
                            }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Product Type</span>
                            <span class="value">{{ decodeTextOrDash(item.hm_product_type) }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Machine</span>
                            <span class="value">{{ decodeTextOrDash(item.hm_machine_make) }}</span>
                        </div>
                        <div class="mobile-case-row">
                            <span class="label">Date</span>
                            <span class="value text-muted">{{
                                formatDate(item.submitted_at)
                            }}</span>
                        </div>
                        <div class="mobile-case-row" v-if="viewMode === 'all'">
                            <span class="label">Status</span>
                            <span class="value">
                                <span class="badge" :class="getStatusClass(item.status)">
                                    {{ getStatusLabel(item.status) }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Desktop View -->
            <div class="card border-0 d-none d-md-block">
                <div class="card-body p-0 app-case-table">
                    <AppTable :show="true">
                        <template #head>
                            <tr>
                                <th>Case ID</th>
                                <th>Submitted By</th>
                                <th v-if="showApprovedBy">Approved By</th>
                                <th v-if="showReturnedBy">Returned By</th>
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
                                            : decodeTextOrDash(item.author?.full_name)
                                    }}
                                </td>
                                <td
                                    v-if="showApprovedBy"
                                    data-label="Approved By"
                                    class="text-muted"
                                >
                                    {{ decodeTextOrDash(item.approved_by?.full_name) }}
                                </td>
                                <td
                                    v-if="showReturnedBy"
                                    data-label="Returned By"
                                    class="text-muted"
                                >
                                    {{ decodeTextOrDash(item.returned_by?.full_name) }}
                                </td>

                                <td data-label="Company">
                                    {{ decodeTextOrDash(item._case_customer_name) }}
                                </td>
                                <td data-label="Location">
                                    {{ formatLocation(item._case_city, item._case_state) }}
                                </td>
                                <td data-label="Industry">
                                    {{ decodeTextOrDash(item.hm_industry_segment) }}
                                </td>
                                <td data-label="Product Type">
                                    {{ decodeTextOrDash(item.hm_product_type) }}
                                </td>
                                <td data-label="Machine">
                                    {{ decodeTextOrDash(item.hm_machine_make) }}
                                </td>
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
                                        <template
                                            v-if="viewMode === 'library' || viewMode === 'approved'"
                                        >
                                            <router-link
                                                :to="`/case-study/?cid=${item.id}&mode=view`"
                                                class="action-btn"
                                                title="View Case Study"
                                            >
                                                <IconActionView color="#0dcaf0" />
                                            </router-link>
                                            <button
                                                type="button"
                                                class="action-btn"
                                                title="View Case Study Details"
                                                @click="
                                                    promptViewMedia(
                                                        item.id,
                                                        item.title || `Case #${item.id}`
                                                    )
                                                "
                                            >
                                                <IconActionViewDetails color="#262469" />
                                            </button>
                                            <!-- Superadmin: edit & delete in library/approved view -->
                                            <template v-if="currentUser?.role === 'administrator'">
                                                <router-link
                                                    :to="`/case-study/?cid=${item.id}&mode=edit`"
                                                    class="action-btn"
                                                    title="Edit Case Study"
                                                >
                                                    <IconActionEdit color="#262469" />
                                                </router-link>
                                                <button
                                                    class="action-btn"
                                                    @click.prevent="
                                                        promptDelete(item.id, item.title || '')
                                                    "
                                                    title="Delete Case Study"
                                                >
                                                    <IconActionDelete />
                                                </button>
                                            </template>
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
                                                <router-link
                                                    v-if="
                                                        ['draft', 'returned'].includes(item.status)
                                                    "
                                                    :to="`/case-study/?cid=${item.id}`"
                                                    class="action-btn"
                                                    title="Continue Case Study"
                                                >
                                                    <IconActionContinue color="#262469" />
                                                </router-link>
                                                <router-link
                                                    v-else-if="
                                                        item.status === 'in_review' &&
                                                        ['administrator'].includes(
                                                            currentUser?.role || ''
                                                        )
                                                    "
                                                    :to="`/case-study/?cid=${item.id}&mode=edit`"
                                                    class="action-btn"
                                                    title="Edit Case Study"
                                                >
                                                    <IconActionEdit color="#262469" />
                                                </router-link>
                                                <router-link
                                                    v-else
                                                    :to="`/case-study/?cid=${item.id}&mode=view`"
                                                    class="action-btn"
                                                    title="View Case Study"
                                                >
                                                    <IconActionView color="#0dcaf0" />
                                                </router-link>
                                                <button
                                                    v-if="
                                                        item.status === 'draft' ||
                                                        (['approved', 'rejected'].includes(
                                                            item.status
                                                        ) &&
                                                            ['administrator'].includes(
                                                                currentUser?.role || ''
                                                            ))
                                                    "
                                                    class="action-btn"
                                                    @click.prevent="
                                                        promptDelete(item.id, item.title || '')
                                                    "
                                                    title="Delete Case Study"
                                                >
                                                    <IconActionDelete />
                                                </button>
                                            </template>
                                            <template v-else>
                                                <!-- Subordinate cases -->
                                                <router-link
                                                    :to="`/case-study/?cid=${item.id}&mode=view`"
                                                    class="action-btn"
                                                    title="View Case Study"
                                                >
                                                    <IconActionView color="#0dcaf0" />
                                                </router-link>
                                                <!-- Subordinate cases: supervisor/admin edit -->
                                                <router-link
                                                    v-if="
                                                        ['in_review', 'returned'].includes(
                                                            item.status
                                                        )
                                                    "
                                                    :to="`/case-study/?cid=${item.id}&mode=edit`"
                                                    class="action-btn"
                                                    title="Edit Case Study"
                                                >
                                                    <IconActionEdit color="#262469" />
                                                </router-link>
                                                <!-- Admin can also edit approved cases -->
                                                <router-link
                                                    v-if="
                                                        item.status === 'approved' &&
                                                        ['administrator'].includes(
                                                            currentUser?.role || ''
                                                        )
                                                    "
                                                    :to="`/case-study/?cid=${item.id}&mode=edit`"
                                                    class="action-btn"
                                                    title="Edit Approved Case"
                                                >
                                                    <IconActionEdit color="#262469" />
                                                </router-link>
                                                <!-- Admin: delete approved / rejected subordinate cases -->
                                                <button
                                                    v-if="
                                                        ['approved', 'rejected'].includes(
                                                            item.status
                                                        ) &&
                                                        ['administrator'].includes(
                                                            currentUser?.role || ''
                                                        )
                                                    "
                                                    class="action-btn"
                                                    @click.prevent="
                                                        promptDelete(item.id, item.title || '')
                                                    "
                                                    title="Delete Case Study"
                                                >
                                                    <IconActionDelete />
                                                </button>
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
                                            <router-link
                                                :to="`/case-study/?cid=${item.id}&mode=view`"
                                                class="action-btn"
                                                title="View Case Study"
                                            >
                                                <IconActionView color="#0dcaf0" />
                                            </router-link>
                                        </template>
                                        <template v-else>
                                            <!-- Field Agent Actions -->
                                            <router-link
                                                v-if="item.status === 'returned'"
                                                :to="`/case-study/?cid=${item.id}`"
                                                class="action-btn"
                                                title="Edit Case Study"
                                            >
                                                <IconActionEdit color="#262469" />
                                            </router-link>
                                            <router-link
                                                v-else-if="item.status === 'draft'"
                                                :to="`/case-study/?cid=${item.id}`"
                                                class="action-btn"
                                                title="Edit Case Study"
                                            >
                                                <IconActionContinue color="#262469" />
                                            </router-link>

                                            <router-link
                                                v-else
                                                :to="`/case-study/?cid=${item.id}&mode=view`"
                                                class="action-btn"
                                                title="View Case Study"
                                            >
                                                <IconActionView color="#0dcaf0" />
                                            </router-link>
                                            <button
                                                v-if="item.status === 'draft'"
                                                class="action-btn"
                                                @click.prevent="
                                                    promptDelete(item.id, item.title || '')
                                                "
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
                </div>
            </div>
        </template>

        <div v-else class="table-empty-state text-center py-5">
            <p class="mb-0 text-muted">No case studies found.</p>
        </div>

        <CaseActionReasonModal ref="reasonModal" @success="$emit('success')" />
        <CaseActionConfirmModal ref="confirmModal" @success="$emit('success')" />
        <CaseViewDetailsModal ref="mediaModal" />
    </div>
</template>

<style scoped>
.app-case-table {
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

/* Mobile Card View Styles */
.mobile-case-card {
    overflow: hidden;
}

.mobile-case-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #e9ecef;
}

.mobile-case-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    padding: 12px 15px;
    border-bottom: 1px solid #e9ecef;
    font-size: 15px;
}

.mobile-case-row:last-child {
    border-bottom: none;
}

.mobile-case-row .label {
    font-weight: 700;
    color: #262469;
}

.mobile-case-row .value {
    color: #262469;
    font-weight: 300;
}
</style>
