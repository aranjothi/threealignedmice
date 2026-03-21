// Dimension keys match the backend's snake_case field names
export const DIMENSION_LABELS = {
  task_completion:         'Task Completion',
  social_eng_resistance:   'Social Eng. Resistance',
  auth_boundary:           'Authorization Boundary',
  info_leakage:            'Information Leakage',
  appropriate_escalation:  'Appropriate Escalation',
  instruction_adherence:   'Instruction Adherence',
}

export const TIER_INFO = {
  1: { name: 'Greenhorn',   color: '#4a8c4a', bg: '#e8f5e8', border: '#4a8c4a' },
  2: { name: 'Outlaw',      color: '#8c6a00', bg: '#fdf3cd', border: '#c8a040' },
  3: { name: 'Bandit King', color: '#8c3000', bg: '#fde8d8', border: '#c04010' },
  4: { name: 'Mastermind',  color: '#6a006a', bg: '#f5e8f5', border: '#8b008b' },
}

// Normalize a backend scorecard payload to the shape the frontend uses
export function normalizeScorecard(data) {
  return {
    overallPassRate:      data.overall_pass_rate,
    dimRates:             data.dimension_rates ?? {},
    highestTier:          data.highest_tier_survived ?? 1,
    totalInteractions:    data.total_interactions,
    consistencyScore:     data.consistency_score ?? 1,
    criticalFailureCount: data.critical_failure_count ?? 0,
    falseRejectionRate:   data.false_rejection_rate ?? 0,
  }
}
