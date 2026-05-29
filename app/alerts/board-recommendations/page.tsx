import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
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
  message: string | null
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

function buildRecommendation(params: {
  item: CaseRow
  openTaskCount: number
  overdueTaskCount: number
  lastLogAt: string | null
}) {
  const { item, openTaskCount, overdueTaskCount, lastLogAt } = params

  const reasons: string[] = []
  let score = 0

  const ageDays = daysFrom(item.created_at)
  const staleDays = daysFrom(lastLogAt)

  if (!item.board_status || item.board_status === '未設定' || item.board_status === '未上程') {
    score += 2
    reasons.push('理事会ステータス未整備')
  }

  if (!item.board_agenda_title) {
    score += 1
    reasons.push('議案タイトル未設定')
  }

  if (ageDays >= 30) {
    score += 2
    reasons.push(`案件開始から${ageDays}日経過`)
  }

  if (staleDays >= 14) {
    score += 2
    reasons.push(`直近ログから${staleDays}日経過`)
  }

  if (openTaskCount >= 3) {
    score += 1
    reasons.push(`未完了タスク${openTaskCount}件`)
  }

  if (overdueTaskCount >= 1) {
    score += 2
    reasons.push(`期限切れタスク${overdueTaskCount}件`)
  }

  if (item.status === '保留' || item.status === '確認待ち') {
    score += 1
    reasons.push(`案件ステータス:${item.status}`)
  }

  return {
    score,
    reasons,
    ageDays,
    staleDays,
  }
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
        <h1 className="mb-4 text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select(
      'id, title, property_id, status, assignee, created_at, board_status, board_scheduled_for, board_agenda_title, board_next_action'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const activeCases = (cases ?? []).filter((item) => !isCompleted(item.status))

  const propertyIds = Array.from(
    new Set(activeCases.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const caseIds = activeCases.map((item) => item.id)

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
        .select('id, case_id, created_at, message')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as LogRow[] }

  const propertyMap = new Map<string, string>()
  for (const property of properties ?? []) {
    propertyMap.set(property.id, property.name ?? '物件名未設定')
  }

  const taskMap = new Map<string, TaskRow[]>()
  for (const task of tasks ?? []) {
    if (!task.case_id) continue
    const current = taskMap.get(task.case_id) ?? []
    current.push(task)
    taskMap.set(task.case_id, current)
  }

  const lastLogMap = new Map<string, string | null>()
  for (const log of logs ?? []) {
    if (!log.case_id) continue
    if (lastLogMap.has(log.case_id)) continue
    lastLogMap.set(log.case_id, log.created_at ?? null)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = activeCases
    .map((item) => {
      const taskList = taskMap.get(item.id) ?? []
      const openTaskCount = taskList.filter((task) => task.status !== '完了').length
      const overdueTaskCount = taskList.filter((task) => {
        if (task.status === '完了') return false
        if (!task.due_date) return false
        const due = new Date(task.due_date)
        if (Number.isNaN(due.getTime())) return false
        due.setHours(0, 0, 0, 0)
        return due.getTime() < today.getTime()
      }).length

      const lastLogAt = lastLogMap.get(item.id) ?? null
      const recommendation = buildRecommendation({
        item,
        openTaskCount,
        overdueTaskCount,
        lastLogAt,
      })

      return {
        ...item,
        propertyName: propertyMap.get(item.property_id ?? '') ?? '物件未設定',
        openTaskCount,
        overdueTaskCount,
        lastLogAt,
        ...recommendation,
      }
    })
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">理事会提出推奨アラート</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件の滞留、未完了タスク、理事会設定の不足を見て、理事会に乗せた方がよさそうな案件を上から表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">推奨件数</p>
          <p className="mt-2 text-3xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">対象案件数</p>
          <p className="mt-2 text-3xl font-bold">{activeCases.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">判定基準</p>
          <p className="mt-2 text-sm text-gray-700">
            未上程 / 長期化 / ログ停滞 / 期限切れ / 未完了タスク
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">今のところ、強く理事会提出を推奨する案件はありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.propertyName}</p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {item.title ?? '案件名未設定'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    ステータス: {item.status ?? '-'} / 担当者: {item.assignee ?? '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  推奨スコア {item.score}
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">案件開始日</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(item.created_at)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">未完了タスク</p>
                  <p className="mt-1 text-sm font-medium">{item.openTaskCount}件</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">期限切れタスク</p>
                  <p className="mt-1 text-sm font-medium">{item.overdueTaskCount}件</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">最終ログ日</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(item.lastLogAt)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-800">推奨理由</p>
                <div className="flex flex-wrap gap-2">
                  {item.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">次にやるとよいこと</p>
                <p className="mt-2 text-sm text-blue-800">
                  {item.board_agenda_title
                    ? `議案タイトル「${item.board_agenda_title}」をベースに、理事会上程準備へ進めてください。`
                    : 'まず議案タイトルを設定し、理事会に出すかの判断を案件担当者と確認してください。'}
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  {item.board_next_action
                    ? `登録済みの次アクション: ${item.board_next_action}`
                    : '案件詳細の理事会設定画面で、上程予定月と次アクションを埋めると実務で使いやすくなります。'}
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
                  href={`/properties/${item.property_id}/cases/${item.id}/board-settings`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  理事会設定を開く
                </Link>
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}/handover-summary`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  引き継ぎサマリーを見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}