import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type NextActionAiPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
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

function trimText(value: string | null, maxLength = 80) {
  if (!value) return '記載なし'
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return '記載なし'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}…`
    : normalized
}

function getTaskUrgency(dueDate: string | null) {
  if (!dueDate) return '期限未設定'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)

  if (diff < 0) return '期限切れ'
  if (diff === 0) return '今日期限'
  if (diff <= 3) return '直近期限'

  return '通常'
}

export default async function NextActionAiPage({
  params,
}: NextActionAiPageProps) {
  const { id: propertyId, caseId } = await params
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()

  if (!property) {
    notFound()
  }

  const { data: caseItem } = await supabase
    .from('cases')
    .select(
      'id, title, status, assignee, created_at, board_status, board_scheduled_for, board_next_action, board_decision_status'
    )
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .single()

  if (!caseItem) {
    notFound()
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: logs } = await supabase
    .from('logs')
    .select('id, message, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(10)

  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]

  const pendingTasks = safeTasks.filter((item) => item.status !== '完了')
  const overdueTasks = pendingTasks.filter(
    (item) => getTaskUrgency(item.due_date) === '期限切れ'
  )
  const todayTasks = pendingTasks.filter(
    (item) => getTaskUrgency(item.due_date) === '今日期限'
  )
  const soonTasks = pendingTasks.filter(
    (item) => getTaskUrgency(item.due_date) === '直近期限'
  )

  const recommendationLines: string[] = []

  if (overdueTasks.length > 0) {
    recommendationLines.push(
      `・最優先：期限切れタスク ${overdueTasks.length} 件を本日中に整理し、相手待ち・自社対応・保留理由のいずれかに切り分ける。`
    )
  }

  if (todayTasks.length > 0) {
    recommendationLines.push(
      `・次点：今日期限タスク ${todayTasks.length} 件について、完了見込みの確認または期限再設定を行う。`
    )
  }

  if (soonTasks.length > 0) {
    recommendationLines.push(
      `・先回り：3日以内期限のタスク ${soonTasks.length} 件について、必要資料・連絡先・依頼先を先に固める。`
    )
  }

  if (
    caseItem.board_status &&
    !['未設定', '不要', '完了'].includes(caseItem.board_status)
  ) {
    recommendationLines.push(
      `・理事会対応：理事会状況が「${caseItem.board_status}」のため、議案本文・添付資料・想定質問の3点を先にそろえる。`
    )
  }

  if (safeLogs.length === 0) {
    recommendationLines.push(
      '・履歴補強：対応ログが不足しているため、電話・メール・現地確認の履歴を必ず残す。'
    )
  } else {
    recommendationLines.push(
      '・履歴整理：最近のログをもとに、次回報告時に使う一言要約を作っておく。'
    )
  }

  if (recommendationLines.length === 0) {
    recommendationLines.push(
      '・現時点で大きな詰まりは見えていません。次回対応日だけ先に決めて案件を止めないようにしてください。'
    )
  }

  const taskLines =
    pendingTasks.length === 0
      ? ['・未完了タスクはありません。']
      : pendingTasks.slice(0, 8).map((item) => {
          return `・${item.title ?? 'タスク名未設定'}（状況：${
            item.status ?? '未設定'
          } / 期限：${formatDate(item.due_date)} / 優先度：${
            item.priority ?? '未設定'
          } / 判定：${getTaskUrgency(item.due_date)}）`
        })

  const logLines =
    safeLogs.length === 0
      ? ['・最近の対応履歴はありません。']
      : safeLogs.slice(0, 5).map((item) => {
          return `・${formatDate(item.created_at)} / ${trimText(item.message, 90)}`
        })

  const outputText = `【次アクション提案】

物件名：${property.name ?? '物件名未設定'}
案件名：${caseItem.title ?? '案件名未設定'}

1．案件状況
・案件ステータス：${caseItem.status ?? '未設定'}
・担当者：${caseItem.assignee ?? '未設定'}
・理事会状況：${caseItem.board_status ?? '未設定'}
・理事会予定：${formatDate(caseItem.board_scheduled_for)}
・決定状況：${caseItem.board_decision_status ?? '未設定'}

2．未完了タスク
${taskLines.join('\n')}

3．最近の対応履歴
${logLines.join('\n')}

4．おすすめアクション
${recommendationLines.join('\n')}

5．担当者向けまとめ
${
  caseItem.board_next_action?.trim()
    ? `・既存メモの次アクション：${caseItem.board_next_action.trim()}`
    : '・既存メモ上の次アクションは未設定です。今回の提案内容をもとに更新してください。'
}

6．社内共有用ひとこと
「${caseItem.title ?? '案件名未設定'}」は、${
    overdueTasks.length > 0
      ? '期限管理を先に立て直すべき案件です。'
      : todayTasks.length > 0 || soonTasks.length > 0
      ? '近い期限を見ながら先回りで段取りすべき案件です。'
      : '今のうちに次の一手を決めて止めないことが大事な案件です。'
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
        <Link
          href={`/properties/${propertyId}/cases/${caseId}/tools`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          案件ツール一覧へ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">次アクション提案</h1>
        <p className="text-sm text-gray-600 mt-2">
          期限、理事会状況、最近のログを見て、今やるべき動きを文章で出します。
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">未完了タスク</div>
          <div className="text-2xl font-bold mt-2">{pendingTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">期限切れ</div>
          <div className="text-2xl font-bold mt-2">{overdueTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">今日期限</div>
          <div className="text-2xl font-bold mt-2">{todayTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">直近期限</div>
          <div className="text-2xl font-bold mt-2">{soonTasks.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">次アクション提案テキスト</div>
        <textarea
          readOnly
          defaultValue={outputText}
          className="w-full min-h-[520px] rounded-xl border p-4 text-sm leading-7 bg-gray-50"
        />
      </div>
    </div>
  )
}