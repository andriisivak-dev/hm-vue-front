import { Parser } from 'expr-eval'
import type { GFCalculation } from './types'

export class FormulaEngine {
  private static parser = new Parser()

  /**
   * Evaluates a GF calculation formula based on current form values.
   *
   * @param calculation - The GFCalculation object from a field
   * @param values - Current form values (Record of fieldId -> value)
   * @returns number | string - The calculated value
   */
  static calculate(calculation: GFCalculation | null | undefined, values: Record<string, any>): number | string {
    if (!calculation || !calculation.enableCalculation || !calculation.formula) {
      return ''
    }

    const { formula, rounding } = calculation
    let processedFormula = formula

    // The GF formula format is usually something like: {Label:ID} * 5
    // We need to extract the IDs and replace them with variables like "field_ID" that expr-eval can understand.
    const fieldMapping: Record<string, number> = {}

    // Regex to find {Label:id} placeholders
    const placeholderRegex = /\{[^:}]+:(\d+(?:\.\d+)?)\}/g
    let match

    while ((match = placeholderRegex.exec(formula)) !== null) {
      const fullPlaceholder = match[0]
      const fieldId = match[1]

      // Determine the variable name for expr-eval (must start with letter, no dots)
      const varName = `field_${fieldId.replace('.', '_')}`

      // Update the formula for expr-eval
      processedFormula = processedFormula.replace(fullPlaceholder, varName)

      // Get the value of the field from current form state
      const rawValue = values[fieldId]
      const numValue = isNaN(parseFloat(rawValue)) ? 0 : parseFloat(rawValue)
      fieldMapping[varName] = numValue
    }

    try {
      // Evaluate the modified formula
      const result = this.parser.evaluate(processedFormula, fieldMapping)

      // Apply rounding if specified
      if (rounding && !isNaN(parseInt(rounding))) {
        const precision = parseInt(rounding)
        return Number(result.toFixed(precision))
      }

      return result
    } catch (error) {
      console.warn('Calculation error in formula:', formula, error)
      return 0
    }
  }
}
