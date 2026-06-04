import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getRiskSummary } from '@/lib/managerRiskSummary'

export type { AssigneeRisk, StaleCaseItem, HandoverMissingProperty, RiskSummary as RiskSummaryResponse } from '@/lib/managerRiskSummary'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: '会社情報が取得できません。' }, { status: 403 })
    }

    const summary = await getRiskSummary(companyId)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('[manager/risk-summary]', error)
    return NextResponse.json({ error: 'リスク集計の取得に失敗しました。' }, { status: 500 })
  }
}
