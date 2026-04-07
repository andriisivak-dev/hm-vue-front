<script setup lang="ts">
import { ref } from 'vue';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useCustomerMutations } from '@/api';
import type { SimpleField } from '@/form-engine/types';
import AppModal from '@/components/common/AppModal.vue';
import TextField from '@/components/form/fields/TextField.vue';

const emit = defineEmits(['success']);
const { create, loading } = useCustomerMutations();

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);

// ── Logo (unchanged — raw file input) ─────────────────────────────────────
const logoInput = ref<HTMLInputElement | null>(null);
const logoPreviewUrl = ref('');
const logoObjectUrl = ref('');
const logoError = ref('');

// ── Alert ─────────────────────────────────────────────────────────────────
const alertMsg = ref('');
const alertType = ref<'success' | 'danger'>('danger');

// ── Schema ────────────────────────────────────────────────────────────────
const schema = toTypedSchema(
    z.object({
        company_name: z.string().trim().min(1, 'Company name is required.'),
        email: z
            .string()
            .trim()
            .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
                message: 'Please enter a valid email address.'
            }),
        phone: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        customer_segment: z.string(),
        billing_center: z.string()
    })
);

const { handleSubmit, resetForm, submitCount } = useForm({
    validationSchema: schema,
    initialValues: {
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        customer_segment: '',
        billing_center: ''
    }
});

const { value: company_name, errorMessage: companyNameError } = useField<string>('company_name');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: phone } = useField<string>('phone');
const { value: address } = useField<string>('address');
const { value: city } = useField<string>('city');
const { value: state } = useField<string>('state');
const { value: customer_segment } = useField<string>('customer_segment');
const { value: billing_center } = useField<string>('billing_center');

// ── Field descriptors ─────────────────────────────────────────────────────
const companyNameField: SimpleField = {
    id: 'addCustomerCompanyName',
    label: 'Company Name',
    is_required: true,
    placeholder: 'Enter company name'
};
const emailField: SimpleField = {
    id: 'addCustomerEmail',
    label: 'Email',
    inputType: 'email',
    placeholder: 'Enter email'
};
const phoneField: SimpleField = {
    id: 'addCustomerPhone',
    label: 'Phone',
    placeholder: 'Enter phone number'
};
const addressField: SimpleField = {
    id: 'addCustomerAddress',
    label: 'Address',
    placeholder: 'Enter address'
};
const cityField: SimpleField = {
    id: 'addCustomerCity',
    label: 'City',
    placeholder: 'Enter city'
};
const stateField: SimpleField = {
    id: 'addCustomerState',
    label: 'State',
    placeholder: 'Enter state'
};
const segmentField: SimpleField = {
    id: 'addCustomerSegment',
    label: 'Customer Segment',
    placeholder: 'Enter segment'
};
const billingCenterField: SimpleField = {
    id: 'addCustomerBillingCenter',
    label: 'Billing Center',
    placeholder: 'Enter billing center'
};

// ── Public API ────────────────────────────────────────────────────────────
function open() {
    baseModal.value?.show();
}
defineExpose({ open });

// ── Logo helpers ──────────────────────────────────────────────────────────
function isValidLogoFile(file: File): string | null {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    const allowedExt = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExt.includes(ext)) {
        return 'Only SVG, PNG, JPG, JPEG, or WEBP files are allowed.';
    }
    if (file.size > 5 * 1024 * 1024) return 'Logo must be 5MB or less.';
    return null;
}

function onLogoChange() {
    const file = logoInput.value?.files?.[0];
    if (!file) {
        clearLogoPreview();
        return;
    }
    const err = isValidLogoFile(file);
    if (err) {
        logoError.value = err;
        clearLogoPreview();
        if (logoInput.value) logoInput.value.value = '';
        return;
    }
    logoError.value = '';
    if (logoObjectUrl.value) URL.revokeObjectURL(logoObjectUrl.value);
    logoObjectUrl.value = URL.createObjectURL(file);
    logoPreviewUrl.value = logoObjectUrl.value;
}

function clearLogoPreview() {
    if (logoObjectUrl.value) {
        URL.revokeObjectURL(logoObjectUrl.value);
        logoObjectUrl.value = '';
    }
    logoPreviewUrl.value = '';
}

function dismissLogo() {
    if (logoInput.value) logoInput.value.value = '';
    clearLogoPreview();
    logoError.value = '';
}

