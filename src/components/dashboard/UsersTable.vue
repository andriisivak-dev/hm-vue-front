<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useUserList, useUserMutations } from '@/api';
import type { User } from '@/api/types';
import { ArrowNext, ArrowPrev, IconRetry, NoUsersFound } from '@/components/SVG';

defineEmits(['edit', 'delete']);

const { data: users, loading, error, meta, fetch } = useUserList();
const { update } = useUserMutations();

const page = ref(1);
const perPage = ref(20);
const searchQuery = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const filters = reactive({
    role: '',
    order: '',
    include_inactive: false
});

watch(
    () => [filters.role, filters.order, filters.include_inactive, perPage.value],
    () => {
        fetchPage(1);
    }
);

onMounted(() => {
    fetchPage(1);
});

function fetchPage(p: number) {
    page.value = p;
    fetch({
        page: page.value,
        per_page: perPage.value,
        search: searchQuery.value,
        role: filters.role || undefined,
        order: (filters.order as 'desc' | 'asc') || undefined,
        status: filters.include_inactive ? 'all' : 'active'
    });
}

function onSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchPage(1);
    }, 350);
}

function refresh() {
    fetchPage(page.value);
}

defineExpose({ refresh });

async function recoverUser(user: User) {
    if (!confirm(`Recover ${user.full_name}?`)) return;
    const result = await update(user.id, { status: 'active' });
    if (result) {
        refresh();
    }
}

// Helpers
function getRoleClass(role: string) {
    if (role === 'hm_manager') return 'bg-primary';
    if (role === 'hm_marketing') return 'bg-danger';
    if (role === 'hm_field_agent') return 'bg-info';
    return 'badge-role--default';
}

function getRoleLabel(role: string) {
    if (role === 'hm_manager') return 'Supervisor';
    if (role === 'hm_marketing') return 'Marketing';
    if (role === 'hm_field_agent') return 'Agent';
    return role;
}

function getAssignmentLabel(user: User) {
    const role = user.role;
    if (role === 'hm_field_agent') {
        return user.supervisor && user.supervisor.full_name ? user.supervisor.full_name : '—';
    }
    if (role === 'hm_manager') {
        const count = Number(user.agents?.length ?? 0);
        if (count === 1) return `${count} agent`;
        if (count > 1) return `${count} agents`;
    }
    return '—';
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

const paginationPages = computed(() => {
    if (!meta.value) return [];
    const current = page.value;
    const total = meta.value.total_pages;

    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set([1, total, current]);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const result: (number | string)[] = [];

    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
            result.push('…');
        }
        result.push(sorted[i]);
    }

    return result;
});

console.log(users);
</script>

