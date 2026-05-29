import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  assignee: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

type AssigneeRow = {
  assignee: string
  overdueCount: number
  openCount: number
  urgentCount: number
  examples: string[]
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

export default async function AssigneeOverduePage() {
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
        <h1 className="text-2xl font-bold">担当者ごとの期限切れ件数</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, assignee')
    .eq('company_id', companyId)

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">担当者ごとの期限切れ件数</h1>
        <p className="mt-4 text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const caseIds = (cases ?? []).map((item) => item.id)

  const { data: tasks, error: tasksError } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, case_id, title, status, due_date, priority')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
    : { data: [] as TaskRow[], error: null }

  if (tasksError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">担当者ごとの期限切れ件数</h1>
        <p className="mt-4 text-sm text-red-600">{tasksError.message}</p>
      </div>
    )
  }

  const caseMap = new Map<string, CaseRow>()
  for (const item of (cases ?? []) as CaseRow[]) {
    caseMap.set(item.id, item)
  }

  const assigneeMap = new Map<string, AssigneeRow>()

  for (const task of (tasks ?? []) as TaskRow[]) {
    const caseInfo = task.case_id ? caseMap.get(task.case_id) : null
    const assignee = caseInfo?.assignee?.trim() || '未設定'

    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, {
        assignee,
        overdueCount: 0,
        openCount: 0,
        urgentCount: 0,
        examples: [],
      })
    }

    const row = assigneeMap.get(assignee)
    if (!row) continue

    if (task.status !== '完了') {
      row.openCount += 1
    }

    if (task.status !== '完了' && isOverdue(task.due_date)) {
      row.overdueCount += 1
      if (task.title && row.examples.length < 3) {
        row.examples.push(task.title)
      }
    }

    if (
      task.status !== '完了' &&
      (task.priority === '高' || task.priority === '緊急')
    ) {
      row.urgentCount += 1
    }
  }

  const rows = Array.from(assigneeMap.values()).sort((a, b) => {
    if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
    return b.openCount - a.openCount
  })

  const totalOverdue = rows.reduce((sum, row) => sum + row.overdueCount, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">担当者ごとの期限切れ件数</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件の担当者ごとに、期限切れタスクの偏りを見ます。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/analytics/assignee-workload"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          担当者負荷一覧へ
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
          <p className="text-sm text-gray-500">担当者数</p>
          <p className="mt-2 text-3xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">期限切れ合計</p>
          <p className="mt-2 text-3xl font-bold">{totalOverdue}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最も多い担当者</p>
          <p className="mt-2 text-sm font-medium">{rows[0]?.assignee ?? '-'}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">表示できる担当データがありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.assignee} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold">{row.assignee}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    期限切れ {row.overdueCount}件
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    未完了 {row.openCount}件
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    高優先度 {row.urgentCount}件
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">期限切れタスク例</p>
                {row.examples.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">期限切れタスクはありません。</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {row.examples.map((item) => (
                      <div key={item} className="text-sm text-gray-700">
                        ・{item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}