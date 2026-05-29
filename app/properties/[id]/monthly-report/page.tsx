import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type MonthlyReportPageProps = {
  params: Promise<{
    id: string
  }>
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_scheduled_for: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  case_id: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
  status: string | null
  created_at: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
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

function firstLine(value: string | null, maxLength = 80) {
  if (!value) return '特記事項なし'
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return '特記事項なし'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}…`
    : normalized
}

export default async function MonthlyReportPage({
  params,
}: MonthlyReportPageProps) {
  const { id: propertyId } = await params
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()

  if (!property) {
    notFound()
  }

  const { data: cases } = await supabase
    .from('cases')
    .select(
      'id, title, status, assignee, board_status, board_scheduled_for, created_at'
    )
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority, case_id')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const caseIds = (cases ?? []).map((item) => item.id)

  let logs: LogRow[] = []
  if (caseIds.length > 0) {
    const { data: logsData } = await supabase
      .from('logs')
      .select('id, message, created_at, case_id')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false })
      .limit(20)

    logs = logsData ?? []
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const inProgressCases = safeCases.filter(
    (item) =>
      item.status &&
      !['完了', '完了済み', 'close', 'closed'].includes(item.status)
  )
  const completedCases = safeCases.filter((item) => item.status === '完了')
  const pendingTasks = safeTasks.filter((item) => item.status !== '完了')
  const overdueTasks = pendingTasks.filter((item) => {
    if (!item.due_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(item.due_date)
    due.setHours(0, 0, 0, 0)

    return due < today
  })

  const boardCases = safeCases.filter(
    (item) =>
      item.board_status &&
      !['未設定', '不要', '完了'].includes(item.board_status)
  )

  const recentLogLines =
    logs.length === 0
      ? ['・最近の対応ログはありません。']
      : logs.slice(0, 5).map((item) => {
          const targetCase = safeCases.find((caseItem) => caseItem.id === item.case_id)
          return `・${formatDate(item.created_at)} / ${
            targetCase?.title ?? '案件名不明'
          } / ${firstLine(item.message, 60)}`
        })

  const importantCaseLines =
    inProgressCases.length === 0
      ? ['・進行中案件はありません。']
      : inProgressCases.slice(0, 5).map((item) => {
          return `・${item.title ?? '案件名未設定'}（状況：${
            item.status ?? '未設定'
          } / 担当：${item.assignee ?? '未設定'}）`
        })

  const taskLines =
    pendingTasks.length === 0
      ? ['・未完了タスクはありません。']
      : pendingTasks.slice(0, 8).map((item) => {
          return `・${item.title ?? 'タスク名未設定'}（期限：${formatDate(
            item.due_date
          )} / 優先度：${item.priority ?? '未設定'}）`
        })

  const complaintLines =
    safeComplaints.length === 0
      ? ['・今月のクレーム登録はありません。']
      : safeComplaints.slice(0, 5).map((item) => {
          return `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'}（状況：${
            item.status ?? '未設定'
          }）`
        })

  const boardLines =
    boardCases.length === 0
      ? ['・理事会報告予定の案件はありません。']
      : boardCases.slice(0, 5).map((item) => {
          return `・${item.title ?? '案件名未設定'}（理事会状況：${
            item.board_status ?? '未設定'
          } / 上程予定：${formatDate(item.board_scheduled_for)}）`
        })

  const draftText = `【月次報告ドラフト】

対象物件：${property.name ?? '物件名未設定'}
所在地：${property.address ?? '未登録'}

1．今月の総括
今月は、進行中案件 ${inProgressCases.length} 件、完了案件 ${completedCases.length} 件、未完了タスク ${pendingTasks.length} 件、期限超過タスク ${overdueTasks.length} 件、クレーム ${safeComplaints.length} 件を確認しております。
全体としては、案件対応と日常タスクは継続して進行しており、特に期限管理が必要な項目については優先的なフォローが必要な状況です。

2．主な進行中案件
${importantCaseLines.join('\n')}

3．未完了タスク
${taskLines.join('\n')}

4．理事会関連
${boardLines.join('\n')}

5．クレーム・相談対応
${complaintLines.join('\n')}

6．最近の対応履歴
${recentLogLines.join('\n')}

7．来月に向けた対応方針
・期限超過タスク ${overdueTasks.length} 件の優先処理
・進行中案件のうち、長引いているものの状況整理
・理事会対象案件の資料整備
・クレーム案件の再発防止策の確認

8．管理会社コメント
今後も、案件の進捗管理、理事会対応準備、クレームの早期収束を中心に対応を進めてまいります。必要に応じて、理事会への上程や追加報告を行います。`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${propertyId}/tools`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          物件ツール一覧へ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">月次報告ドラフト生成</h1>
        <p className="text-sm text-gray-600 mt-2">
          物件・案件・タスク・クレーム・最近の対応履歴をまとめて、コピペしやすい月次報告文を作成します。
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">進行中案件</div>
          <div className="text-2xl font-bold mt-2">{inProgressCases.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">未完了タスク</div>
          <div className="text-2xl font-bold mt-2">{pendingTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">期限超過タスク</div>
          <div className="text-2xl font-bold mt-2">{overdueTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">クレーム件数</div>
          <div className="text-2xl font-bold mt-2">{safeComplaints.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">月次報告ドラフト</div>
        <textarea
          readOnly
          defaultValue={draftText}
          className="w-full min-h-[520px] rounded-xl border p-4 text-sm leading-7 bg-gray-50"
        />
      </div>
    </div>
  )
}