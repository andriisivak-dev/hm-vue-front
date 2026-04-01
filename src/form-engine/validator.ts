import { defineRule, configure } from 'vee-validate';
import { required, email, min, max, numeric, min_value, max_value } from '@vee-validate/rules';
import { localize } from '@vee-validate/i18n';

// Standard Vee-validate Rules
defineRule('required', required);
defineRule('email', email);
defineRule('min', min);
defineRule('max', max);
defineRule('numeric', numeric);
defineRule('min_value', min_value);
defineRule('max_value', max_value);

// Custom Rules for GF specific logic
defineRule('gf_number', (value: unknown) => {
    if (!value) return true;
    return !isNaN(parseFloat(String(value)));
});

defineRule('positive_integer', (value: unknown) => {
    if (value === null || value === undefined || value === '') return true;
    const raw = String(value).trim();
    if (raw === '') return true;

    // checks: only digits (no decimal/sign) AND > 0
    const isInteger = /^\d+$/.test(raw);
    return isInteger && parseInt(raw, 10) > 0;
});

configure({
    generateMessage: localize('en', {
        messages: {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            numeric: 'This field must be a number',
            min_value: 'Value must be greater than or equal to {0}',
            max_value: 'Value must be less than or equal to {0}',
            positive_integer: 'Please enter a whole number greater than 0.'
        }
    })
});
