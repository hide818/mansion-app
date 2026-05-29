import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

type FileRow = {
  id: string
  file_name: string | null
  category: string | null
}

type CheckRow = {
  title: string
  ok: boolean
  detail: string
  action: string
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

function isOverdue(value: string | null) {
  if (!value) return false
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export default async function CoverageCheckPage({ params }: PageProps) {
  const { id, caseId } = await params
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
        <h1 className="text-2xl font-bold">対応抜けチェック</h1>
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

  const { data: caseItem, error: caseError } = await supabase
    .from('cases')
    .select(
      'id, property_id, title, status, assignee, board_status, board_agenda_title, board_next_action, created_at'
    )
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const [{ data: tasks }, { data: logs }, { data: files }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date, priority')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, message, created_at')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('case_files')
      .select('id, file_name, category')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
  ])

  const taskRows = tasks ?? []
  const logRows = logs ?? []
  const fileRows = files ?? []

  const openTasks = taskRows.filter((item) => item.status !== '完了')
  const overdueTasks = openTasks.filter((item) => isOverdue(item.due_date))
  const latestLog = logRows[0]
  const hasEstimate = fileRows.some((item) => item.category === 'estimate')
  const hasPhoto = fileRows.some((item) => item.category === 'photo')
  const hasReport = fileRows.some((item) => item.category === 'report')
  const hasDrawing = fileRows.some((item) => item.category === 'drawing')

  const checks: CheckRow[] = [
    {
      title: '担当者が設定されている',
      ok: Boolean(caseItem.assignee),
      detail: caseItem.assignee ? `担当者: ${caseItem.assignee}` : '担当者が未設定です',
      action: '案件詳細で担当者を入れてください。',
    },
    {
      title: '次にやることが明確',
      ok: Boolean(caseItem.board_next_action),
      detail: caseItem.board_next_action ? caseItem.board_next_action : '次アクションが未設定です',
      action: '案件詳細の「次にやること」を埋めてください。',
    },
    {
      title: '直近ログが入っている',
      ok: Boolean(latestLog),
      detail: latestLog
        ? `最終ログ日: ${formatDate(latestLog.created_at)}`
        : 'ログがまだありません',
      action: '最新状況をまず1本ログに残してください。',
    },
    {
      title: '期限切れタスクが放置されていない',
      ok: overdueTasks.length === 0,
      detail:
        overdueTasks.length === 0
          ? '期限切れタスクはありません'
          : `期限切れタスクが ${overdueTasks.length} 件あります`,
      action: '期限切れタスクを今日やることに落とし込んでください。',
    },
    {
      title: '未完了タスクが整理されている',
      ok: openTasks.length <= 5,
      detail:
        openTasks.length <= 5
          ? `未完了タスク ${openTasks.length} 件`
          : `未完了タスクが ${openTasks.length} 件あり、渋滞気味です`,
      action: '不要タスクを閉じるか、次回実施分へ整理してください。',
    },
    {
      title: '理事会まわりの設定ができている',
      ok: Boolean(caseItem.board_status) && Boolean(caseItem.board_agenda_title),
      detail:
        caseItem.board_status && caseItem.board_agenda_title
          ? `理事会ステータス: ${caseItem.board_status} / 議案タイトルあり`
          : '理事会ステータスまたは議案タイトルが不足しています',
      action: '理事会に出す可能性がある案件なら設定を入れてください。',
    },
    {
      title: '必要資料が最低限そろっている',
      ok: hasEstimate || hasPhoto || hasReport || hasDrawing,
      detail:
        hasEstimate || hasPhoto || hasReport || hasDrawing
          ? '添付資料あり'
          : '添付資料がありません',
      action: '見積、写真、報告書などの資料を案件に紐づけてください。',
    },
  ]

  const okCount = checks.filter((item) => item.ok).length
  const ngCount = checks.length - okCount

  const priorityMessage =
    overdueTasks.length > 0
      ? '最優先は、期限切れタスクの処理です。'
      : !caseItem.board_next_action
        ? '最優先は、次にやることの明文化です。'
        : !latestLog
          ? '最優先は、最新状況のログ記録です。'
          : '大きな抜けは少ないです。最後に資料の確認だけしてください。'

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">対応抜けチェック</h1>
        <p className="mt-2 text-sm text-gray-600">
          この案件で「抜けやすいポイント」を自動で確認します。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/future-tasks`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          未来のタスク自動生成へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">案件名</p>
          <p className="mt-2 text-sm font-medium">{caseItem.title ?? '案件名未設定'}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">OK</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{okCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">要対応</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{ngCount}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border bg-amber-50 p-5">
        <h2 className="text-lg font-bold text-amber-900">今いちばん先にやること</h2>
        <p className="mt-3 text-sm leading-7 text-amber-800">{priorityMessage}</p>
      </div>

      <div className="space-y-4">
        {checks.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl border p-5 ${
              item.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {item.ok ? 'OK' : '要対応'} / {item.title}
                </h2>
                <p className="mt-2 text-sm text-gray-700">{item.detail}</p>
              </div>
            </div>

            {!item.ok && (
              <div className="mt-4 rounded-xl bg-white/80 p-4">
                <p className="text-sm font-semibold text-gray-800">改善アクション</p>
                <p className="mt-2 text-sm text-gray-700">{item.action}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}