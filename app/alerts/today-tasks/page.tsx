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
  assigned_to: string | null
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

function getPriorityScore(priority: string | null) {
  if (priority === '高') return 3
  if (priority === '中') return 2
  if (priority === '低') return 1
  return 0
}

export default async function TodayTasksPage() {
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

  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, property_id, case_id, priority, assigned_to')
    .eq('company_id', companyId)
    .neq('status', '完了')
    .not('due_date', 'is', null)
    .lte('due_date', todayText)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('today tasks page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          今日やるべきタスクの取得に失敗しました。tasks テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeTasks = ((tasks ?? []) as TaskRow[]).sort((a, b) => {
    if ((a.due_date ?? '') !== (b.due_date ?? '')) {
      return (a.due_date ?? '').localeCompare(b.due_date ?? '')
    }

    return getPriorityScore(b.priority) - getPriorityScore(a.priority)
  })

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

  const assignedToIds = Array.from(
    new Set(safeTasks.map((t) => t.assigned_to).filter((v): v is string => typeof v === 'string' && v.length > 0)),
  )
  const assigneeNameMap = new Map<string, string>()
  if (assignedToIds.length > 0) {
    const { data: assigneeProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', assignedToIds)
      .eq('company_id', companyId)
    ;((assigneeProfiles ?? []) as Array<{ id: string; display_name: string | null }>).forEach(
      (p) => { assigneeNameMap.set(p.id, p.display_name ?? '名前未設定') },
    )
  }

  const overdueCount = safeTasks.filter((item) => item.due_date && item.due_date < todayText).length
  const todayCount = safeTasks.filter((item) => item.due_date === todayText).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">今日やるべきタスク</h1>
        <p className="mt-2 text-sm text-gray-600">
          未完了タスクのうち、今日が期限またはすでに期限切れのものを表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">今日やるべき件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeTasks.length}</div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm text-red-700">期限切れを含む件数</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{overdueCount}</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">今日期限の件数</div>
          <div className="mt-2 text-3xl font-bold text-blue-900">{todayCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          今日やるべきタスク一覧
        </div>

        {safeTasks.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">今日やるべきタスクはありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">タスク名</th>
                  <th className="px-4 py-3 font-medium">期限</th>
                  <th className="px-4 py-3 font-medium">優先度</th>
                  <th className="px-4 py-3 font-medium">担当者</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">案件</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {safeTasks.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題タスク'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(item.due_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{item.priority || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.assigned_to ? (assigneeNameMap.get(item.assigned_to) ?? '未設定') : '未設定'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.case_id ? caseMap.get(item.case_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.case_id && item.property_id && propertyMap.has(item.property_id) ? (
                        <Link
                          href={`/properties/${item.property_id}/cases/${item.case_id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                        >
                          案件詳細へ
                        </Link>
                      ) : item.property_id && propertyMap.has(item.property_id) ? (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}