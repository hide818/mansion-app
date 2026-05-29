import Link from 'next/link'
import CopyReportButton from './CopyReportButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

type AnyRow = Record<string, any>

function pickValue(row: AnyRow, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
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
  return keys.some((key) => isToday(row?.[key]))
}

function looksCompleted(task: AnyRow) {
  const booleanKeys = [
    'is_completed',
    'completed',
    'is_done',
    'done',
    'finished',
  ]

  for (const key of booleanKeys) {
    if (typeof task?.[key] === 'boolean') {
      return task[key] === true
    }
  }

  const statusValue = String(
    pickValue(task, ['status', 'task_status', 'state'], '')
  ).toLowerCase()

  if (
    statusValue === '完了' ||
    statusValue === 'completed' ||
    statusValue === 'done' ||
    statusValue === 'closed'
  ) {
    return true
  }

  return false
}

function buildDailyReport(params: {
  cases: AnyRow[]
  tasks: AnyRow[]
  complaints: AnyRow[]
  logs: AnyRow[]
}) {
  const { cases, tasks, complaints, logs } = params

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

  const lines: string[] = []

  lines.push(`${dateLabel} 日報`)
  lines.push('')
  lines.push('【本日の概要】')
  lines.push(`・案件関連：${todayCases.length}件`)
  lines.push(`・タスク関連：${todayTasks.length}件`)
  lines.push(`・クレーム関連：${todayComplaints.length}件`)
  lines.push(`・ログ記録：${todayLogs.length}件`)
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

  lines.push('【クレーム】')
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

  lines.push('【ログ】')
  if (todayLogs.length === 0) {
    lines.push('・本日追加されたログはありません。')
  } else {
    todayLogs.slice(0, 10).forEach((row) => {
      const type = pickValue(row, ['type'], 'manual')
      const body = pickValue(
        row,
        ['body', 'message', 'note', 'description', 'detail', 'text', 'content'],
        ''
      )
      const createdAt = pickValue(row, ['created_at'], '')
      if (body) {
        lines.push(`・[${type}] ${body} (${formatDateJP(createdAt)})`)
      } else {
        lines.push(`・[${type}] ログ本文未取得 (${formatDateJP(createdAt)})`)
      }
    })
  }
  lines.push('')

  lines.push('【一言まとめ】')
  if (
    todayCases.length === 0 &&
    todayTasks.length === 0 &&
    todayComplaints.length === 0 &&
    todayLogs.length === 0
  ) {
    lines.push(
      '・本日は大きな更新が少ない日でした。継続案件と今後の対応予定の確認を進めます。'
    )
  } else {
    lines.push(
      '・本日は案件進行、タスク対応、記録更新を中心に対応しました。未完了項目は明日以降も継続して確認します。'
    )
  }

  return lines.join('\n')
}

export default async function DailyReportPage() {
  const supabase = await createSupabaseServerClient()

  const [casesRes, tasksRes, complaintsRes, logsRes] = await Promise.all([
    supabase.from('cases').select('*').limit(100),
    supabase.from('tasks').select('*').limit(100),
    supabase.from('complaints').select('*').limit(100),
    supabase.from('logs').select('*').limit(100),
  ])

  const cases = toArray(casesRes.data)
  const tasks = toArray(tasksRes.data)
  const complaints = toArray(complaintsRes.data)
  const logs = toArray(logsRes.data)

  const errors = [
    { name: 'cases', error: casesRes.error },
    { name: 'tasks', error: tasksRes.error },
    { name: 'complaints', error: complaintsRes.error },
    { name: 'logs', error: logsRes.error },
  ].filter((item) => item.error)

  const reportText = buildDailyReport({
    cases,
    tasks,
    complaints,
    logs,
  })

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              ワンクリック日報
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              今日の案件・タスク・クレーム・ログから日報の下書きを自動生成します。
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ダッシュボードへ戻る
            </Link>

            <CopyReportButton text={reportText} />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              一部のデータ取得でエラーがあります
            </p>

            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
              {errors.map((item) => (
                <li key={item.name}>
                  {item.name}: {item.error?.message}
                </li>
              ))}
            </ul>

            <p className="mt-2 text-sm text-red-700">
              ただし、取得できたデータだけでページ表示は続行しています。
            </p>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
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