import Link from 'next/link'
import { notFound } from 'next/navigation'
import CopyReportButton from './CopyReportButton'
import SaveReportButton from './SaveReportButton'
import DeleteReportButton from './DeleteReportButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyDailyReportPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

type AnyRow = Record<string, unknown>

type SavedReportRow = {
  id: string
  title: string
  report_mode: string | null
  report_date: string | null
  created_at: string
}

function pickValue(row: AnyRow, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return String(value)
    }
  }
  return fallback
}

function toArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : []
}

function formatDateJP(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatOnlyDateJP(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatSavedDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isToday(value?: string | null) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function includesTodayByKeys(row: AnyRow, keys: string[]) {
  return keys.some((key) => {
    const v = row?.[key]
    return isToday(typeof v === 'string' ? v : null)
  })
}

function looksCompleted(task: AnyRow) {
  return task?.status === '完了'
}

function safeText(value: string | null | undefined) {
  const text = value?.trim()
  return text ? text : '特になし'
}

function buildComplaintSummary(complaints: AnyRow[]) {
  const recentComplaints = complaints.slice(0, 3)

  if (recentComplaints.length === 0) {
    return ['・直近クレームはありません。']
  }

  return recentComplaints.map((row, index) => {
    const title = pickValue(row, ['title', 'subject', 'name'], 'クレーム件名未設定')
    const category = pickValue(
      row,
      ['category', 'type', 'complaint_type'],
      '種別未設定'
    )
    const status = pickValue(
      row,
      ['status', 'handling_status', 'response_status'],
      '対応状況未設定'
    )
    const location = pickValue(row, ['location', 'place'], '場所未入力')
    const detail = pickValue(
      row,
      ['detail', 'description', 'body', 'content'],
      '詳細未入力'
    )

    return `・${index + 1}. ${title} / ${category} / ${status} / 場所: ${location} / 詳細: ${detail}`
  })
}

function buildNextActionLines(params: {
  todayCases: AnyRow[]
  todayTasks: AnyRow[]
  todayComplaints: AnyRow[]
  todayLogs: AnyRow[]
  overdueTasks: AnyRow[]
  repeatComplaints: AnyRow[]
}) {
  const {
    todayCases,
    todayTasks,
    todayComplaints,
    todayLogs,
    overdueTasks,
    repeatComplaints,
  } = params

  const lines: string[] = []

  if (overdueTasks.length > 0) {
    lines.push(`・期限切れタスク ${overdueTasks.length} 件の優先確認を行う。`)
  }

  if (repeatComplaints.length > 0) {
    lines.push(`・再発クレーム ${repeatComplaints.length} 件の再確認と経過整理を行う。`)
  }

  if (todayComplaints.length > 0) {
    lines.push('・本日動きのあったクレームの対応状況を更新する。')
  }

  if (todayTasks.length > 0) {
    lines.push('・本日動きのあったタスクの完了確認と残課題整理を行う。')
  }

  if (todayCases.length > 0) {
    lines.push('・案件の進捗更新と担当者確認を行う。')
  }

  if (todayLogs.length > 0) {
    lines.push('・本日のログ内容を確認し、必要なら補足記録を追加する。')
  }

  if (lines.length === 0) {
    lines.push('・継続案件、物件カルテ、直近クレームの確認を進める。')
  }

  return lines
}

function buildUrgentPoints(params: {
  propertyCard: {
    pinned_note: string | null
    management_memo: string | null
    board_memo: string | null
    caution_notes: string | null
    officer_memo: string | null
    updated_at: string | null
  } | null
  repeatComplaints: AnyRow[]
  overdueTasks: AnyRow[]
}) {
  const { propertyCard, repeatComplaints, overdueTasks } = params

  const lines: string[] = []

  if (safeText(propertyCard?.pinned_note) !== '特になし') {
    lines.push(`・ピン留め重要情報：${safeText(propertyCard?.pinned_note)}`)
  }

  if (safeText(propertyCard?.caution_notes) !== '特になし') {
    lines.push(`・注意事項：${safeText(propertyCard?.caution_notes)}`)
  }

  if (repeatComplaints.length > 0) {
    lines.push(`・再発クレーム：${repeatComplaints.length}件`)
  }

  if (overdueTasks.length > 0) {
    lines.push(`・期限切れタスク：${overdueTasks.length}件`)
  }

  if (lines.length === 0) {
    lines.push('・現在、強い注意喚起が必要な項目はありません。')
  }

  return lines
}

function buildPropertyDailyReport(params: {
  mode: 'short' | 'detail'
  propertyName: string
  propertyAddress: string | null
  propertyCard: {
    pinned_note: string | null
    management_memo: string | null
    board_memo: string | null
    caution_notes: string | null
    officer_memo: string | null
    updated_at: string | null
  } | null
  cases: AnyRow[]
  tasks: AnyRow[]
  complaints: AnyRow[]
  logs: AnyRow[]
}) {
  const {
    mode,
    propertyName,
    propertyAddress,
    propertyCard,
    cases,
    tasks,
    complaints,
    logs,
  } = params

  const now = new Date()
  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const todayCases = cases.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at'])
  )

  const todayTasks = tasks.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at', 'due_date'])
  )

  const todayComplaints = complaints.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at', 'occurred_at'])
  )

  const todayLogs = logs.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at'])
  )

  const completedTasks = todayTasks.filter((task) => looksCompleted(task))
  const pendingTasks = todayTasks.filter((task) => !looksCompleted(task))
  const overdueTasks = tasks.filter((task) => {
    const dueDate = task?.due_date
    if (!dueDate || typeof dueDate !== 'string') return false
    if (looksCompleted(task)) return false

    const due = new Date(dueDate)
    if (Number.isNaN(due.getTime())) return false

    return due < now
  })

  const repeatComplaints = complaints.filter((row) => row?.is_repeat === true)

  const urgentPoints = buildUrgentPoints({
    propertyCard,
    repeatComplaints,
    overdueTasks,
  })

  const nextActions = buildNextActionLines({
    todayCases,
    todayTasks,
    todayComplaints,
    todayLogs,
    overdueTasks,
    repeatComplaints,
  })

  const lines: string[] = []

  lines.push(`${dateLabel} 物件日報`)
  lines.push(`物件名：${propertyName}`)
  lines.push(`住所：${propertyAddress || '住所未登録'}`)
  lines.push(`出力モード：${mode === 'short' ? '短め版' : 'しっかり版'}`)
  lines.push('')

  lines.push('【本日の概要】')
  lines.push(`・案件関連：${todayCases.length}件`)
  lines.push(`・タスク関連：${todayTasks.length}件`)
  lines.push(`・クレーム関連：${todayComplaints.length}件`)
  lines.push(`・ログ記録：${todayLogs.length}件`)
  lines.push(`・再発クレーム：${repeatComplaints.length}件`)
  lines.push(`・期限切れタスク：${overdueTasks.length}件`)
  lines.push('')

  lines.push('【要注意ポイント】')
  urgentPoints.forEach((line) => {
    lines.push(line)
  })
  lines.push('')

  if (mode === 'short') {
    lines.push('【本日の動き】')

    if (
      todayCases.length === 0 &&
      todayTasks.length === 0 &&
      todayComplaints.length === 0 &&
      todayLogs.length === 0
    ) {
      lines.push('・本日は大きな更新はありません。')
    } else {
      if (todayCases.length > 0) {
        lines.push(`・案件更新あり：${todayCases.length}件`)
      }
      if (todayTasks.length > 0) {
        lines.push(`・タスク更新あり：${todayTasks.length}件`)
      }
      if (todayComplaints.length > 0) {
        lines.push(`・クレーム更新あり：${todayComplaints.length}件`)
      }
      if (todayLogs.length > 0) {
        lines.push(`・ログ追加あり：${todayLogs.length}件`)
      }
    }
    lines.push('')

    lines.push('【次にやること】')
    nextActions.forEach((line) => {
      lines.push(line)
    })
    lines.push('')

    lines.push('【一言まとめ】')
    if (
      todayCases.length === 0 &&
      todayTasks.length === 0 &&
      todayComplaints.length === 0 &&
      todayLogs.length === 0
    ) {
      lines.push(
        '・本日は静かな一日でした。要注意ポイントと継続対応の確認を優先します。'
      )
    } else {
      lines.push(
        '・本日はこの物件に関する対応が発生しています。要注意ポイントを優先して確認してください。'
      )
    }

    return lines.join('\n')
  }

  lines.push('【引き継ぎで重要な情報】')
  lines.push(`・ピン留め重要情報：${safeText(propertyCard?.pinned_note)}`)
  lines.push(`・注意事項：${safeText(propertyCard?.caution_notes)}`)
  lines.push(`・管理メモ：${safeText(propertyCard?.management_memo)}`)
  lines.push(`・理事会メモ：${safeText(propertyCard?.board_memo)}`)
  lines.push(`・理事長・役員対応メモ：${safeText(propertyCard?.officer_memo)}`)
  lines.push(`・カルテ最終更新：${formatDateJP(propertyCard?.updated_at ?? null)}`)
  lines.push('')

  lines.push('【案件】')
  if (todayCases.length === 0) {
    lines.push('・本日更新された案件はありません。')
  } else {
    todayCases.slice(0, 8).forEach((row) => {
      const title = pickValue(row, ['title', 'name', 'subject'], '案件名未設定')
      const status = pickValue(row, ['status'], 'ステータス不明')
      const assignee = pickValue(
        row,
        ['assignee', 'owner', 'person_in_charge'],
        '担当未設定'
      )
      lines.push(`・${title} / ${status} / 担当: ${assignee}`)
    })
  }
  lines.push('')

  lines.push('【タスク】')
  lines.push(`・本日対象タスク数：${todayTasks.length}件`)
  lines.push(`・完了扱い：${completedTasks.length}件`)
  lines.push(`・未完了扱い：${pendingTasks.length}件`)

  if (todayTasks.length === 0) {
    lines.push('・本日動きのあったタスクはありません。')
  } else {
    todayTasks.slice(0, 8).forEach((row) => {
      const title = pickValue(
        row,
        ['title', 'name', 'task_name', 'subject'],
        'タスク名未設定'
      )
      const priority = pickValue(
        row,
        ['priority', 'rank', 'level'],
        '優先度未設定'
      )
      const dueDate = pickValue(row, ['due_date', 'deadline'], '')
      const doneLabel = looksCompleted(row) ? '完了' : '未完了'
      const dueText = dueDate ? ` / 期限: ${formatOnlyDateJP(dueDate)}` : ''
      lines.push(`・${title} / ${doneLabel} / 優先度: ${priority}${dueText}`)
    })
  }
  lines.push('')

  lines.push('【本日クレーム】')
  if (todayComplaints.length === 0) {
    lines.push('・本日登録または更新されたクレームはありません。')
  } else {
    todayComplaints.slice(0, 8).forEach((row) => {
      const title = pickValue(
        row,
        ['title', 'subject', 'name'],
        'クレーム件名未設定'
      )
      const category = pickValue(
        row,
        ['category', 'type', 'complaint_type'],
        '種別未設定'
      )
      const status = pickValue(
        row,
        ['status', 'handling_status', 'response_status'],
        '対応状況未設定'
      )
      lines.push(`・${title} / ${category} / ${status}`)
    })
  }
  lines.push('')

  lines.push('【直近クレーム要約】')
  buildComplaintSummary(complaints).forEach((line) => {
    lines.push(line)
  })
  lines.push('')

  lines.push('【ログ】')
  if (todayLogs.length === 0) {
    lines.push('・本日追加されたログはありません。')
  } else {
    todayLogs.slice(0, 10).forEach((row) => {
      const body = pickValue(row, ['message'], '')
      const createdAt = pickValue(row, ['created_at'], '')
      if (body) {
        lines.push(`・${body} (${formatDateJP(createdAt)})`)
      } else {
        lines.push(`・ログ本文未取得 (${formatDateJP(createdAt)})`)
      }
    })
  }
  lines.push('')

  lines.push('【次にやること】')
  nextActions.forEach((line) => {
    lines.push(line)
  })
  lines.push('')

  lines.push('【一言まとめ】')
  if (
    todayCases.length === 0 &&
    todayTasks.length === 0 &&
    todayComplaints.length === 0 &&
    todayLogs.length === 0
  ) {
    lines.push(
      '・本日はこの物件に大きな更新はありませんでした。カルテ記載事項と直近クレームを確認しつつ、継続案件の対応を進めます。'
    )
  } else {
    lines.push(
      '・本日はこの物件に関する案件進行、タスク対応、クレーム確認、記録更新を中心に対応しました。引き継ぎ時は要注意ポイントと直近クレーム要約を優先確認してください。'
    )
  }

  return lines.join('\n')
}

