import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: record, error } = await supabase
    .from('payment_records')
    .select('*, units(unit_number), residents(name, email), properties(name)')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !record) return NextResponse.json({ error: '記録が見つかりません' }, { status: 404 })

  const email = (record.residents as { name: string; email: string | null } | null)?.email
  if (!email) return NextResponse.json({ error: 'メールアドレスが登録されていません' }, { status: 400 })

  const residentName = (record.residents as { name: string } | null)?.name ?? '居住者'
  const unitNumber = (record.units as { unit_number: string } | null)?.unit_number ?? ''
  const propertyName = (record.properties as { name: string } | null)?.name ?? 'マンション'
  const total = record.management_fee + record.reserve_fund + record.other_fee

  const breakdownLines = [
    `管理費：${record.management_fee.toLocaleString('ja-JP')}円`,
    `修繕積立金：${record.reserve_fund.toLocaleString('ja-JP')}円`,
    record.other_fee > 0 ? `その他：${record.other_fee.toLocaleString('ja-JP')}円` : null,
  ].filter(Boolean).join('\n')

  const subject = `【${propertyName}】管理費・修繕積立金 未払いのご連絡（${record.billing_year}年${record.billing_month}月分）`

  const textBody = `${residentName} 様${unitNumber ? `（${unitNumber}号室）` : ''}

${propertyName}の管理を担当している管理会社よりご連絡申し上げます。

${record.billing_year}年${record.billing_month}月分の管理費・修繕積立金につきまして、
現在のところお支払いの確認ができておりません。

■ 未払い金額
${breakdownLines}
合計：${total.toLocaleString('ja-JP')}円

お手数ですが、至急お支払いいただきますようお願い申し上げます。
既にお支払い済みの場合は、本メールとのお行き違いにつきご了承ください。

ご不明な点がございましたら、管理組合事務局までご連絡ください。`

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  const { error: sendError } = await resend.emails.send({
    from,
    to: email,
    subject,
    text: textBody,
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  // 督促カウントをインクリメント
  const { data: current } = await supabase
    .from('payment_records')
    .select('dunning_count')
    .eq('id', id)
    .single()

  await supabase
    .from('payment_records')
    .update({
      dunning_count: (current?.dunning_count ?? 0) + 1,
      last_dunning_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
