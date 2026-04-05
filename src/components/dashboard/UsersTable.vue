<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useUserList } from '@/api';
import type { User } from '@/api/types';
import { IconRetry, NoUsersFound } from '@/components/SVG';
import AppPagination from '@/components/common/AppPagination.vue';
import { useUserStore } from '@/stores/user';

defineEmits(['edit', 'delete', 'recover']);

const userStore = useUserStore();
const { data: users, loading, error, meta, fetch } = useUserList();

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
                                <th
                                    class="text-center"
                                    v-if="userStore.user?.role !== 'hm_marketing'"
                                >
                                    Actions
                                </th>
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
                                <td
                                    data-label="Actions"
                                    class="text-center"
                                    v-if="userStore.user?.role !== 'hm_marketing'"
                                >
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
                                            data-bs-toggle="modal"
                                            data-bs-target="#recoverUserModal"
                                            @click="$emit('recover', user)"
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

        <AppPagination
            v-if="meta"
            :meta="meta"
            v-model:per-page="perPage"
            @change="fetchPage"
            aria-label="Users pagination"
        />
    </div>
</template>
