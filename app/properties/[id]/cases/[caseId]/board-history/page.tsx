import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CopyTextButton from '@/app/components/CopyTextButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_decision_note: string | null
  board_next_action: string | null
}

type BoardReportSetRow = {
  id: string
  title: string | null
  created_at: string | null
  mode: string | null
  progress_text: string | null
  recent_action_text: string | null
  next_plan_text: string | null
  decision_text: string | null
  agenda_title: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function buildHistoryText(params: {
  propertyName: string
  caseItem: CaseRow
  reportSets: BoardReportSetRow[]
}) {
  const { propertyName, caseItem, reportSets } = params

  const lines: string[] = []

  lines.push(`【物件名】${propertyName}`)
  lines.push(`【案件名】${caseItem.title ?? '案件名未設定'}`)
  lines.push('■理事会履歴整理')
  lines.push(`・理事会ステータス: ${caseItem.board_status ?? '未設定'}`)
  lines.push(`・上程予定: ${formatDate(caseItem.board_scheduled_for)}`)
  lines.push(`・議案タイトル: ${caseItem.board_agenda_title ?? '未設定'}`)
  lines.push(`・決定状況: ${caseItem.board_decision_status ?? '未設定'}`)
  lines.push(`・決定日: ${formatDate(caseItem.board_decision_date)}`)
  lines.push(`・決定メモ: ${caseItem.board_decision_note ?? '未設定'}`)
  lines.push(`・次アクション: ${caseItem.board_next_action ?? '未設定'}`)
  lines.push('')

  lines.push('■保存済み理事会提出セット')
  if (reportSets.length === 0) {
    lines.push('・保存済みセットなし')
  } else {
    for (const item of reportSets) {
      lines.push(
        `・${formatDate(item.created_at)} / ${item.title ?? 'タイトル未設定'} / 議案:${item.agenda_title ?? '未設定'}`
      )
    }
  }

  return lines.join('\n')
}

export default async function BoardHistoryPage({ params }: PageProps) {
  const { id, caseId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">理事会履歴管理</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: caseItem, error: caseError } = await supabase
    .from('cases')
    .select(
      'id, property_id, title, status, board_status, board_scheduled_for, board_agenda_title, board_decision_status, board_decision_date, board_decision_note, board_next_action'
    )
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const { data: reportSets } = await supabase
    .from('board_report_sets')
    .select(
      'id, title, created_at, mode, progress_text, recent_action_text, next_plan_text, decision_text, agenda_title'
    )
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  const historyText = buildHistoryText({
    propertyName: property.name ?? '物件名未設定',
    caseItem,
    reportSets: reportSets ?? [],
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">理事会履歴管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            この案件の理事会まわりの状態と、保存済み提出セットをまとめて見ます。
          </p>
        </div>

        <CopyTextButton text={historyText} label="履歴整理をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/board-draft`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          理事会報告ドラフトへ
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">現在の理事会情報</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            理事会ステータス: {caseItem.board_status ?? '未設定'}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            上程予定: {formatDate(caseItem.board_scheduled_for)}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            議案タイトル: {caseItem.board_agenda_title ?? '未設定'}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            決定状況: {caseItem.board_decision_status ?? '未設定'}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            決定日: {formatDate(caseItem.board_decision_date)}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            次アクション: {caseItem.board_next_action ?? '未設定'}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          決定メモ: {caseItem.board_decision_note ?? '未設定'}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">保存済み理事会提出セット</h2>

        {!reportSets || reportSets.length === 0 ? (
          <p className="mt-4 text-sm text-gray-700">保存済みの理事会提出セットはありません。</p>
        ) : (
          <div className="mt-4 space-y-4">
            {reportSets.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title ?? 'タイトル未設定'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>議案タイトル: {item.agenda_title ?? '未設定'}</p>
                  <p>モード: {item.mode ?? '未設定'}</p>
                  <p>進捗: {item.progress_text ?? '未設定'}</p>
                  <p>最近の動き: {item.recent_action_text ?? '未設定'}</p>
                  <p>今後の予定: {item.next_plan_text ?? '未設定'}</p>
                  <p>決定文: {item.decision_text ?? '未設定'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}