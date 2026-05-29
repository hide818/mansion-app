import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type TaskRow = {
  id: string
  status: string | null
  created_at: string | null
  priority: string | null
}

type MonthlyRow = {
  monthKey: string
  label: string
  total: number
  completed: number
  open: number
  highPriority: number
}

function createMonthLabels(count: number) {
  const result: { monthKey: string; label: string }[] = []
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), 1)

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const label = `${year}年${month}月`
    result.push({ monthKey, label })
  }

  return result
}

function getMonthKey(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function getMaxTotal(rows: MonthlyRow[]) {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.total), 1)
}

export default async function TaskTrendPage() {
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
        <h1 className="text-2xl font-bold">タスク数推移分析</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, created_at, priority')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">タスク数推移分析</h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  const monthLabels = createMonthLabels(6)
  const monthMap = new Map<string, MonthlyRow>()

  for (const month of monthLabels) {
    monthMap.set(month.monthKey, {
      monthKey: month.monthKey,
      label: month.label,
      total: 0,
      completed: 0,
      open: 0,
      highPriority: 0,
    })
  }

  for (const item of (data ?? []) as TaskRow[]) {
    const monthKey = getMonthKey(item.created_at)
    if (!monthKey) continue

    const row = monthMap.get(monthKey)
    if (!row) continue

    row.total += 1

    if (item.status === '完了') {
      row.completed += 1
    } else {
      row.open += 1
    }

    if (item.priority === '高' || item.priority === '緊急') {
      row.highPriority += 1
    }
  }

  const rows = monthLabels
    .map((item) => monthMap.get(item.monthKey))
    .filter((item): item is MonthlyRow => Boolean(item))

  const maxTotal = getMaxTotal(rows)
  const totalAll = rows.reduce((sum, row) => sum + row.total, 0)
  const latest = rows[rows.length - 1]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">タスク数推移分析</h1>
        <p className="mt-2 text-sm text-gray-600">
          直近6か月のタスク作成数を月ごとに見ます。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          ダッシュボードへ戻る
        </Link>
        <Link
          href="/tasks"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          全タスク一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">6か月合計</p>
          <p className="mt-2 text-3xl font-bold">{totalAll}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最新月</p>
          <p className="mt-2 text-sm font-medium">{latest?.label ?? '-'}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最新月の高優先度</p>
          <p className="mt-2 text-3xl font-bold">{latest?.highPriority ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">月別の推移</h2>

        <div className="mt-4 space-y-4">
          {rows.map((row) => {
            const widthPercent = Math.max((row.total / maxTotal) * 100, row.total > 0 ? 8 : 0)

            return (
              <div key={row.monthKey}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-800">{row.label}</p>
                  <p className="text-sm text-gray-600">
                    合計 {row.total}件 / 未完了 {row.open}件 / 完了 {row.completed}件 / 高優先度 {row.highPriority}件
                  </p>
                </div>

                <div className="h-4 w-full rounded-full bg-gray-100">
                  <div
                    className="h-4 rounded-full bg-gray-900"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}