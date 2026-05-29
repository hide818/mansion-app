import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  property_id: string | null
  case_id: string | null
  priority: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  title: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getRemainingDays(value: string | null) {
  if (!value) return null

  const due = new Date(`${value}T00:00:00`)
  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const diffMs = due.getTime() - todayStart.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default async function DeadlineRankingPage() {
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

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, property_id, case_id, priority')
    .eq('company_id', companyId)
    .neq('status', '完了')
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })
    .limit(20)

  if (error) {
    console.error('deadline ranking page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          期限ヤバいランキングの取得に失敗しました。tasks テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeTasks = (tasks ?? []) as TaskRow[]
  const propertyIds = Array.from(
    new Set(safeTasks.map((item) => item.property_id).filter(Boolean))
  ) as string[]
  const caseIds = Array.from(
    new Set(safeTasks.map((item) => item.case_id).filter(Boolean))
  ) as string[]

  const [{ data: properties }, { data: cases }] = await Promise.all([
    propertyIds.length > 0
      ? supabase.from('properties').select('id, name').in('id', propertyIds)
      : Promise.resolve({ data: [] as PropertyRow[] }),
    caseIds.length > 0
      ? supabase.from('cases').select('id, title').in('id', caseIds)
      : Promise.resolve({ data: [] as CaseRow[] }),
  ])

  const propertyMap = new Map<string, string>()
  const caseMap = new Map<string, string>()

  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  ;((cases ?? []) as CaseRow[]).forEach((item) => {
    caseMap.set(item.id, item.title ?? '案件名未設定')
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">期限ヤバいランキング</h1>
        <p className="mt-2 text-sm text-gray-600">
          未完了タスクを期限の近い順で上位20件表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">表示件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeTasks.length}</div>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">対象</div>
          <div className="mt-2 text-sm font-medium text-yellow-900">未完了かつ期限あり</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">上位表示</div>
          <div className="mt-2 text-sm font-medium text-gray-900">近い期限を優先</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          期限ヤバいランキング
        </div>

        {safeTasks.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">期限ありの未完了タスクはありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">順位</th>
                  <th className="px-4 py-3 font-medium">タスク名</th>
                  <th className="px-4 py-3 font-medium">期限</th>
                  <th className="px-4 py-3 font-medium">残り日数</th>
                  <th className="px-4 py-3 font-medium">優先度</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">案件</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {safeTasks.map((item, index) => {
                  const remaining = getRemainingDays(item.due_date)

                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-semibold text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-900">{item.title || '無題タスク'}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(item.due_date)}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          remaining !== null && remaining < 0
                            ? 'text-red-700'
                            : remaining !== null && remaining <= 3
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {remaining === null ? '-' : `${remaining}日`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.priority || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.case_id ? caseMap.get(item.case_id) ?? '-' : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {item.case_id && item.property_id ? (
                          <Link
                            href={`/properties/${item.property_id}/cases/${item.case_id}`}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                          >
                            案件詳細へ
                          </Link>
                        ) : item.property_id ? (
                          <Link
                            href={`/properties/${item.property_id}/tasks`}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                          >
                            物件タスクへ
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">移動先なし</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}