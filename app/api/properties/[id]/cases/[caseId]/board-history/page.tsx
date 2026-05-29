import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  formatDate,
  formatDateTime,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type BoardHistoryPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildBoardHistoryText(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>
) {
  const historyLogs = data.logs.filter((log) => {
    const message = (log.message || '').toLowerCase()
    return (
      message.includes('理事会') ||
      message.includes('総会') ||
      message.includes('議案') ||
      message.includes('承認')
    )
  })

  const historyText =
    historyLogs.length === 0
      ? '・理事会関連ログは未登録です。'
      : historyLogs
          .slice(0, 10)
          .map((log) => {
            return `・${formatDateTime(log.created_at)}：${(log.message || '').replace(/\s+/g, ' ').trim() || '内容未入力'}`
          })
          .join('\n')

  return `【理事会履歴まとめ】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}

■ 現在の理事会情報
理事会ステータス：${data.caseItem.board_status || '未設定'}
上程予定：${data.caseItem.board_scheduled_for || '未設定'}
議案タイトル：${data.caseItem.board_agenda_title || '未設定'}

■ 決定情報
決定状況：${data.caseItem.board_decision_status || '未設定'}
決定日：${formatDate(data.caseItem.board_decision_date)}
決定メモ：${data.caseItem.board_decision_note || '未設定'}

■ 関連履歴
${historyText}

■ 次に見るべきポイント
${data.caseItem.board_next_action || '次アクション未設定のため、次の動きを先に整理してください。'}`
}

export default async function BoardHistoryPage({
  params,
}: BoardHistoryPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildBoardHistoryText(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">理事会履歴まとめ</h1>
          <p className="mt-1 text-sm text-gray-600">
            理事会関連の状態、決定、履歴をまとめて確認できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={text} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <textarea
          readOnly
          value={text}
          className="min-h-[380px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}