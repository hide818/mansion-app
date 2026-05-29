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
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_decision_note: string | null
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
  type: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
}

type FileRow = {
  id: string
  file_name: string | null
  category: string | null
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

function buildSummary(params: {
  propertyName: string
  item: CaseRow
  tasks: TaskRow[]
  logs: LogRow[]
  complaints: ComplaintRow[]
  files: FileRow[]
}) {
  const { propertyName, item, tasks, logs, complaints, files } = params

  const openTasks = tasks.filter((task) => task.status !== '完了')
  const overdueLikeTasks = openTasks.filter((task) => Boolean(task.due_date))
  const recentLogs = logs.slice(0, 5)
  const recentComplaints = complaints.slice(0, 3)

  const lines: string[] = []

  lines.push(`【物件名】${propertyName}`)
  lines.push(`【案件名】${item.title ?? '案件名未設定'}`)
  lines.push(`【現在の状況】${item.status ?? '未設定'}`)
  lines.push(`【担当者】${item.assignee ?? '未設定'}`)
  lines.push(`【案件開始日】${formatDate(item.created_at)}`)
  lines.push('')

  lines.push('■概要')
  lines.push(
    `本案件は「${item.title ?? '案件名未設定'}」です。現在のステータスは「${item.status ?? '未設定'}」で、担当者は「${item.assignee ?? '未設定'}」です。`
  )

  lines.push('')
  lines.push('■現在の状況要約')
  if (recentLogs.length === 0) {
    lines.push('・ログがまだ登録されていません。まず最新状況の記録が必要です。')
  } else {
    for (const log of recentLogs) {
      lines.push(`・${formatDate(log.created_at)}: ${log.message ?? 'ログ本文なし'}`)
    }
  }

  lines.push('')
  lines.push('■未完了タスク')
  if (openTasks.length === 0) {
    lines.push('・未完了タスクはありません。')
  } else {
    for (const task of openTasks) {
      lines.push(
        `・${task.title ?? 'タスク名未設定'} / 期限:${task.due_date ?? '-'} / 優先度:${task.priority ?? '-'}`
      )
    }
  }

  lines.push('')
  lines.push('■注意点')
  if (recentComplaints.length === 0 && overdueLikeTasks.length === 0) {
    lines.push('・現時点で大きな注意点は強く検知されていません。')
  } else {
    if (recentComplaints.length > 0) {
      lines.push('・この物件では直近クレームがあるため、案件対応時に感情面への配慮が必要です。')
      for (const complaint of recentComplaints) {
        lines.push(`  - ${complaint.title ?? '件名未設定'} / 状態:${complaint.status ?? '-'}`)
      }
    }

    if (overdueLikeTasks.length > 0) {
      lines.push('・期限付き未完了タスクがあるため、担当変更時は締切共有が必要です。')
    }
  }

  lines.push('')
  lines.push('■理事会関連')
  lines.push(`・理事会ステータス: ${item.board_status ?? '未設定'}`)
  lines.push(`・上程予定日: ${formatDate(item.board_scheduled_for)}`)
  lines.push(`・議案タイトル: ${item.board_agenda_title ?? '未設定'}`)
  lines.push(`・決定状況: ${item.board_decision_status ?? '未設定'}`)
  lines.push(`・決定日: ${formatDate(item.board_decision_date)}`)
  lines.push(`・決定メモ: ${item.board_decision_note ?? '未設定'}`)

  lines.push('')
  lines.push('■添付資料')
  if (files.length === 0) {
    lines.push('・添付資料はありません。')
  } else {
    for (const file of files.slice(0, 10)) {
      lines.push(`・${file.file_name ?? 'ファイル名未設定'} / 種別:${file.category ?? 'other'}`)
    }
  }

  lines.push('')
  lines.push('■次回アクション')
  if (item.board_next_action) {
    lines.push(`・${item.board_next_action}`)
  } else if (openTasks.length > 0) {
    lines.push(`・まず未完了タスク「${openTasks[0].title ?? 'タスク名未設定'}」の担当と期限を再確認する。`)
  } else {
    lines.push('・最新状況の確認ログを1本入れ、次の進め方を明文化する。')
  }

  return lines.join('\n')
}

export default async function CaseHandoverSummaryPage({ params }: PageProps) {
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
        <h1 className="mb-4 text-2xl font-bold">案件引き継ぎサマリー</h1>
        <p className="text-sm text-red-600">company_id が取得できませんでした。</p>
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

  const { data: item, error: caseError } = await supabase
    .from('cases')
    .select(
      'id, title, property_id, status, assignee, created_at, board_status, board_scheduled_for, board_agenda_title, board_decision_status, board_decision_date, board_decision_note, board_next_action'
    )
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !item) {
    notFound()
  }

  const [{ data: tasks }, { data: logs }, { data: complaints }, { data: files }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date, priority')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, message, created_at, type')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('complaints')
      .select('id, title, detail, status, created_at')
      .eq('company_id', companyId)
      .eq('property_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('case_files')
      .select('id, file_name, category, created_at')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const summaryText = buildSummary({
    propertyName: property.name ?? '物件名未設定',
    item,
    tasks: tasks ?? [],
    logs: logs ?? [],
    complaints: complaints ?? [],
    files: files ?? [],
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="text-2xl font-bold">案件引き継ぎサマリー</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件・タスク・ログ・クレーム・添付資料をまとめて、担当変更時にそのまま使える形で整理しています。
          </p>
        </div>

        <CopyTextButton text={summaryText} label="引き継ぎ文をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/handover-checklist`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          引き継ぎチェックリストへ
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