import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Stripe Webhook は Raw Body が必要なので bodyParser を無効化
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function updateCompanyPlan(companyId: string, plan: string, subscription: Stripe.Subscription) {
  const supabase = getSupabaseAdmin()

  const priceId = subscription.items.data[0]?.price?.id ?? null

  await supabase
    .from('companies')
    .update({
      plan,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
    })
    .eq('id', companyId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new NextResponse('stripe-signature ヘッダーがありません。', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('webhook signature verification failed:', err)
    return new NextResponse('Webhook 署名の検証に失敗しました。', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        const plan = session.metadata?.plan

        if (!companyId || !plan) break

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await updateCompanyPlan(companyId, plan, subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id
        if (!companyId) break

        const priceId = subscription.items.data[0]?.price?.id ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'starter'

        // サブスクリプションがアクティブな場合のみプランを更新
        if (subscription.status === 'active') {
          await updateCompanyPlan(companyId, plan, subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id
        if (!companyId) break

        const supabase = getSupabaseAdmin()
        await supabase
          .from('companies')
          .update({
            plan: 'trial',
            stripe_subscription_id: null,
            stripe_price_id: null,
          })
          .eq('id', companyId)
        break
      }

      default:
        // 処理不要なイベントは無視
        break
    }
  } catch (error) {
    console.error('webhook handler error:', error)
    return new NextResponse('Webhook 処理中にエラーが発生しました。', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