export default async function PropertyDailyReportPage({
  params,
  searchParams,
}: PropertyDailyReportPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const mode = resolvedSearchParams.mode === 'short' ? 'short' : 'detail'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (propertyError || !property) {
    notFound()
  }

  const { data: propertyCard, error: propertyCardError } = await supabase
    .from('property_cards')
    .select(`
      property_id,
      management_memo,
      board_memo,
      caution_notes,
      officer_memo,
      pinned_note,
      updated_at
    `)
    .eq('property_id', id)
    .maybeSingle()

  if (propertyCardError) {
    throw new Error(`物件カルテ取得エラー: ${propertyCardError.message}`)
  }

  const casesRes = await supabase
    .from('cases')
    .select('*')
    .eq('property_id', id)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (casesRes.error) {
    throw new Error(`案件取得エラー: ${casesRes.error.message}`)
  }

  const cases = toArray(casesRes.data)
  const caseIds = new Set(
    cases
      .map((row) => row?.id)
      .filter((value) => value !== undefined && value !== null)
  )

  const tasksRes = await supabase
    .from('tasks')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (tasksRes.error) {
    throw new Error(`タスク取得エラー: ${tasksRes.error.message}`)
  }

  const allTasks = toArray(tasksRes.data)
  const propertyTasks = allTasks.filter((row) => {
    const propertyId = row?.property_id
    const caseId = row?.case_id

    if (propertyId && propertyId === id) return true
    if (caseId && caseIds.has(caseId)) return true

    return false
  })

  const complaintsRes = await supabase
    .from('complaints')
    .select('*')
    .eq('property_id', id)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (complaintsRes.error) {
    throw new Error(`クレーム取得エラー: ${complaintsRes.error.message}`)
  }

  const complaints = toArray(complaintsRes.data)

  const logsRes = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (logsRes.error) {
    throw new Error(`ログ取得エラー: ${logsRes.error.message}`)
  }

  const allLogs = toArray(logsRes.data)
  const propertyLogs = allLogs.filter((row) => {
    const caseId = row?.case_id
    if (caseId && caseIds.has(caseId)) return true
    return false
  })

  const savedReportsRes = await supabase
    .from('daily_reports')
    .select('id, title, report_mode, report_date, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('report_type', 'property_daily')
    .order('created_at', { ascending: false })
    .limit(5)

  if (savedReportsRes.error) {
    throw new Error(`保存済み日報取得エラー: ${savedReportsRes.error.message}`)
  }

  const savedReports = (savedReportsRes.data ?? []) as SavedReportRow[]

  const now = new Date()

  const todayCases = cases.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at'])
  )

  const todayTasks = propertyTasks.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at', 'due_date'])
  )

  const todayComplaints = complaints.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at', 'occurred_at'])
  )

  const todayLogs = propertyLogs.filter((row) =>
    includesTodayByKeys(row, ['created_at', 'updated_at'])
  )

  const repeatComplaints = complaints.filter((row) => row?.is_repeat === true)

  const overdueTasks = propertyTasks.filter((task) => {
    const dueDate = task?.due_date
    if (!dueDate || typeof dueDate !== 'string') return false
    if (looksCompleted(task)) return false

    const due = new Date(dueDate)
    if (Number.isNaN(due.getTime())) return false

    return due < now
  })

  const normalizedPropertyCard = propertyCard
    ? {
        pinned_note: propertyCard.pinned_note,
        management_memo: propertyCard.management_memo,
        board_memo: propertyCard.board_memo,
        caution_notes: propertyCard.caution_notes,
        officer_memo: propertyCard.officer_memo,
        updated_at: propertyCard.updated_at,
      }
    : null

  const urgentPoints = buildUrgentPoints({
    propertyCard: normalizedPropertyCard,
    repeatComplaints,
    overdueTasks,
  })

  const reportText = buildPropertyDailyReport({
    mode,
    propertyName: property.name ?? '物件名未設定',
    propertyAddress: property.address,
    propertyCard: normalizedPropertyCard,
    cases,
    tasks: propertyTasks,
    complaints,
    logs: propertyLogs,
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">物件別日報</p>
            <h1 className="text-3xl font-bold text-slate-900">
              {property.name} のワンクリック日報
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              この物件に関係する案件・タスク・クレーム・ログから日報を自動生成します。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/properties/${id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            >
              物件詳細へ戻る
            </Link>

            <SaveReportButton
              propertyId={id}
              propertyName={property.name ?? '物件名未設定'}
              mode={mode}
              reportText={reportText}
            />

            <CopyReportButton text={reportText} />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/properties/${id}/daily-report?mode=short`}
            className={`inline-flex min-w-[64px] items-center justify-center rounded-xl px-4 py-2 font-medium ${
              mode === 'short'
                ? 'bg-slate-900 !text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            短め版
          </Link>

          <Link
            href={`/properties/${id}/daily-report?mode=detail`}
            className={`inline-flex min-w-[64px] items-center justify-center rounded-xl px-4 py-2 font-medium ${
              mode === 'detail'
                ? 'bg-slate-900 !text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            しっかり版
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">今日の案件</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {todayCases.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">今日のタスク</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {todayTasks.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">今日のクレーム</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {todayComplaints.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">今日のログ</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {todayLogs.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">再発クレーム</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {repeatComplaints.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">期限切れタスク</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {overdueTasks.length}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-bold text-amber-900">要注意ポイント</h2>
          <div className="mt-3 space-y-2 text-sm text-amber-900">
            {urgentPoints.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-emerald-900">次にやること</h2>
          <div className="mt-3 space-y-2 text-sm text-emerald-900">
            {buildNextActionLines({
              todayCases,
              todayTasks,
              todayComplaints,
              todayLogs,
              overdueTasks,
              repeatComplaints,
            }).map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">保存済み日報</h2>
          </div>

          <div className="space-y-3">
            {savedReports.length === 0 && (
              <p className="text-sm text-gray-500">まだ保存された日報はありません。</p>
            )}

            {savedReports.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>
                        モード：
                        {item.report_mode === 'short' ? '短め版' : 'しっかり版'}
                      </span>
                      <span>対象日：{item.report_date ?? '-'}</span>
                      <span>保存日時：{formatSavedDate(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/properties/${id}/daily-report/${item.id}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      詳細を見る
                    </Link>

                    <DeleteReportButton reportId={item.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              生成された日報
            </h2>
            <CopyReportButton text={reportText} />
          </div>

          <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100">
            {reportText}
          </pre>
        </div>
      </div>
    </div>
  )
}