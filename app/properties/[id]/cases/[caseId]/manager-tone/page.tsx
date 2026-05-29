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
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

function buildManagerToneText(params: {
  propertyName: string
  caseItem: CaseRow
  tasks: TaskRow[]
  logs: LogRow[]
}) {
  const { propertyName, caseItem, tasks, logs } = params

  const openTasks = tasks.filter((item) => item.status !== '完了')
  const latestLog = logs[0]

  return `【上司向け共有文】
${propertyName}の「${caseItem.title ?? '案件名未設定'}」につきまして、現在の案件ステータスは「${caseItem.status ?? '未設定'}」です。

直近の動きとしては、
${latestLog?.message ?? '最新ログが未登録のため、現在状況の確認が必要です。'}

未完了事項は、
${
  openTasks.length === 0
    ? '現時点ではございません。'
    : `${openTasks.length}件あり、主なものは「${openTasks[0]?.title ?? 'タスク名未設定'}」です。`
}

今後の対応予定は、
${caseItem.board_next_action ?? '次アクションの整理が必要な状況です。'}

以上、ご共有いたします。`
}

export default async function ManagerTonePage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">上司向け文体整形</h1>
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
    .select('id, property_id, title, status, assignee, board_next_action')
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const [{ data: tasks }, { data: logs }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, message, created_at')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const managerText = buildManagerToneText({
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
          <h1 className="mt-1 text-2xl font-bold">上司向け文体整形</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件内容を、社内共有しやすい落ち着いた文体に整えます。
          </p>
        </div>

        <CopyTextButton text={managerText} label="整形文をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/auto-summary`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件自動要約へ
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
          {managerText}
        </pre>
      </div>
    </div>
  )
}