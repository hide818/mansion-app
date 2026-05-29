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
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

function buildBoardDraft(params: {
  propertyName: string
  caseItem: CaseRow
  tasks: TaskRow[]
  logs: LogRow[]
}) {
  const { propertyName, caseItem, tasks, logs } = params

  const openTasks = tasks.filter((item) => item.status !== '完了')
  const latestLog = logs[0]

  const agendaTitle =
    caseItem.board_agenda_title || caseItem.title || '案件名未設定'

  return `【物件名】
${propertyName}

【議案タイトル】
${agendaTitle}

【報告ドラフト】
本件は「${caseItem.title ?? '案件名未設定'}」に関する案件です。
現在の案件ステータスは「${caseItem.status ?? '未設定'}」であり、担当者は「${caseItem.assignee ?? '未設定'}」です。

直近の進捗としては、
${latestLog?.message ?? '最新ログが未登録のため、現時点の進捗整理が必要です。'}

未完了事項については、
${
  openTasks.length === 0
    ? '現在、未完了タスクはありません。'
    : `未完了タスクが ${openTasks.length} 件あり、主な項目は「${openTasks[0]?.title ?? 'タスク名未設定'}」です。`
}

今後の進め方としては、
${caseItem.board_next_action ?? '次回アクションの整理が必要です。'}

以上、ご報告いたします。`
}

export default async function BoardDraftPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">理事会報告ドラフト生成</h1>
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
    .select('id, property_id, title, status, assignee, board_status, board_agenda_title, board_next_action')
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const [{ data: tasks }, { data: logs }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date')
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
  ])

  const draftText = buildBoardDraft({
    propertyName: property.name ?? '物件名未設定',
    caseItem,
    tasks: tasks ?? [],
    logs: logs ?? [],
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">理事会報告ドラフト生成</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件情報から、そのままたたき台に使える報告文を作ります。
          </p>
        </div>

        <CopyTextButton text={draftText} label="ドラフトをコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/question-simulation`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          想定質問へ
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
          {draftText}
        </pre>
      </div>
    </div>
  )
}