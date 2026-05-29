import Link from 'next/link'
import { notFound } from 'next/navigation'
import AiTextGenerator from '@/app/components/AiTextGenerator'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

function formatDate(value: string | null) {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default async function AiCaseHandoverPage({ params }: PageProps) {
  const { id: propertyId, caseId } = await params
  const companyId = await getUserCompanyId()
  if (!companyId) notFound()

  const supabase = await createSupabaseServerClient()

  const { data: caseItem } = await supabase
    .from('cases')
    .select(
      'id, title, status, assignee, board_status, board_scheduled_for, board_next_action, board_decision_note'
    )
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .single()

  if (!caseItem) notFound()

  const { data: logs } = await supabase
    .from('logs')
    .select('id, message, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(12)

  const safeLogs = (logs ?? []) as LogRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]

  const contextText = `【AIへ渡す案件引き継ぎ元データ】
案件名：${caseItem.title ?? '未設定'}
案件状況：${caseItem.status ?? '未設定'}
担当者：${caseItem.assignee ?? '未設定'}
理事会状況：${caseItem.board_status ?? '未設定'}
上程予定：${formatDate(caseItem.board_scheduled_for)}
次アクション：${caseItem.board_next_action ?? '未設定'}
決定メモ：${caseItem.board_decision_note ?? '未設定'}

最近のログ：
${
  safeLogs.length === 0
    ? '・ログなし'
    : safeLogs
        .map((item) => `・${formatDate(item.created_at)} / ${item.message ?? '内容なし'}`)
        .join('\n')
}

タスク：
${
  safeTasks.length === 0
    ? '・タスクなし'
    : safeTasks
        .map(
          (item) =>
            `・${item.title ?? 'タスク名未設定'} / 状況:${item.status ?? '未設定'} / 期限:${formatDate(item.due_date)} / 優先度:${item.priority ?? '未設定'}`
        )
        .join('\n')
}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}/cases/${caseId}`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">案件単位のAI引き継ぎサマリー</h1>
        <p className="text-sm text-gray-600 mt-2">
          案件担当を変えるときに使いやすい、引き継ぎ用の要点整理文をAIで作ります。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 bg-gray-50 rounded-xl border p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="案件AI引き継ぎサマリー"
        description="現状、注意点、未完了事項、次の一手を整理した引き継ぎ文を生成します。"
        apiPath={`/api/properties/${propertyId}/cases/${caseId}/ai-case-handover`}
      />
    </div>
  )
}