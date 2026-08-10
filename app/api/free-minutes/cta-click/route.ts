import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未ログイン' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const yearMonth = getYearMonth()

    await admin
      .from('free_minutes_usage')
      .upsert(
        { user_id: user.id, year_month: yearMonth, kura_cta_clicked: true },
        { onConflict: 'user_id,year_month', ignoreDuplicates: false },
      )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('free-minutes/cta-click error:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
