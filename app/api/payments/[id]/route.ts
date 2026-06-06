import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // 督促ボタン押下時
  if (body.dunning) {
    const { data: current } = await supabase
      .from('payment_records').select('dunning_count').eq('id', id).single()
    body.dunning_count = (current?.dunning_count ?? 0) + 1
    body.last_dunning_date = new Date().toISOString().split('T')[0]
    delete body.dunning
  }

  // 入金確認時：paid_amount が total と同じなら paid
  if (body.paid_amount !== undefined) {
    const { data: rec } = await supabase
      .from('payment_records')
      .select('management_fee,reserve_fund,other_fee')
      .eq('id', id).single()
    if (rec) {
      const total = (rec.management_fee ?? 0) + (rec.reserve_fund ?? 0) + (rec.other_fee ?? 0)
      body.status = body.paid_amount >= total ? 'paid' : body.paid_amount > 0 ? 'partial' : 'unpaid'
      if (body.status === 'paid') body.payment_date = new Date().toISOString().split('T')[0]
    }
  }

  const { data, error } = await supabase
    .from('payment_records')
    .update(body)
    .eq('id', id)
    .eq('company_id', companyId)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
