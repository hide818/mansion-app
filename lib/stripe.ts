import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// Stripe Price ID → プラン名のマッピング
// Stripe ダッシュボードで作成した Price の ID をここに設定してください
export const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']:   'starter',
  [process.env.STRIPE_PRICE_STANDARD ?? '']:  'standard',
  [process.env.STRIPE_PRICE_ENTERPRISE ?? '']: 'enterprise',
}

export const PLAN_TO_PRICE: Record<string, string> = {
  starter:    process.env.STRIPE_PRICE_STARTER ?? '',
  standard:   process.env.STRIPE_PRICE_STANDARD ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
}
