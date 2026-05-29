import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  daysSince,
  formatDate,
  formatDateTime,
  getCaseSupportData,
} from '@/lib/caseSupportData'

type AssigneeHandoffPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildHandoffText(input: Awaited<ReturnType<typeof getCaseSupportData>>) {
  const { property, caseItem, tasks, logs } = input

  const incompleteTasks = tasks.filter((task) => task.status !== '完了')
  const overdueTasks = incompleteTasks.filter((task) => {
    if (!task.due_date) return false
    return new Date(task.due_date).getTime() < new Date().getTime()
  })

  const latestLog = logs[0] ?? null
  const latestLogDays = latestLog ? daysSince(latestLog.created_at) : null
  const latestLogsText =
    logs.length === 0
      ? '・直近ログは未登録です。'
      : logs
          .slice(0, 5)
          .map((log) => {
            const body = (log.message || '').replace(/\s+/g, ' ').trim()
            return `・${formatDateTime(log.created_at)}：${body || '内容未入力'}`
          })
          .join('\n')

  const taskText =
    incompleteTasks.length === 0
      ? '・未完了タスクはありません。'
      : incompleteTasks
          .map((task) => {
            return `・${task.title || '名称未設定'} / 優先度：${task.priority || '未設定'} / 期限：${formatDate(task.due_date)}`
          })
          .join('\n')

  const cautionLines: string[] = []

  if (!caseItem.assignee) {
    cautionLines.push('・担当者が未設定です。引き継ぎ先の明記が必要です。')
  }

  if (overdueTasks.length > 0) {
    cautionLines.push(`・期限切れタスクが ${overdueTasks.length} 件あります。優先確認が必要です。`)
  }

  if (latestLogDays !== null && latestLogDays >= 7) {
    cautionLines.push(`・最終ログから ${latestLogDays} 日経過しています。現状確認が必要です。`)
  }

  if (!caseItem.board_next_action) {
    cautionLines.push('・次アクション欄が未入力です。引き継ぎ時に口頭だけで済ませないよう注意です。')
  }

  if (cautionLines.length === 0) {
    cautionLines.push('・大きな注意点は見当たりません。')
  }

  const nextAction =
    caseItem.board_next_action ||
    (overdueTasks.length > 0
      ? '期限切れタスクの優先順位を整理し、関係者へ再連絡する。'
      : incompleteTasks.length > 0
      ? '未完了タスクの担当・期限を再確認して次の動きを固める。'
      : '案件の完了条件を確認し、クローズ判断を行う。')

  return `【担当者変更用 引き継ぎメモ】

物件名：${property.name || '未設定'}
案件名：${caseItem.title || '未設定'}
案件ステータス：${caseItem.status || '未設定'}
現在担当：${caseItem.assignee || '未設定'}
理事会ステータス：${caseItem.board_status || '未設定'}
理事会上程予定：${caseItem.board_scheduled_for || '未設定'}

■ 現在の状況
本案件は「${caseItem.title || '案件名未設定'}」として管理中です。
案件ステータスは「${caseItem.status || '未設定'}」です。
${latestLog
  ? `直近更新は ${formatDateTime(latestLog.created_at)} で、最終ログの確認が可能です。`
  : '直近ログが未登録のため、最新状況の確認が必要です。'}
未完了タスクは ${incompleteTasks.length} 件あります。

■ 未完了タスク
${taskText}

■ 直近ログ
${latestLogsText}

■ 注意点
${cautionLines.join('\n')}

■ 引き継ぎ先に最初に伝えること
・案件の現在地
・未完了タスクの優先順位
・理事会対応の要否
・次に誰へ連絡するか

■ 次にやること
${nextAction}`
}

export default async function AssigneeHandoffPage({
  params,
}: AssigneeHandoffPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportData(id, caseId)
  const generatedText = buildHandoffText(data)

  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">担当者変更モード</h1>
          <p className="mt-1 text-sm text-gray-600">
            引き継ぎ時にそのまま渡せる文章を自動で整理します。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={generatedText} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">物件</div>
          <div className="mt-1 font-semibold">{data.property.name || '未設定'}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">案件ステータス</div>
          <div className="mt-1 font-semibold">{data.caseItem.status || '未設定'}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">未完了タスク数</div>
          <div className="mt-1 font-semibold">{incompleteTasks.length} 件</div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">引き継ぎ文</h2>
        <textarea
          readOnly
          value={generatedText}
          className="min-h-[520px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}