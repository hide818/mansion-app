import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CopyTextButton from '@/app/components/CopyTextButton'
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
  created_at: string | null
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
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

function buildSummaryText(params: {
  propertyName: string
  caseItem: CaseRow
  tasks: TaskRow[]
  logs: LogRow[]
  files: FileRow[]
}) {
  const { propertyName, caseItem, tasks, logs, files } = params

  const openTasks = tasks.filter((item) => item.status !== '完了')
  const latestLog = logs[0]
  const recentLogs = logs.slice(0, 3)
  const fileCount = files.length

  const lines: string[] = []

  lines.push(`【物件名】${propertyName}`)
  lines.push(`【案件名】${caseItem.title ?? '案件名未設定'}`)
  lines.push('')

  lines.push('■案件自動要約')
  lines.push(
    `本案件は「${caseItem.title ?? '案件名未設定'}」に関する対応です。現在の案件ステータスは「${caseItem.status ?? '未設定'}」、担当者は「${caseItem.assignee ?? '未設定'}」です。`
  )

  if (latestLog?.message) {
    lines.push(`直近の動きとしては「${latestLog.message}」です。`)
  } else {
    lines.push('直近ログが少ないため、まず最新状況の記録が必要です。')
  }

  if (openTasks.length > 0) {
    lines.push(
      `未完了タスクは ${openTasks.length} 件あります。最優先は「${openTasks[0]?.title ?? 'タスク名未設定'}」です。`
    )
  } else {
    lines.push('未完了タスクは現在ありません。')
  }

  if (caseItem.board_next_action) {
    lines.push(`次にやることは「${caseItem.board_next_action}」です。`)
  } else {
    lines.push('次にやることはまだ明文化されていません。')
  }

  lines.push(
    `添付資料は ${fileCount} 件あります。理事会対応や業者依頼が必要な場合は、案件詳細から資料確認が可能です。`
  )

  lines.push('')
  lines.push('■最近の動き')
  if (recentLogs.length === 0) {
    lines.push('・ログ未登録')
  } else {
    for (const log of recentLogs) {
      lines.push(`・${formatDate(log.created_at)}：${log.message ?? '本文なし'}`)
    }
  }

  return lines.join('\n')
}

export default async function AutoSummaryPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">案件自動要約</h1>
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
      'id, property_id, title, status, assignee, created_at, board_status, board_agenda_title, board_next_action'
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

  const summaryText = buildSummaryText({
    propertyName: property.name ?? '物件名未設定',
    caseItem,
    tasks: tasks ?? [],
    logs: logs ?? [],
    files: files ?? [],
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">案件自動要約</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件、ログ、タスク、資料をもとに、すぐ読める要約文を作ります。
          </p>
        </div>

        <CopyTextButton text={summaryText} label="要約をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/manager-tone`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          上司向け文体整形へ
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
          {summaryText}
        </pre>
      </div>
    </div>
  )
}