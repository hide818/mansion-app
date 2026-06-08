export type Plan = 'trial' | 'starter' | 'standard' | 'enterprise'

export const PLAN_LABELS: Record<Plan, string> = {
  trial:      '無料トライアル（14日間）',
  starter:    'スタータープラン',
  standard:   'スタンダードプラン',
  enterprise: 'エンタープライズプラン',
}

export const PLAN_PRICE: Record<Plan, string> = {
  trial:      '無料',
  starter:    '¥29,800/月',
  standard:   '¥59,800/月',
  enterprise: '要相談',
}

export const PLAN_USER_LIMIT: Record<Plan, number> = {
  trial:      5,
  starter:    5,
  standard:   20,
  enterprise: Infinity,
}

export function getPlanUserLimit(plan: string): number {
  return PLAN_USER_LIMIT[plan as Plan] ?? 5
}

export function getPlanLabel(plan: string): string {
  return PLAN_LABELS[plan as Plan] ?? plan
}

export function getPlanPrice(plan: string): string {
  return PLAN_PRICE[plan as Plan] ?? ''
}
