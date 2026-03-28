import type { GFConditionalLogic, GFRule } from './types'

export class LogicEngine {
  /**
   * Evaluates if a field should be shown or hidden based on its conditional logic.
   *
   * @param logic - The GFConditionalLogic object from the field
   * @param values - Current form values (Record of fieldId -> value)
   * @returns boolean - Whether the condition should trigger the 'actionType'
   */
  static shouldShow(logic: GFConditionalLogic | null | undefined, values: Record<string, any>): boolean {
    if (!logic || !logic.enabled || !logic.rules || logic.rules.length === 0) {
      return true
    }

    const { actionType, logicType, rules } = logic

    const results = rules.map((rule) => this.evaluateRule(rule, values))

    const isMatch = logicType === 'all'
      ? results.every((r) => r === true)
      : results.some((r) => r === true)

    // Trigger behavior: If 'show', then truthy means show. If 'hide', then truthy means hide.
    return actionType === 'show' ? isMatch : !isMatch
  }

  private static evaluateRule(rule: GFRule, values: Record<string, any>): boolean {
    const { fieldId, operator, value } = rule
    const currentValue = values[fieldId] !== undefined ? values[fieldId] : ''

    // Normalize value comparison (GF usually works with strings in rules)
    const normalizedRuleValue = String(value).toLowerCase()
    const normalizedCurrentValue = String(currentValue).toLowerCase()

    switch (operator) {
      case 'is':
        return normalizedCurrentValue === normalizedRuleValue
      case 'isnot':
        return normalizedCurrentValue !== normalizedRuleValue
      case 'greater_than':
        return parseFloat(normalizedCurrentValue) > parseFloat(normalizedRuleValue)
      case 'less_than':
        return parseFloat(normalizedCurrentValue) < parseFloat(normalizedRuleValue)
      case 'contains':
        return normalizedCurrentValue.includes(normalizedRuleValue)
      case 'starts_with':
        return normalizedCurrentValue.startsWith(normalizedRuleValue)
      case 'ends_with':
        return normalizedCurrentValue.endsWith(normalizedRuleValue)
      default:
        return false
    }
  }
}
