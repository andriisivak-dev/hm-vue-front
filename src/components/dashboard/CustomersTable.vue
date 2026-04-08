<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCustomerList } from '@/api';
import type { Customer } from '@/api/types';
import { IconRetry, NoUsersFound } from '@/components/SVG';
import AppPagination from '@/components/common/AppPagination.vue';
import AppTable from '@/components/common/AppTable.vue';

defineEmits<{
    edit: [customer: Customer];
    delete: [customer: Customer];
}>();

const { data: customers, loading, error, meta, fetch } = useCustomerList();

const page = ref(1);
const perPage = ref(20);
const searchQuery = ref('');
const billingCenterFilter = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Billing center options loaded from the first successful fetch
const billingCenterOptions = ref<string[]>([]);

watch(
    () => [billingCenterFilter.value, perPage.value],
    () => fetchPage(1)
);

onMounted(() => fetchPage(1));

async function fetchPage(p: number) {
    page.value = p;
    await fetch({
        page: page.value,
        per_page: perPage.value,
        search: searchQuery.value || undefined,
        billing_center: billingCenterFilter.value || undefined
    });

    // Populate billing center options from current data (first load, no filters)
    if (
        !billingCenterFilter.value &&
        !searchQuery.value &&
        billingCenterOptions.value.length === 0
    ) {
        const centers = (customers.value ?? [])
            .map((c) => c.billing_center)
            .filter((bc) => bc && bc.trim() !== '');
        billingCenterOptions.value = [...new Set(centers)].sort();
    }
}

function onSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchPage(1), 350);
}

function refresh() {
    fetchPage(page.value);
}

defineExpose({ refresh });

function safe(value: string | null | undefined): string {
    const text = String(value ?? '').trim();
    return text !== '' ? text : '—';
}
</script>

<template>
    <div class="users-table-wrapper" id="customersTableWrapper">
        <!-- Toolbar -->
        <div class="users-toolbar">
            <label for="customerSearchInput">
                <input
                    type="search"
                    id="customerSearchInput"
                    v-model="searchQuery"
                    @input="onSearch"
                    class="form-control users-toolbar__search-input"
                    placeholder="Search by name, email, phone, location"
                    autocomplete="off"
                    aria-label="Search customers"
                />
            </label>

            <div class="users-toolbar__filters">
                <div class="users-toolbar__filters_select">
                    <select
                        id="customerBillingCenterFilter"
                        v-model="billingCenterFilter"
                        class="form-select users-toolbar__role-filter"
                        aria-label="Filter by billing center"
                    >
                        <option value="">All billing centers</option>
                        <option
                            v-for="center in billingCenterOptions"
                            :key="center"
                            :value="center"
                        >
                            {{ center }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Card / Table -->
        <div class="card">
            <div class="card-body p-0 app-customers-table">
                <!-- Preloader bar -->
                <div
                    class="table-preloader"
                    :class="{ 'is-active': loading }"
                    :aria-hidden="!loading"
                    id="customersTablePreloader"
                >
                    <div class="table-preloader__track">
                        <div class="table-preloader__bar"></div>
                    </div>
                </div>

                <AppTable
                    :show="Boolean(customers && customers.length > 0)"
                    ariaLabel="Customers list"
                    :style="{
                        opacity: loading ? 0.5 : 1,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: loading ? 'none' : 'auto'
                    }"
                >
                    <template #head>
                        <tr>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Billing Center</th>
                            <th>Location</th>
                            <th>City</th>
                            <th>State</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </template>
                    <template #body>
                        <tr v-for="customer in customers" :key="customer.id">
                            <td data-label="Customer Name">
                                {{ safe(customer.company_name) }}
                            </td>
                            <td data-label="Email" :title="safe(customer.email)">
                                {{ safe(customer.email) }}
                            </td>
                            <td data-label="Phone" :title="safe(customer.phone)">
                                {{ safe(customer.phone) }}
                            </td>
                            <td data-label="Billing Center">
                                {{ safe(customer.billing_center) }}
                            </td>
                            <td data-label="Location">{{ safe(customer.address) }}</td>
                            <td data-label="City">{{ safe(customer.city) }}</td>
                            <td data-label="State">{{ safe(customer.state) }}</td>
                            <td data-label="Actions" class="text-center">
                                <div class="customer-actions-wrap">
                                    <button
                                        class="btn btn-sm btn-link text-primary js-edit-customer"
                                        aria-label="Edit customer"
                                        title="Edit customer details"
                                        @click="$emit('edit', customer)"
                                    >
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button
                                        class="btn btn-sm btn-link text-danger js-delete-customer"
                                        aria-label="Delete customer"
                                        title="Delete customer"
                                        @click="$emit('delete', customer)"
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </AppTable>

                <!-- Empty state -->
                <div
                    class="table-empty-state"
                    :class="{ 'd-none': loading || (customers && customers.length > 0) || error }"
                    id="customersTableEmpty"
                    role="status"
                >
                    <NoUsersFound />
                    <p>No customers found.</p>
                    <span class="table-empty-state__sub" id="customersTableEmptySub">
                        <template v-if="searchQuery">No results for "{{ searchQuery }}".</template>
                    </span>
                </div>

                <!-- Error state -->
                <div
                    class="table-error-state"
                    :class="{ 'd-none': !error }"
                    id="customersTableError"
                    role="alert"
                >
                    <IconRetry />
                    <p id="customersTableErrorMsg">
                        {{ error?.message || 'Failed to load customers.' }}
                    </p>
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        id="customersTableRetry"
                        @click="fetchPage(page)"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <AppPagination
            v-if="meta"
            :meta="meta"
            v-model:per-page="perPage"
            @change="fetchPage"
            aria-label="Customers pagination"
        />
    </div>
</template>

<style scoped>
.app-customers-table {
    min-height: 400px;
    position: relative;
}
</style>
