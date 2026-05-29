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
  board_status: string | null
  board_scheduled_for: string | null
  board_next_action: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
  due_date: string | null
}

type LogRow = {
  case_id: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type RiskLevel = '低' | '中' | '高'

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

function diffDaysFromToday(value: string | null) {
  if (!value) return null

  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  return Math.floor((todayStart.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
}

function getRiskBadgeClass(level: RiskLevel) {
  if (level === '高') return 'bg-red-50 text-red-800 border-red-200'
  if (level === '中') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  return 'bg-green-50 text-green-800 border-green-200'
}

export default async function CaseRiskPage() {
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
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select(
          'id, title, property_id, status, assignee, board_status, board_scheduled_for, board_next_action, created_at'
        )
        .eq('company_id', companyId)
        .neq('status', '完了')
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, case_id, status, due_date')
        .eq('company_id', companyId),
      supabase
        .from('logs')
        .select('case_id, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
    ])

  if (casesError || tasksError || logsError) {
    console.error('case risk page error:', { casesError, tasksError, logsError })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          案件リスク判定の取得に失敗しました。cases / tasks / logs テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]

  const propertyIds = Array.from(new Set(safeCases.map((item) => item.property_id).filter(Boolean))) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const caseTaskMap = new Map<string, TaskRow[]>()
  safeTasks.forEach((task) => {
    if (!task.case_id) return
    if (!caseTaskMap.has(task.case_id)) {
      caseTaskMap.set(task.case_id, [])
    }
    caseTaskMap.get(task.case_id)!.push(task)
  })

  const latestLogMap = new Map<string, string>()
  safeLogs.forEach((log) => {
    if (!log.case_id || !log.created_at) return
    if (!latestLogMap.has(log.case_id)) {
      latestLogMap.set(log.case_id, log.created_at)
    }
  })

  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const rows = safeCases
    .map((item) => {
      const relatedTasks = caseTaskMap.get(item.id) ?? []
      const openTasks = relatedTasks.filter((task) => task.status !== '完了')
      const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < todayText)
      const lastLogAt = latestLogMap.get(item.id) ?? item.created_at
      const staleDays = diffDaysFromToday(lastLogAt)

      let score = 0
      const reasons: string[] = []

      if (!item.assignee) {
        score += 2
        reasons.push('担当者未設定')
      }

      if (overdueTasks.length >= 1) {
        score += 2
        reasons.push(`期限切れタスク${overdueTasks.length}件`)
      }

      if ((staleDays ?? 0) >= 14) {
        score += 2
        reasons.push(`更新停滞${staleDays}日`)
      }

      if (!item.board_next_action && item.board_status === '上程予定') {
        score += 1
        reasons.push('理事会上程予定だが次アクション未設定')
      }

      if (openTasks.length === 0) {
        score += 1
        reasons.push('未完了タスクが未設定')
      }

      let risk: RiskLevel = '低'
      if (score >= 5) risk = '高'
      else if (score >= 2) risk = '中'

      return {
        ...item,
        risk,
        score,
        reasons,
        openTasksCount: openTasks.length,
        overdueTasksCount: overdueTasks.length,
        lastLogAt,
        staleDays,
      }
    })
    .sort((a, b) => b.score - a.score)

  const highCount = rows.filter((item) => item.risk === '高').length
  const midCount = rows.filter((item) => item.risk === '中').length
  const lowCount = rows.filter((item) => item.risk === '低').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">案件リスク判定</h1>
        <p className="mt-2 text-sm text-gray-600">
          担当者未設定、期限切れタスク、更新停滞、理事会関連の未整備を元に、案件リスクを自動判定しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象案件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm text-red-700">高リスク</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{highCount}</div>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">中リスク</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900">{midCount}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-sm text-green-700">低リスク</div>
          <div className="mt-2 text-3xl font-bold text-green-900">{lowCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          案件別リスク判定
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">表示できる案件はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">案件名</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">リスク</th>
                  <th className="px-4 py-3 font-medium">理由</th>
                  <th className="px-4 py-3 font-medium">最終更新目安</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題案件'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(item.risk)}`}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.reasons.length > 0 ? item.reasons.join(' / ') : '大きな懸念なし'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(item.lastLogAt)}</td>
                    <td className="px-4 py-3">
                      {item.property_id ? (
                        <Link
                          href={`/properties/${item.property_id}/cases/${item.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                        >
                          案件詳細へ
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">移動先なし</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}