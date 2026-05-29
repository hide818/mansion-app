import Link from 'next/link'
import { notFound } from 'next/navigation'
import AiTextGenerator from '@/app/components/AiTextGenerator'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_scheduled_for: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  case_id: string | null
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

export default async function AiCrossCaseNextActionsPage() {
  const companyId = await getUserCompanyId()

  if (!companyId) notFound()

  const supabase = await createSupabaseServerClient()

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, assignee, board_status, board_scheduled_for')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority, case_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(30)

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]

  const contextText = `【AIへ渡す案件横断の判断材料】
案件一覧：
${
  safeCases.length === 0
    ? '・案件なし'
    : safeCases
        .map(
          (item) =>
            `・案件名:${item.title ?? '案件名未設定'} / 状況:${item.status ?? '未設定'} / 担当:${item.assignee ?? '未設定'} / 理事会:${item.board_status ?? '未設定'} / 上程予定:${formatDate(item.board_scheduled_for)}`
        )
        .join('\n')
}

タスク一覧：
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
        <Link href={`/cases`} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          全案件一覧へ戻る
        </Link>
        <Link href={`/tasks`} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          全タスク一覧へ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">AI次アクション提案（案件横断版）</h1>
        <p className="text-sm text-gray-600 mt-2">
          複数案件をまたいで、今どの案件から触るべきかをAIが整理します。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI次アクション提案（案件横断）"
        description="優先順位つきで、今着手すべき案件群を提案します。"
        apiPath={`/api/cases/ai-cross-case-next-actions`}
      />
    </div>
  )
}