// ── Submit ────────────────────────────────────────────────────────────────
const onSubmit = handleSubmit(async (values) => {
    alertMsg.value = '';

    // Logo validation
    const file = logoInput.value?.files?.[0];
    if (file) {
        const err = isValidLogoFile(file);
        if (err) {
            logoError.value = err;
            return;
        }
    }

    const payload = new FormData();
    payload.append('company_name', values.company_name);
    payload.append('email', values.email);
    payload.append('phone', values.phone);
    payload.append('address', values.address);
    payload.append('city', values.city);
    payload.append('state', values.state);
    payload.append('customer_segment', values.customer_segment);
    payload.append('billing_center', values.billing_center);
    if (file) payload.append('logo', file);

    try {
        const result = await create(payload);
        if (result) {
            alertType.value = 'success';
            alertMsg.value = `✓ ${result.company_name} has been added successfully.`;
            emit('success');
            setTimeout(() => baseModal.value?.hide(), 3500);
        }
    } catch (e: unknown) {
        alertType.value = 'danger';
        alertMsg.value = e instanceof Error ? e.message : 'Failed to add customer.';
    }
});

// ── Reset ─────────────────────────────────────────────────────────────────
function onHidden() {
    resetForm();
    if (logoInput.value) logoInput.value.value = '';
    clearLogoPreview();
    logoError.value = '';
    alertMsg.value = '';
}
</script>

<template>
    <AppModal
        id="addCustomerModal"
        title="Add New Customer"
        description="Enter customer details"
        @hidden="onHidden"
        ref="baseModal"
    >
        <div v-if="alertMsg" class="alert mb-3" :class="`alert-${alertType}`" role="alert">
            {{ alertMsg }}
        </div>

        <form @submit.prevent="onSubmit" id="addCustomerForm" novalidate>
            <div class="mb-3">
                <TextField
                    :field="companyNameField"
                    v-model="company_name"
                    :error="submitCount > 0 ? companyNameError : undefined"
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
                <TextField :field="phoneField" v-model="phone" />
            </div>
            <div class="mb-3">
                <TextField :field="addressField" v-model="address" />
            </div>
            <div class="mb-3">
                <TextField :field="cityField" v-model="city" />
            </div>
            <div class="mb-3">
                <TextField :field="stateField" v-model="state" />
            </div>
            <div class="mb-3">
                <TextField :field="segmentField" v-model="customer_segment" />
            </div>
            <div class="mb-3">
                <TextField :field="billingCenterField" v-model="billing_center" />
            </div>

            <!-- Logo (unchanged) -->
            <div class="mb-3">
                <label for="addCustomerLogo" class="form-label">Logo</label>

                <div v-if="logoPreviewUrl" class="mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <div class="position-relative d-inline-block">
                            <img
                                :src="logoPreviewUrl"
                                alt="Selected customer logo preview"
                                style="max-height: 60px; max-width: 120px; object-fit: contain"
                            />
                            <button
                                type="button"
                                class="btn-close position-absolute top-0 end-0"
                                style="font-size: 0.6rem"
                                aria-label="Remove selected logo"
                                title="Remove selected logo"
                                @click="dismissLogo"
                            ></button>
                        </div>
                        <a
                            :href="logoPreviewUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="small"
                        >
                            Open selected logo
                        </a>
                    </div>
                </div>

                <input
                    type="file"
                    id="addCustomerLogo"
                    ref="logoInput"
                    class="form-control"
                    :class="{ 'is-invalid': logoError }"
                    accept=".svg,.png,.jpeg,.jpg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                    @change="onLogoChange"
                />
                <div class="form-text">Optional. Allowed: SVG, PNG, JPG, JPEG, WEBP. Max 5MB.</div>
                <div v-if="logoError" class="invalid-feedback d-block">{{ logoError }}</div>
            </div>

            <!-- Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-lgrey" @click="baseModal?.hide()">
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    id="addCustomerSubmit"
                    :disabled="loading"
                >
                    <span class="btn-text" :class="{ 'd-none': loading }">Add Customer</span>
                    <span
                        class="spinner-border spinner-border-sm btn-spinner"
                        :class="{ 'd-none': !loading }"
                        role="status"
                        ><span class="visually-hidden">Loading...</span></span
                    >
                </button>
            </div>
        </form>
    </AppModal>
</template>
