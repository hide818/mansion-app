import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
  due_date: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function daysFrom(value: string | null) {
  if (!value) return 9999
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 9999

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function isCompleted(status: string | null) {
  return status === '完了'
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export default async function BoardRecommendationsPage() {
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
        <h1 className="text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select(
      'id, property_id, title, status, assignee, created_at, board_status, board_scheduled_for, board_agenda_title, board_next_action'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="mt-4 text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const activeCases = (cases ?? []).filter((item) => !isCompleted(item.status))
  const caseIds = activeCases.map((item) => item.id)
  const propertyIds = Array.from(
    new Set(activeCases.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } = propertyIds.length
    ? await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', propertyIds)
    : { data: [] as PropertyRow[] }

  const { data: tasks } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, case_id, status, due_date')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
    : { data: [] as TaskRow[] }

  const { data: logs } = caseIds.length
    ? await supabase
        .from('logs')
        .select('id, case_id, created_at')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as LogRow[] }

  const propertyMap = new Map<string, string>()
  for (const item of properties ?? []) {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  }

  const taskMap = new Map<string, TaskRow[]>()
  for (const item of tasks ?? []) {
    if (!item.case_id) continue
    const current = taskMap.get(item.case_id) ?? []
    current.push(item)
    taskMap.set(item.case_id, current)
  }

  const latestLogMap = new Map<string, string | null>()
  for (const item of logs ?? []) {
    if (!item.case_id) continue
    if (latestLogMap.has(item.case_id)) continue
    latestLogMap.set(item.case_id, item.created_at ?? null)
  }

  const rows = activeCases
    .map((item) => {
      const caseTasks = taskMap.get(item.id) ?? []
      const overdueCount = caseTasks.filter(
        (task) => task.status !== '完了' && isOverdue(task.due_date)
      ).length
      const openTaskCount = caseTasks.filter((task) => task.status !== '完了').length
      const staleDays = daysFrom(latestLogMap.get(item.id) ?? null)
      const ageDays = daysFrom(item.created_at)

      let score = 0
      const reasons: string[] = []

      if (!item.board_status || item.board_status === '未設定' || item.board_status === '未上程') {
        score += 2
        reasons.push('理事会ステータスが未整備')
      }

      if (!item.board_agenda_title) {
        score += 1
        reasons.push('議案タイトル未設定')
      }

      if (ageDays >= 30) {
        score += 2
        reasons.push(`案件開始から ${ageDays} 日経過`)
      }

      if (staleDays >= 14) {
        score += 2
        reasons.push(`直近ログから ${staleDays} 日経過`)
      }

      if (overdueCount >= 1) {
        score += 2
        reasons.push(`期限切れタスク ${overdueCount} 件`)
      }

      if (openTaskCount >= 3) {
        score += 1
        reasons.push(`未完了タスク ${openTaskCount} 件`)
      }

      return {
        ...item,
        propertyName: propertyMap.get(item.property_id ?? '') ?? '物件未設定',
        staleDays,
        ageDays,
        overdueCount,
        openTaskCount,
        score,
        reasons,
      }
    })
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="mt-2 text-sm text-gray-600">
          長期化、停滞、期限切れ、理事会設定不足から、理事会に乗せるべき案件を先に出します。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/board-cases"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          理事会予定案件一覧へ
        </Link>
        <Link
          href="/cases"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          全案件一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">推奨件数</p>
          <p className="mt-2 text-3xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">分析対象案件</p>
          <p className="mt-2 text-3xl font-bold">{activeCases.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">判定基準</p>
          <p className="mt-2 text-sm font-medium">
            長期化 / 停滞 / 期限切れ / 理事会設定不足
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">
            今のところ、強く理事会提出を推奨する案件はありません。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.propertyName}</p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {item.title ?? '案件名未設定'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    担当者: {item.assignee ?? '-'} / 状態: {item.status ?? '-'}
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  推奨スコア {item.score}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {item.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  >
                    {reason}
                  </span>
                ))}
              </div>

              <div className="mb-4 rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">まずやること</p>
                <p className="mt-2 text-sm text-blue-800">
                  {item.board_agenda_title
                    ? `議案タイトル「${item.board_agenda_title}」をもとに、上程準備に進んでください。`
                    : 'まず議案タイトルを決め、そのうえで理事会に出すか判断してください。'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}`}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  案件詳細を見る
                </Link>
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}/coverage-check`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  対応抜けチェック
                </Link>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                開始日: {formatDate(item.created_at)} / 上程予定: {formatDate(item.board_scheduled_for)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}