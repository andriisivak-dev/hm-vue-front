import { defineRule, configure } from 'vee-validate'
import { required, email, min, max, numeric, min_value, max_value } from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

// Standard Vee-validate Rules
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('numeric', numeric)
defineRule('min_value', min_value)
defineRule('max_value', max_value)

// Custom Rules for GF specific logic
defineRule('gf_number', (value: any) => {
  if (!value) return true
  if (isNaN(parseFloat(value))) return false
  return true
})

configure({
  generateMessage: localize('en', {
    messages: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      numeric: 'This field must be a number',
      min_value: 'Value must be greater than or equal to {min}',
      max_value: 'Value must be less than or equal to {max}',
    },
  }),
})
