import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  assignee: string | null
  status: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
  due_date: string | null
}

type WorkloadRow = {
  assignee: string
  caseCount: number
  openCaseCount: number
  openTaskCount: number
  overdueTaskCount: number
}

export default async function AssigneeWorkloadPage() {
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

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select('id, assignee, status')
        .eq('company_id', companyId),
      supabase
        .from('tasks')
        .select('id, case_id, status, due_date')
        .eq('company_id', companyId),
    ])

  if (casesError) {
    console.error('assignee workload cases error:', casesError)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          担当者負荷の取得に失敗しました。cases テーブルを確認してください。
        </div>
      </div>
    )
  }

  if (tasksError) {
    console.error('assignee workload tasks error:', tasksError)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          担当者負荷の取得に失敗しました。tasks テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const caseAssigneeMap = new Map<string, string>()

  safeCases.forEach((item) => {
    caseAssigneeMap.set(item.id, item.assignee?.trim() || '未担当')
  })

  const workloadMap = new Map<string, WorkloadRow>()

  function ensureAssignee(name: string) {
    if (!workloadMap.has(name)) {
      workloadMap.set(name, {
        assignee: name,
        caseCount: 0,
        openCaseCount: 0,
        openTaskCount: 0,
        overdueTaskCount: 0,
      })
    }

    return workloadMap.get(name)!
  }

  safeCases.forEach((item) => {
    const assignee = item.assignee?.trim() || '未担当'
    const row = ensureAssignee(assignee)

    row.caseCount += 1

    if (item.status !== '完了') {
      row.openCaseCount += 1
    }
  })

  safeTasks.forEach((item) => {
    const assignee = item.case_id ? caseAssigneeMap.get(item.case_id) ?? '未担当' : '未担当'
    const row = ensureAssignee(assignee)

    if (item.status !== '完了') {
      row.openTaskCount += 1
    }

    if (
      item.status !== '完了' &&
      item.due_date &&
      item.due_date < todayText
    ) {
      row.overdueTaskCount += 1
    }
  })

  const rows = Array.from(workloadMap.values()).sort((a, b) => {
    if (b.openTaskCount !== a.openTaskCount) {
      return b.openTaskCount - a.openTaskCount
    }

    if (b.openCaseCount !== a.openCaseCount) {
      return b.openCaseCount - a.openCaseCount
    }

    return a.assignee.localeCompare(b.assignee)
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">担当者負荷一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件担当者ごとの案件数・未完了案件数・未完了タスク数・期限切れタスク数を表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">担当者数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rows.length}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">案件総数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeCases.length}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">タスク総数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{safeTasks.length}</div>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">見たいポイント</div>
          <div className="mt-2 text-sm font-medium text-yellow-900">
            未完了タスクと期限切れの偏り
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          担当者別の負荷
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">表示できる担当者データがありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">担当者</th>
                  <th className="px-4 py-3 font-medium">案件数</th>
                  <th className="px-4 py-3 font-medium">未完了案件数</th>
                  <th className="px-4 py-3 font-medium">未完了タスク数</th>
                  <th className="px-4 py-3 font-medium">期限切れタスク数</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.assignee} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.assignee}</td>
                    <td className="px-4 py-3 text-gray-700">{item.caseCount}</td>
                    <td className="px-4 py-3 text-gray-700">{item.openCaseCount}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.openTaskCount}</td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        item.overdueTaskCount > 0 ? 'text-red-700' : 'text-gray-700'
                      }`}
                    >
                      {item.overdueTaskCount}
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