<template>
    <div class="users-table-wrapper" id="usersTableWrapper">
        <div class="users-toolbar">
            <label for="userSearchInput">
                <input
                    type="search"
                    id="userSearchInput"
                    v-model="searchQuery"
                    @input="onSearch"
                    class="form-control users-toolbar__search-input"
                    placeholder="Search users by name, email"
                    autocomplete="off"
                    aria-label="Search users"
                />
            </label>

            <div class="users-toolbar__filters">
                <div class="form-check users-toolbar__filters_checkbox">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        v-model="filters.include_inactive"
                        id="usersShowInactiveFilter"
                    />
                    <label class="form-check-label" for="usersShowInactiveFilter">
                        Show inactive
                    </label>
                </div>

                <div class="users-toolbar__filters_select">
                    <select
                        id="userRoleFilter"
                        v-model="filters.role"
                        class="form-select users-toolbar__role-filter"
                        aria-label="Filter by role"
                    >
                        <option value="">All roles</option>
                        <option value="hm_manager">Supervisor</option>
                        <option value="hm_marketing">Marketing</option>
                        <option value="hm_field_agent">Agent</option>
                    </select>
                </div>
                <div class="users-toolbar__filters_select">
                    <select
                        id="userDateSortFilter"
                        v-model="filters.order"
                        class="form-select users-toolbar__date-sort-filter"
                        aria-label="Sort by joined date"
                    >
                        <option value="">Sort by date</option>
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body p-0">
                <div
                    class="table-preloader"
                    :class="{ 'is-active': loading }"
                    :aria-hidden="!loading"
                    id="usersTablePreloader"
                >
                    <div class="table-preloader__track">
                        <div class="table-preloader__bar"></div>
                    </div>
                </div>

                <div class="table-responsive" v-show="!loading && users && users.length > 0">
                    <table class="table table-hover mb-0" id="usersTable" aria-label="Users list">
                        <thead class="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Assignment</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <tr v-for="user in users" :key="user.id">
                                <td data-label="Name">{{ user.full_name }}</td>
                                <td data-label="Email">{{ user.email }}</td>
                                <td data-label="Role">
                                    <span class="badge" :class="getRoleClass(user.role)">{{
                                        getRoleLabel(user.role)
                                    }}</span>
                                </td>
                                <td data-label="Assignment">{{ getAssignmentLabel(user) }}</td>
                                <td>
                                    <span
                                        class="badge"
                                        :class="
                                            user.status === 'inactive'
                                                ? 'bg-secondary'
                                                : 'bg-success'
                                        "
                                    >
                                        {{ user.status === 'inactive' ? 'Inactive' : 'Active' }}
                                    </span>
                                </td>
                                <td data-label="Joined" class="text-muted">
                                    {{ formatDate(user.created_at) }}
                                </td>
                                <td data-label="Actions" class="text-center">
                                    <template v-if="user.status !== 'inactive'">
                                        <button
                                            class="btn btn-sm btn-link text-primary"
                                            data-bs-toggle="modal"
                                            data-bs-target="#editUserModal"
                                            @click="$emit('edit', user)"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            class="btn btn-sm btn-link text-danger"
                                            data-bs-toggle="modal"
                                            data-bs-target="#deleteUserModal"
                                            @click="$emit('delete', user)"
                                        >
                                            Remove
                                        </button>
                                    </template>
                                    <template v-else>
                                        <button
                                            class="btn btn-sm btn-link text-success"
                                            @click="recoverUser(user)"
                                        >
                                            Recover
                                        </button>
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    class="table-empty-state"
                    :class="{ 'd-none': loading || (users && users.length > 0) || error }"
                    id="usersTableEmpty"
                    role="status"
                >
                    <NoUsersFound />
                    <p>No users found.</p>
                    <span class="table-empty-state__sub" v-if="searchQuery"
                        >No results for "{{ searchQuery }}".</span
                    >
                </div>

                <div
                    class="table-error-state"
                    :class="{ 'd-none': !error }"
                    id="usersTableError"
                    role="alert"
                >
                    <IconRetry />
                    <p id="usersTableErrorMsg">{{ error?.message || 'Failed to load users.' }}</p>
                    <button class="btn btn-sm btn-outline-secondary" @click="fetchPage(page)">
                        Retry
                    </button>
                </div>
            </div>
        </div>

        <nav class="users-pagination" v-if="meta" aria-label="Users pagination">
            <div class="users-pagination__meta" aria-live="polite">
                Showing {{ Math.min((meta.page - 1) * meta.per_page + 1, meta.total) }}–{{
                    Math.min(meta.page * meta.per_page, meta.total)
                }}
                of {{ meta.total }}
            </div>
            <div class="users-pagination__controls" v-if="meta.total_pages > 1">
                <button
                    class="pagination-btn pagination-btn--nav"
                    :disabled="page <= 1"
                    @click="fetchPage(page - 1)"
                    aria-label="Previous page"
                >
                    <ArrowPrev />
                </button>
                <div style="display: inline-block">
                    <span v-for="p in paginationPages" :key="p">
                        <span v-if="p === '…'" class="pagination-ellipsis">…</span>
                        <button
                            v-else
                            class="pagination-btn"
                            :class="{ 'is-active': p === page }"
                            @click="fetchPage(p as number)"
                        >
                            {{ p }}
                        </button>
                    </span>
                </div>
                <button
                    class="pagination-btn pagination-btn--nav"
                    :disabled="page >= meta.total_pages"
                    @click="fetchPage(page + 1)"
                    aria-label="Next page"
                >
                    <ArrowNext />
                </button>
            </div>
            <div class="users-pagination__perpage">
                <label for="usersPerPage" class="visually-hidden">Rows per page</label>
                <select id="usersPerPage" v-model="perPage" class="form-select form-select-sm">
                    <option :value="3">3</option>
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                </select>
                <span class="users-pagination__perpage-label">per page</span>
            </div>
        </nav>
    </div>
</template>
