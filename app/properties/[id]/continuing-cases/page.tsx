import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatDateTime(value: string | null) {
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

export default async function PropertyContinuingCasesPage({ params }: PageProps) {
  const { id } = await params
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
        <h1 className="text-2xl font-bold">継続案件の要点</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, title, status, assignee, created_at, board_status, board_next_action')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .neq('status', '完了')
    .order('created_at', { ascending: false })

  if (casesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">継続案件の要点</h1>
        <p className="mt-4 text-sm text-red-600">{casesError.message}</p>
      </div>
    )
  }

  const caseIds = (cases ?? []).map((item) => item.id)

  const { data: tasks } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, case_id, title, status, due_date, priority')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as TaskRow[] }

  const { data: logs } = caseIds.length
    ? await supabase
        .from('logs')
        .select('id, case_id, message, created_at')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
    : { data: [] as LogRow[] }

  const taskMap = new Map<string, TaskRow[]>()
  for (const task of tasks ?? []) {
    if (!task.case_id) continue
    const current = taskMap.get(task.case_id) ?? []
    current.push(task)
    taskMap.set(task.case_id, current)
  }

  const latestLogMap = new Map<string, LogRow>()
  for (const log of logs ?? []) {
    if (!log.case_id) continue
    if (latestLogMap.has(log.case_id)) continue
    latestLogMap.set(log.case_id, log)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">継続案件の要点</h1>
        <p className="mt-2 text-sm text-gray-600">
          この物件でまだ終わっていない案件だけを集めて、引き継ぎしやすい形で要点を表示します。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/health`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          物件健康スコアを見る
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5">
        <p className="text-sm text-gray-500">継続案件数</p>
        <p className="mt-2 text-3xl font-bold">{cases?.length ?? 0}</p>
      </div>

      {!cases || cases.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-700">この物件に継続中の案件はありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((item) => {
            const caseTasks = (taskMap.get(item.id) ?? []).filter((task) => task.status !== '完了')
            const latestLog = latestLogMap.get(item.id)

            return (
              <div key={item.id} className="rounded-2xl border bg-white p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{item.title ?? '案件名未設定'}</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    状態: {item.status ?? '未設定'} / 担当者: {item.assignee ?? '-'} / 開始日: {formatDate(item.created_at)}
                  </p>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">理事会ステータス</p>
                    <p className="mt-2 text-sm font-medium">{item.board_status ?? '未設定'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">未完了タスク</p>
                    <p className="mt-2 text-sm font-medium">{caseTasks.length}件</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">最終ログ</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(latestLog?.created_at ?? null)}</p>
                  </div>
                </div>

                <div className="mb-4 rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900">要点</p>
                  <p className="mt-2 text-sm leading-7 text-blue-800">
                    {latestLog?.message
                      ? `直近の動きは「${latestLog.message}」です。`
                      : 'まだログが少ないため、最新状況の記録が必要です。'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-blue-800">
                    {item.board_next_action
                      ? `次にやることは「${item.board_next_action}」です。`
                      : caseTasks[0]?.title
                        ? `次は未完了タスク「${caseTasks[0].title}」の進行確認が必要です。`
                        : '次アクションが未設定です。案件の次の一手を決めておくと強いです。'}
                  </p>
                </div>

                {caseTasks.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-semibold text-gray-800">未完了タスク</p>
                    <div className="space-y-2">
                      {caseTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                          {task.title ?? 'タスク名未設定'} / 期限: {task.due_date ?? '-'} / 優先度: {task.priority ?? '-'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/properties/${id}/cases/${item.id}`}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                  >
                    案件詳細を開く
                  </Link>
                  <Link
                    href={`/properties/${id}/cases/${item.id}/handover-summary`}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    引き継ぎサマリー
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}