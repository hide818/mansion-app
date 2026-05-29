import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
  due_date: string | null
  priority: string | null
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

function getTemperature(score: number) {
  if (score >= 8) return '炎上'
  if (score >= 5) return '注意'
  return '平和'
}

function getRiskLabel(score: number) {
  if (score >= 8) return '高'
  if (score >= 5) return '中'
  return '低'
}

function getRiskBadgeClass(score: number) {
  if (score >= 8) return 'bg-red-50 text-red-700'
  if (score >= 5) return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

function isCompleted(status: string | null) {
  return status === '完了'
}

export default async function SlowCasesPage() {
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
        <h1 className="mb-4 text-2xl font-bold">時間がかかりすぎている案件分析</h1>
        <p className="text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, title, property_id, status, assignee, created_at, board_status, board_scheduled_for')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">時間がかかりすぎている案件分析</h1>
        <p className="text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const targetCases = (cases ?? []).filter((item) => !isCompleted(item.status))
  const caseIds = targetCases.map((item) => item.id)
  const propertyIds = Array.from(
    new Set(targetCases.map((item) => item.property_id).filter(Boolean))
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
        .select('id, case_id, status, due_date, priority')
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

  const rows = targetCases
    .map((item) => {
      const taskList = taskMap.get(item.id) ?? []
      const openTasks = taskList.filter((task) => task.status !== '完了')
      const overdueTasks = openTasks.filter((task) => {
        if (!task.due_date) return false
        const due = new Date(task.due_date)
        if (Number.isNaN(due.getTime())) return false
        due.setHours(0, 0, 0, 0)
        return due.getTime() < today.getTime()
      })

      const highPriorityOpenTasks = openTasks.filter(
        (task) => task.priority === '高' || task.priority === '緊急'
      )

      const ageDays = daysFrom(item.created_at)
      const staleDays = daysFrom(lastLogMap.get(item.id) ?? null)

      let score = 0
      if (ageDays >= 60) score += 3
      else if (ageDays >= 30) score += 2
      else if (ageDays >= 14) score += 1

      if (staleDays >= 21) score += 3
      else if (staleDays >= 14) score += 2
      else if (staleDays >= 7) score += 1

      if (overdueTasks.length >= 3) score += 3
      else if (overdueTasks.length >= 1) score += 2

      if (openTasks.length >= 5) score += 2
      else if (openTasks.length >= 3) score += 1

      if (highPriorityOpenTasks.length >= 1) score += 1

      if (!item.board_status || item.board_status === '未設定') {
        score += 1
      }

      const risk = getRiskLabel(score)
      const temperature = getTemperature(score)

      let bottleneck = '通常範囲'
      if (staleDays >= 14) bottleneck = 'ログ更新不足'
      if (openTasks.length >= 5) bottleneck = 'タスク渋滞'
      if (overdueTasks.length >= 2) bottleneck = '期限遅延'
      if (ageDays >= 60 && staleDays >= 14) bottleneck = '長期停滞'

      return {
        ...item,
        propertyName: propertyMap.get(item.property_id ?? '') ?? '物件未設定',
        openTaskCount: openTasks.length,
        overdueTaskCount: overdueTasks.length,
        highPriorityOpenTaskCount: highPriorityOpenTasks.length,
        lastLogAt: lastLogMap.get(item.id) ?? null,
        ageDays,
        staleDays,
        score,
        risk,
        temperature,
        bottleneck,
      }
    })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)

  const flamingCount = rows.filter((item) => item.temperature === '炎上').length
  const warningCount = rows.filter((item) => item.temperature === '注意').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">時間がかかりすぎている案件分析</h1>
        <p className="mt-2 text-sm text-gray-600">
          長期化、ログ停滞、期限遅延、タスク渋滞をもとに、今つまずいている案件を優先順で並べています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">要確認案件</p>
          <p className="mt-2 text-3xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">炎上</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{flamingCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">注意</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{warningCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">分析対象</p>
          <p className="mt-2 text-3xl font-bold">{targetCases.length}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">今のところ、時間がかかりすぎている案件は強く検知されていません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.propertyName}</p>
                  <h2 className="text-lg font-bold">{item.title ?? '案件名未設定'}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    ステータス: {item.status ?? '-'} / 担当者: {item.assignee ?? '-'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(
                      item.score
                    )}`}
                  >
                    リスク {item.risk}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(
                      item.score
                    )}`}
                  >
                    温度感 {item.temperature}
                  </span>
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-5">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">経過日数</p>
                  <p className="mt-1 text-sm font-medium">{item.ageDays}日</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">最終ログから</p>
                  <p className="mt-1 text-sm font-medium">{item.staleDays}日</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">未完了タスク</p>
                  <p className="mt-1 text-sm font-medium">{item.openTaskCount}件</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">期限切れ</p>
                  <p className="mt-1 text-sm font-medium">{item.overdueTaskCount}件</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">つまずき原因</p>
                  <p className="mt-1 text-sm font-medium">{item.bottleneck}</p>
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">おすすめ対応</p>
                <p className="mt-2 text-sm text-gray-700">
                  {item.overdueTaskCount >= 1
                    ? 'まず期限切れタスクを整理し、今日中に誰が何をやるかを決めてください。'
                    : item.staleDays >= 14
                      ? 'まず最新状況を1本ログに残し、止まっている理由を見える化してください。'
                      : item.ageDays >= 30
                        ? '案件のゴールと締め日を再確認し、長期化の原因を担当者とすり合わせてください。'
                        : '案件詳細を開いて、次にやることカードと未完了タスクを確認してください。'}
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
                  href={`/properties/${item.property_id}/cases/${item.id}/handover-summary`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  引き継ぎサマリー
                </Link>
                <Link
                  href={`/properties/${item.property_id}/cases/${item.id}/handover-checklist`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  引き継ぎチェックリスト
                </Link>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                作成日: {formatDate(item.created_at)} / 最終ログ: {formatDate(item.lastLogAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}