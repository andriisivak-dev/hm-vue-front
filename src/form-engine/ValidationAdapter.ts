import type { GFField } from './types'

export class ValidationAdapter {
  /**
   * Generates a vee-validate compatible rule string based on GF field settings.
   */
  static getRules(field: GFField): string | Record<string, any> {
    const rules: string[] = []
    const validation = field.validation

    if (field.isRequired || validation?.isRequired) {
      rules.push('required')
    }

    if (field.type === 'email') {
      rules.push('email')
    }

    if (field.type === 'number' || field.type === 'calculation') {
      rules.push('gf_number') // Our custom rule from validator.ts

      if (validation?.rangeMin !== undefined && validation?.rangeMin !== null && validation?.rangeMin !== '') {
        rules.push(`min_value:${validation.rangeMin}`)
      }
      if (validation?.rangeMax !== undefined && validation?.rangeMax !== null && validation?.rangeMax !== '') {
        rules.push(`max_value:${validation.rangeMax}`)
      }
    }

    if (field.type === 'text' || field.type === 'textarea') {
      if (validation?.maxLength) {
        rules.push(`max:${validation.maxLength}`)
      }
    }

    // Return joined rules string
    return rules.join('|')
  }
}
