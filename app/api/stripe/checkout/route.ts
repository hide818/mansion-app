import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { stripe, PLAN_TO_PRICE } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new NextResponse('ログインが必要です。', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
      return new NextResponse('所属会社を確認できませんでした。', { status: 400 })
    }

    if (profile.role !== 'admin') {
      return new NextResponse('管理者のみプランを変更できます。', { status: 403 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !['starter', 'standard', 'enterprise'].includes(plan)) {
      return new NextResponse('プランが不正です。', { status: 400 })
    }

    const priceId = PLAN_TO_PRICE[plan]
    if (!priceId) {
      return new NextResponse(
        `${plan} の Stripe Price ID が設定されていません。.env.local を確認してください。`,
        { status: 500 },
      )
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.company_id)
      .maybeSingle()

    if (!company) {
      return new NextResponse('会社情報を取得できませんでした。', { status: 500 })
    }

    // 既存の Stripe Customer がなければ作成
    let customerId = company.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: { company_id: company.id },
      })
      customerId = customer.id

      await supabase
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', company.id)
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/users?upgraded=1`,
      cancel_url: `${origin}/users?canceled=1`,
      metadata: {
        company_id: company.id,
        plan,
      },
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('stripe checkout error:', error)
    return new NextResponse('Stripe セッションの作成に失敗しました。', { status: 500 })
  }
}
