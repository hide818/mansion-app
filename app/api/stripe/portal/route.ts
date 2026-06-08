import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { stripe } from '@/lib/stripe'

// Stripe Customer Portal: プラン変更・解約・請求情報管理
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
      return new NextResponse('管理者のみ請求情報を管理できます。', { status: 403 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', profile.company_id)
      .maybeSingle()

    if (!company?.stripe_customer_id) {
      return new NextResponse('Stripe 顧客情報が見つかりません。まずプランを購入してください。', {
        status: 400,
      })
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id as string,
      return_url: `${origin}/users`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('stripe portal error:', error)
    return new NextResponse('Stripe ポータルの作成に失敗しました。', { status: 500 })
  }
}
