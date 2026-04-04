<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useUserMutations, useUserList } from '@/api';
import type { User } from '@/api/types';
import type { SimpleField } from '@/form-engine/types';
import AppModal from '@/components/common/AppModal.vue';
import TextField from '@/components/form/fields/TextField.vue';
import SelectField from '@/components/form/fields/SelectField.vue';
import PasswordField from '@/components/form/fields/PasswordField.vue';

const emit = defineEmits(['success']);
const { create, loading } = useUserMutations();
const { data: supervisorsList, fetch: fetchSupervisors } = useUserList();

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const alertMsg = ref('');
const alertType = ref('danger');
const supervisors = ref<User[]>([]);

const supervisorsLoaded = ref(false);

onMounted(() => {
    // Defer loading until modal opens
});

async function open() {
    baseModal.value?.show();
    if (!supervisorsLoaded.value) {
        await fetchSupervisors({ role: 'hm_manager', per_page: -1 });
        if (supervisorsList.value) supervisors.value = supervisorsList.value;
        supervisorsLoaded.value = true;
    }
}
defineExpose({ open });

const schema = toTypedSchema(
    z
        .object({
            full_name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
            email: z.string().trim().email('Please enter a valid email address.'),
            role: z.string().min(1, 'Please select a role.'),
            manager_id: z.string().optional(),
            password: z.string().min(8, 'Password must be at least 8 characters.')
        })
        .refine((data) => !(data.role === 'hm_field_agent' && !data.manager_id), {
            message: 'Please assign a supervisor.',
            path: ['manager_id']
        })
);

const { handleSubmit, resetForm, submitCount } = useForm({
    validationSchema: schema,
    initialValues: { full_name: '', email: '', role: '', manager_id: '', password: '' }
});

const { value: full_name, errorMessage: full_nameError } = useField<string>('full_name');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: role, errorMessage: roleError } = useField<string>('role');
const { value: manager_id, errorMessage: manager_idError } = useField<string>('manager_id');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const isFieldAgent = computed(() => role.value === 'hm_field_agent');

watch(isFieldAgent, (isAgent) => {
    if (!isAgent) manager_id.value = '';
});

const nameField: SimpleField = { id: 'addUserName', label: 'Full Name', is_required: true };
const emailField: SimpleField = {
    id: 'addUserEmail',
    label: 'Email Address',
    inputType: 'email',
    is_required: true
};
const roleField = computed<SimpleField>(() => ({
    id: 'addUserRole',
    label: 'Role',
    is_required: true,
    choices: [
        { text: 'Select role', value: '', isSelected: true },
        { text: 'Supervisor', value: 'hm_manager' },
        { text: 'Marketing', value: 'hm_marketing' },
        { text: 'Field Agent', value: 'hm_field_agent' }
    ]
}));
const managerField = computed<SimpleField>(() => ({
    id: 'addUserSupervisor',
    label: 'Assign to Supervisor',
    is_required: isFieldAgent.value,
    choices: [
        { text: 'Select supervisor', value: '', isSelected: true },
        ...supervisors.value.map((s) => ({
            text: s.full_name || (s as unknown as Record<string, string>).display_name,
            value: String(s.id)
        }))
    ]
}));
const passwordField: SimpleField = {
    id: 'addUserPassword',
    label: 'Initial Password',
    type: 'password',
    is_required: true
};

const onSubmit = handleSubmit(async (values) => {
    alertMsg.value = '';
    try {
        const payload: Record<string, unknown> = {
            full_name: values.full_name,
            email: values.email,
            role: values.role,
            password: values.password
        };
        if (values.role === 'hm_field_agent' && values.manager_id) {
            payload.manager_id = parseInt(values.manager_id, 10);
        }

        const result = await create(payload);
        if (result) {
            alertType.value = 'success';
            alertMsg.value = `✓ ${result.full_name || (result as unknown as Record<string, string>).display_name} has been added successfully.`;
            emit('success');
            setTimeout(() => {
                baseModal.value?.hide();
            }, 3500);
        } else {
            alertType.value = 'danger';
            alertMsg.value = 'Failed to add user.';
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        if (e instanceof Error) alertMsg.value = e.message;
        else if (e) alertMsg.value = (e as Record<string, string>).message;
        else alertMsg.value = 'An error occurred.';
    }
});

function onHidden() {
    resetForm();
    alertMsg.value = '';
}
</script>

<template>
    <AppModal
        id="addUserModal"
        title="Add New User"
        @hidden="onHidden"
        ref="baseModal"
        description="Enter user details and assign their role"
    >
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>
        <form @submit.prevent="onSubmit" id="addUserForm" novalidate>
            <div class="mb-3">
                <TextField
                    :field="nameField"
                    v-model="full_name"
                    :error="submitCount > 0 ? full_nameError : undefined"
                />
            </div>
            <div class="mb-3">
                <TextField
                    :field="emailField"
                    v-model="email"
                    :error="submitCount > 0 ? emailError : undefined"
                />
            </div>
            <div class="mb-3">
                <SelectField
                    :field="roleField"
                    v-model="role"
                    :error="submitCount > 0 ? roleError : undefined"
                />
            </div>
            <div class="mb-3" v-if="isFieldAgent">
                <SelectField
                    :field="managerField"
                    v-model="manager_id"
                    :error="submitCount > 0 ? manager_idError : undefined"
                />
            </div>
            <div class="mb-4">
                <PasswordField
                    :field="passwordField"
                    v-model="password"
                    :error="submitCount > 0 ? passwordError : undefined"
                />
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    id="addUserSubmit"
                    :disabled="loading"
                >
                    <span class="btn-text" :class="{ 'd-none': loading }">Add User</span>
                    <span
                        class="spinner-border spinner-border-sm btn-spinner"
                        :class="{ 'd-none': !loading }"
                        role="status"
                    >
                        <span class="visually-hidden">Loading...</span>
                    </span>
                </button>
            </div>
        </form>
    </AppModal>
</template>
