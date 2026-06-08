import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import HandoverEditor, { type HandoverSections } from './HandoverEditor'
import HandoverExportButtons from './HandoverExportButtons'

type PageProps = { params: Promise<{ id: string }> }

function fmt(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function safe(v: string | null | undefined) {
  return v?.trim() || null
}

export default async function HandoverAiPage({ params }: PageProps) {
  const { id: propertyId } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const [
    { data: property },
    { data: card },
    { data: cases },
    { data: tasks },
    { data: complaints },
    { data: saved },
  ] = await Promise.all([
    supabase.from('properties')
      .select('id, name, address, built_year, structure, total_units, total_floors, association_name, president_name, president_phone, president_email, management_fee, repair_reserve, reserve_balance, repair_plan_year, contract_start, contract_renewal, cleaning_company, elevator_company, insurance_company')
      .eq('id', propertyId).eq('company_id', companyId).maybeSingle(),
    supabase.from('property_cards')
      .select('management_memo, board_memo, caution_notes, officer_memo, pinned_note')
      .eq('property_id', propertyId).maybeSingle(),
    supabase.from('cases')
      .select('id, title, status, assignee, board_next_action, created_at')
      .eq('property_id', propertyId).eq('company_id', companyId)
      .neq('status', '完了').order('created_at', { ascending: false }).limit(15),
    supabase.from('tasks')
      .select('id, title, status, due_date, priority')
      .eq('property_id', propertyId).eq('company_id', companyId)
      .neq('status', '完了').order('due_date', { ascending: true }).limit(15),
    supabase.from('complaints')
      .select('id, title, status, created_at')
      .eq('property_id', propertyId).eq('company_id', companyId)
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('handover_documents')
      .select('content, updated_at')
      .eq('property_id', propertyId).eq('company_id', companyId).maybeSingle(),
  ])

  if (!property) notFound()

  // ── セクション初期値をDBから構築 ──────────────────────────────

  const builtYear = property.built_year
  const age = builtYear ? `${new Date().getFullYear() - builtYear}年（${builtYear}年竣工）` : null

  const 物件概要Lines = [
    `物件名: ${property.name ?? '未設定'}`,
    `住所: ${property.address ?? '未設定'}`,
    age && `築年数: ${age}`,
    property.structure && `構造: ${property.structure}`,
    property.total_units && `総戸数: ${property.total_units}戸`,
    property.total_floors && `総階数: ${property.total_floors}階`,
    property.association_name && `管理組合: ${property.association_name}`,
    property.president_name && `理事長: ${property.president_name}`,
    property.president_phone && `理事長電話: ${property.president_phone}`,
    property.president_email && `理事長メール: ${property.president_email}`,
  ].filter(Boolean).map((l) => `・${l}`).join('\n')

  const 財務情報Lines = [
    property.management_fee && `管理費: ${property.management_fee.toLocaleString()}円/月/戸`,
    property.repair_reserve && `修繕積立金: ${property.repair_reserve.toLocaleString()}円/月/戸`,
    property.reserve_balance && `積立金残高: 約${Math.round(property.reserve_balance / 10000)}万円`,
    property.repair_plan_year && `長期修繕計画 次回改定: ${property.repair_plan_year}年`,
    property.contract_start && `委託契約開始: ${fmt(property.contract_start)}`,
    property.contract_renewal && `委託契約更新: ${fmt(property.contract_renewal)}`,
    property.cleaning_company && `清掃業者: ${property.cleaning_company}`,
    property.elevator_company && `EV保守: ${property.elevator_company}`,
    property.insurance_company && `損保: ${property.insurance_company}`,
  ].filter(Boolean).map((l) => `・${l}`).join('\n')

  const 重要注意事項 = [
    card?.pinned_note && `【重要ピン留め】\n${card.pinned_note}`,
    card?.caution_notes && `【注意事項】\n${card.caution_notes}`,
  ].filter(Boolean).join('\n\n')

  const 理事長対応 = safe(card?.officer_memo) ?? ''
  const 管理メモ = [
    card?.management_memo && `【管理メモ】\n${card.management_memo}`,
    card?.board_memo && `【理事会メモ】\n${card.board_memo}`,
  ].filter(Boolean).join('\n\n')

  // 案件・タスク・クレームはDB一覧をそのまま表示（AIで改善可能）
  const 進行中案件Lines = (cases ?? []).length === 0
    ? '・進行中の案件はありません'
    : (cases ?? []).map((c) => `・${c.title ?? '無題'} / 状況: ${c.status ?? '-'} / 担当: ${c.assignee ?? '-'}${c.board_next_action ? ` / 次アクション: ${c.board_next_action}` : ''}`).join('\n')

  const 未完了タスクLines = (tasks ?? []).length === 0
    ? '・未完了タスクはありません'
    : (tasks ?? []).map((t) => `・${t.title ?? '無題'} / 優先: ${t.priority ?? '-'} / 期限: ${fmt(t.due_date) ?? '未設定'}`).join('\n')

  const クレームLines = (complaints ?? []).length === 0
    ? '・継続中のクレームはありません'
    : (complaints ?? []).map((c) => `・${c.title ?? '無題'} / 状況: ${c.status ?? '-'} / ${fmt(c.created_at) ?? '-'}`).join('\n')

  // 保存済み引き継ぎ書があればセクションを復元、なければDBから構築
  function parseSaved(content: string): Partial<HandoverSections> {
    const result: Partial<HandoverSections> = {}
    const keys: string[] = ['物件概要','財務情報','重要注意事項','理事長対応メモ','管理・理事会メモ','進行中の案件','未完了タスク','クレーム・継続事項','次担当者への申し送り']
    const sectionKeys: (keyof HandoverSections)[] = ['物件概要','財務情報','重要注意事項','理事長対応','管理メモ','進行中案件','未完了タスク','クレーム継続事項','申し送り']
    for (let i = 0; i < keys.length; i++) {
      const label = keys[i]
      const key = sectionKeys[i]
      const regex = new RegExp(`【${label}】\\n([\\s\\S]*?)(?=【|$)`)
      const match = content.match(regex)
      if (match) result[key] = match[1].replace(/（記入なし）/g, '').trim()
    }
    return result
  }

  const savedSections = saved?.content ? parseSaved(saved.content) : {}

  const initialSections: HandoverSections = {
    物件概要:      savedSections.物件概要      ?? 物件概要Lines,
    財務情報:      savedSections.財務情報      ?? 財務情報Lines,
    重要注意事項:  savedSections.重要注意事項  ?? 重要注意事項,
    理事長対応:    savedSections.理事長対応    ?? 理事長対応,
    管理メモ:      savedSections.管理メモ      ?? 管理メモ,
    進行中案件:    savedSections.進行中案件    ?? 進行中案件Lines,
    未完了タスク:  savedSections.未完了タスク  ?? 未完了タスクLines,
    クレーム継続事項: savedSections.クレーム継続事項 ?? クレームLines,
    申し送り:      savedSections.申し送り      ?? '',
  }

  const urgentCount = (tasks ?? []).filter((t) => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    d.setHours(0, 0, 0, 0)
    const td = new Date(); td.setHours(0, 0, 0, 0)
    return d <= td
  }).length

  return (
    <div className="space-y-6 p-6">
      <Link href={`/properties/${propertyId}`} className="inline-block rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        ← 物件詳細へ戻る
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-slate-500">引き継ぎAI</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{property.name ?? '物件名未設定'} の引き継ぎ書</h1>
        <p className="mt-2 text-sm text-slate-600">物件情報・カルテは自動入力済みです。「引き継ぎ書を生成する」ボタンで案件・タスク・クレームをAIが補完します。</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">継続案件 {(cases ?? []).length}件</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">未完了タスク {(tasks ?? []).length}件</span>
          {urgentCount > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">期限超過 {urgentCount}件</span>}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">クレーム {(complaints ?? []).length}件</span>
        </div>
      </div>

      <HandoverExportButtons
        propertyId={propertyId}
        propertyName={property.name ?? '物件名未設定'}
        address={property.address ?? '住所未設定'}
        content={saved?.content ?? ''}
      />

      <HandoverEditor
        propertyId={propertyId}
        initialSections={initialSections}
        updatedAt={saved?.updated_at ?? null}
      />
    </div>
  )
}
