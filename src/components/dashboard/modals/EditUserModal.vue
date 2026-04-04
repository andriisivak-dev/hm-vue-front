<script setup lang="ts">
import { ref, computed } from 'vue';
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

const { update, loading } = useUserMutations();
const { data: supervisorsList, fetch: fetchSupervisors } = useUserList();

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const alertMsg = ref('');
const alertType = ref('danger');
const user = ref<User | null>(null);
const supervisors = ref<User[]>([]);

const schema = toTypedSchema(
    z
        .object({
            full_name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
            email: z.string().trim().email('Please enter a valid email address.'),
            role: z.string().min(1, 'Please select a role.'),
            manager_id: z.string().optional(),
            password: z
                .string()
                .transform((val) => val.trim())
                .refine((val) => val === '' || val.length >= 8, {
                    message: 'Password must be at least 8 characters.'
                })
                .optional()
        })
        .refine((data) => !(data.role === 'hm_field_agent' && !data.manager_id), {
            message: 'Please assign a supervisor.',
            path: ['manager_id']
        })
);

const { handleSubmit, resetForm, setValues, submitCount } = useForm({
    validationSchema: schema,
    initialValues: { full_name: '', email: '', role: '', manager_id: '', password: '' }
});

const { value: full_name, errorMessage: full_nameError } = useField<string>('full_name');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: role, errorMessage: roleError } = useField<string>('role');
const { value: manager_id, errorMessage: manager_idError } = useField<string>('manager_id');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const isFieldAgent = computed(
    () => role.value === 'hm_field_agent' || role.value === 'field_agent'
);

async function open(userData: User) {
    user.value = userData;
    baseModal.value?.show();
    await fetchSupervisors({ role: 'hm_manager', per_page: -1 });
    if (supervisorsList.value) supervisors.value = supervisorsList.value;

    let parsedRole =
        userData.role ||
        ((userData as unknown as { roles?: string[] }).roles
            ? (userData as unknown as { roles?: string[] }).roles![0]
            : '');
    if (parsedRole === 'manager') parsedRole = 'hm_manager';
    if (parsedRole === 'marketing') parsedRole = 'hm_marketing';
    if (parsedRole === 'field_agent') parsedRole = 'hm_field_agent';

    const parsedManagerId =
        userData.supervisor && userData.supervisor.id
            ? String(userData.supervisor.id)
            : (userData as unknown as Record<string, unknown>).manager_id
              ? String((userData as unknown as Record<string, unknown>).manager_id)
              : '';

    setValues({
        full_name:
            userData.full_name ||
            (userData as unknown as Record<string, string>).display_name ||
            '',
        email: userData.email || '',
        role: parsedRole,
        manager_id: parsedManagerId,
        password: ''
    });
    alertMsg.value = '';
}
defineExpose({ open });

const nameField: SimpleField = { id: 'editUserName', label: 'Full Name', is_required: true };
const emailField: SimpleField = {
    id: 'editUserEmail',
    label: 'Email Address',
    inputType: 'email',
    is_required: true
};
const roleField = computed<SimpleField>(() => ({
    id: 'editUserRole',
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
    id: 'editUserSupervisor',
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
    id: 'editUserPassword',
    label: 'New Password (Optional)',
    type: 'password',
    is_required: false
};

const onSubmit = handleSubmit(async (values) => {
    alertMsg.value = '';
    if (!user.value?.id) return;
    try {
        const payload: Record<string, unknown> = {
            full_name: values.full_name,
            email: values.email,
            role: values.role
        };
        if (values.password) payload.password = values.password;
        if (isFieldAgent.value && values.manager_id)
            payload.manager_id = parseInt(values.manager_id, 10);

        const result = await update(user.value.id, payload);
        if (result) {
            alertType.value = 'success';
            alertMsg.value = `✓ ${result.full_name || (result as unknown as Record<string, string>).display_name} has been updated successfully.`;
            emit('success');
            setTimeout(() => {
                baseModal.value?.hide();
            }, 1500);
        } else {
            alertType.value = 'danger';
            alertMsg.value = 'Failed to update user.';
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        if (e instanceof Error) alertMsg.value = e.message;
        else if (e) alertMsg.value = (e as Record<string, string>).message;
        else alertMsg.value = 'An error occurred.';
    }
});

function reset() {
    user.value = null;
    resetForm();
    alertMsg.value = '';
}
</script>

<template>
    <AppModal id="editUserModal" title="Edit User" @hidden="reset" ref="baseModal">
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>
        <form @submit.prevent="onSubmit" id="editUserForm" novalidate v-if="user">
            <input type="hidden" :value="user.id" id="editUserId" />
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
                    id="editUserSubmit"
                    :disabled="loading"
                >
                    <span class="btn-text" :class="{ 'd-none': loading }">Update User</span>
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
