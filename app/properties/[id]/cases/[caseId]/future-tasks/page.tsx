import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  daysSince,
  formatDate,
  getCaseSupportData,
} from '@/lib/caseSupportData'

type FutureTasksPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type SuggestedTask = {
  title: string
  priority: string
  dueHint: string
  reason: string
}

function buildSuggestedTasks(
  data: Awaited<ReturnType<typeof getCaseSupportData>>
): SuggestedTask[] {
  const { caseItem, tasks, logs } = data

  const incompleteTasks = tasks.filter((task) => task.status !== '完了')
  const overdueTasks = incompleteTasks.filter((task) => {
    if (!task.due_date) return false
    return new Date(task.due_date).getTime() < new Date().getTime()
  })
  const latestLogDays = logs[0] ? daysSince(logs[0].created_at) : null

  const suggestions: SuggestedTask[] = []

  if (latestLogDays === null || latestLogDays >= 7) {
    suggestions.push({
      title: '現状確認の連絡を入れる',
      priority: '高',
      dueHint: '今日〜明日',
      reason: latestLogDays === null
        ? '直近ログが無く、案件の現在地が見えにくいためです。'
        : `最終ログから ${latestLogDays} 日経っており、状況が古くなっているためです。`,
    })
  }

  if (overdueTasks.length > 0) {
    suggestions.push({
      title: '期限切れタスクの優先順位を整理し直す',
      priority: '高',
      dueHint: '今日',
      reason: `期限切れタスクが ${overdueTasks.length} 件あるため、放置防止が最優先です。`,
    })
  }

  if (incompleteTasks.some((task) => !task.due_date)) {
    suggestions.push({
      title: '未完了タスクの期限を入れる',
      priority: '高',
      dueHint: '今日〜今週中',
      reason: '期限が無いと担当変更時に止まりやすいためです。',
    })
  }

  if (
    (caseItem.board_status === '上程予定' || caseItem.board_status === '提出予定') &&
    !caseItem.board_agenda_title
  ) {
    suggestions.push({
      title: '理事会の議案タイトルを確定する',
      priority: '中',
      dueHint: '今週中',
      reason: '上程予定なのに議案タイトルが未設定のため、資料作成が止まりやすい状態です。',
    })
  }

  if (!caseItem.board_next_action) {
    suggestions.push({
      title: '次アクションを1行で明文化する',
      priority: '中',
      dueHint: '今日',
      reason: '次の動きが文章化されていないと、引き継ぎ時に口頭依存になります。',
    })
  }

  if (caseItem.status !== '完了' && incompleteTasks.length === 0) {
    suggestions.push({
      title: '完了条件を確認してクローズ判断する',
      priority: '中',
      dueHint: '今週中',
      reason: '未完了タスクが無いため、終わる案件なのか、次の作業が抜けているのか確認が必要です。',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: '案件の現状メモを1本追加する',
      priority: '中',
      dueHint: '今週中',
      reason: '大きな詰まりは見えません。今のうちに最新状況を残しておくと属人化を防げます。',
    })
  }

  return suggestions.slice(0, 6)
}

function buildSuggestedTaskText(
  data: Awaited<ReturnType<typeof getCaseSupportData>>,
  suggestions: SuggestedTask[]
) {
  return `【未来タスク自動提案】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}
案件ステータス：${data.caseItem.status || '未設定'}

${suggestions
  .map((item, index) => {
    return `${index + 1}. ${item.title}
・優先度：${item.priority}
・推奨期限：${item.dueHint}
・理由：${item.reason}`
  })
  .join('\n\n')}`
}

export default async function FutureTasksPage({
  params,
}: FutureTasksPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportData(id, caseId)
  const suggestions = buildSuggestedTasks(data)
  const generatedText = buildSuggestedTaskText(data, suggestions)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">未来タスク自動提案</h1>
          <p className="mt-1 text-sm text-gray-600">
            今の案件状態から、次に入れておくべきタスク候補を先回りで出します。
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

      <div className="grid gap-4">
        {suggestions.map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {index + 1}. {item.title}
              </h2>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                優先度：{item.priority}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div>推奨期限：{item.dueHint}</div>
              <div>理由：{item.reason}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">コピペ用テキスト</h2>
        <textarea
          readOnly
          value={generatedText}
          className="min-h-[360px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
        <div>既存未完了タスク数：{data.tasks.filter((task) => task.status !== '完了').length} 件</div>
        <div className="mt-2">
          最も近い期限：
          {data.tasks.find((task) => task.status !== '完了' && task.due_date)
            ? formatDate(
                data.tasks.find((task) => task.status !== '完了' && task.due_date)?.due_date || null
              )
            : '未設定'}
        </div>
      </div>
    </div>
  )
}