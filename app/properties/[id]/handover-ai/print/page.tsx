import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import PrintOpenButton from './PrintOpenButton'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
}

type PropertyCardRow = {
  management_memo: string | null
  board_memo: string | null
  resident_memo: string | null
  caution_note: string | null
  special_rule: string | null
  annual_schedule_memo: string | null
  chairman_memo: string | null
  officers_memo: string | null
  contact_memo: string | null
  past_trouble_summary: string | null
  pinned_note: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  board_next_action: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  case_id: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
  property_id: string
}

type HandoverDocumentRow = {
  id: string
  property_id: string
  company_id: string | null
  title: string
  content: string
  generated_content: string | null
  created_at: string
  updated_at: string
}

function formatDate(value: string | null) {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未設定'

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function safeText(value: string | null | undefined, fallback = '特記事項なし') {
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed ? trimmed : fallback
}

function buildGeneratedHandoverText(args: {
  property: PropertyRow
  card: PropertyCardRow | null
  cases: CaseRow[]
  tasks: TaskRow[]
  complaints: ComplaintRow[]
}) {
  const { property, card, cases, tasks, complaints } = args

  const incompleteTasks = tasks.filter((task) => task.status !== '完了')
  const urgentTasks = incompleteTasks.filter((task) => {
    if (!task.due_date) return false
    const due = new Date(task.due_date)
    if (Number.isNaN(due.getTime())) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return due <= today
  })

  const activeCases = cases.filter((item) => item.status !== '完了')
  const recentComplaints = complaints.slice(0, 5)

  const lines: string[] = []

  lines.push('【物件名】')
  lines.push(`${safeText(property.name, '名称未設定')}`)
  lines.push('')
  lines.push('【住所】')
  lines.push(`${safeText(property.address, '住所未設定')}`)
  lines.push('')
  lines.push('【引き継ぎ総評】')
  lines.push(
    `継続案件は ${activeCases.length} 件、未完了タスクは ${incompleteTasks.length} 件、対応注意が必要なクレームは ${recentComplaints.length} 件あります。`
  )
  lines.push(
    urgentTasks.length > 0
      ? `期限超過または本日期限のタスクが ${urgentTasks.length} 件あるため、優先確認が必要です。`
      : '直近で強い期限アラートのあるタスクは多くありません。'
  )
  lines.push('')
  lines.push('【重要情報】')
  lines.push(`・重要ピン留め: ${safeText(card?.pinned_note)}`)
  lines.push(`・注意事項: ${safeText(card?.caution_note)}`)
  lines.push(`・特殊ルール: ${safeText(card?.special_rule)}`)
  lines.push(`・連絡方法メモ: ${safeText(card?.contact_memo)}`)
  lines.push('')
  lines.push('【管理・理事会メモ】')
  lines.push(`・管理メモ: ${safeText(card?.management_memo)}`)
  lines.push(`・理事会メモ: ${safeText(card?.board_memo)}`)
  lines.push(`・年間スケジュールメモ: ${safeText(card?.annual_schedule_memo)}`)
  lines.push('')
  lines.push('【人対応メモ】')
  lines.push(`・理事長メモ: ${safeText(card?.chairman_memo)}`)
  lines.push(`・役員メモ: ${safeText(card?.officers_memo)}`)
  lines.push(`・居住者対応メモ: ${safeText(card?.resident_memo)}`)
  lines.push('')
  lines.push('【過去トラブル要約】')
  lines.push(`${safeText(card?.past_trouble_summary)}`)
  lines.push('')
  lines.push('【継続案件の要点】')

  if (activeCases.length === 0) {
    lines.push('・継続案件なし')
  } else {
    activeCases.slice(0, 10).forEach((item, index) => {
      lines.push(
        `・${index + 1}. ${safeText(item.title, '件名未設定')} / 状況: ${safeText(
          item.status,
          '未設定'
        )} / 担当: ${safeText(item.assignee, '未設定')} / 次アクション: ${safeText(
          item.board_next_action
        )}`
      )
    })
  }

  lines.push('')
  lines.push('【未完了タスク】')

  if (incompleteTasks.length === 0) {
    lines.push('・未完了タスクなし')
  } else {
    incompleteTasks.slice(0, 15).forEach((task, index) => {
      lines.push(
        `・${index + 1}. ${safeText(task.title, 'タスク名未設定')} / 優先度: ${safeText(
          task.priority,
          '未設定'
        )} / 期限: ${formatDate(task.due_date)} / 状況: ${safeText(task.status, '未設定')}`
      )
    })
  }

  lines.push('')
  lines.push('【最近のクレーム】')

  if (recentComplaints.length === 0) {
    lines.push('・最近のクレームなし')
  } else {
    recentComplaints.forEach((item, index) => {
      lines.push(
        `・${index + 1}. ${safeText(item.title, '件名未設定')} / 状況: ${safeText(
          item.status,
          '未設定'
        )} / 内容: ${safeText(item.detail)}`
      )
    })
  }

  lines.push('')
  lines.push('【次担当者が最初にやること】')
  if (urgentTasks.length > 0) {
    urgentTasks.slice(0, 5).forEach((task, index) => {
      lines.push(`・${index + 1}. ${safeText(task.title, 'タスク名未設定')} を確認する`)
    })
  } else if (activeCases.length > 0) {
    activeCases.slice(0, 5).forEach((item, index) => {
      lines.push(`・${index + 1}. ${safeText(item.title, '件名未設定')} の進捗を確認する`)
    })
  } else {
    lines.push('・物件カルテの内容と直近ログを確認する')
    lines.push('・次回理事会や点検予定の有無を確認する')
  }

  lines.push('')
  lines.push('【引き継ぎ補足メモ】')
  lines.push('・必要に応じて、この欄へ手入力で補足してください。')

  return lines.join('\n')
}

export default async function HandoverPrintPage({ params }: PageProps) {
  const resolvedParams = await params
  const propertyId = resolvedParams.id

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', propertyId)
    .single<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: card } = await supabase
    .from('property_cards')
    .select(
      'management_memo, board_memo, resident_memo, caution_note, special_rule, annual_schedule_memo, chairman_memo, officers_memo, contact_memo, past_trouble_summary, pinned_note'
    )
    .eq('property_id', propertyId)
    .maybeSingle<PropertyCardRow>()

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, assignee, board_next_action, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .returns<CaseRow[]>()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority, case_id')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .returns<TaskRow[]>()

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at, property_id')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .returns<ComplaintRow[]>()

  const { data: savedDocument } = await supabase
    .from('handover_documents')
    .select('id, property_id, company_id, title, content, generated_content, created_at, updated_at')
    .eq('property_id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle<HandoverDocumentRow>()

  const generatedContent = buildGeneratedHandoverText({
    property,
    card: card ?? null,
    cases: cases ?? [],
    tasks: tasks ?? [],
    complaints: complaints ?? [],
  })

  const finalContent =
    savedDocument?.content?.trim() ? savedDocument.content : generatedContent

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4;
          margin: 14mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #handover-print-sheet,
          #handover-print-sheet * {
            visibility: visible !important;
          }

          #handover-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex justify-end">
          <PrintOpenButton />
        </div>

        <div
          id="handover-print-sheet"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        >
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">引き継ぎ書</h1>
            <p className="mt-2 text-sm text-slate-600">
              物件名: {property.name ?? '物件名未設定'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              住所: {property.address ?? '住所未設定'}
            </p>
          </div>

          <div className="mt-6 whitespace-pre-wrap text-[14px] leading-8 text-slate-900">
            {finalContent}
          </div>
        </div>
      </div>
    </div>
  )
}