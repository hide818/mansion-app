import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  formatDate,
  formatDateTime,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildBoardMinutes(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>
) {
  const recentLogs = data.logs.slice(0, 5)
  const logText =
    recentLogs.length === 0
      ? '・関連ログは未登録です。'
      : recentLogs
          .map((log) => {
            return `・${formatDateTime(log.created_at)}：${(log.message || '').replace(/\s+/g, ' ').trim() || '内容未入力'}`
          })
          .join('\n')

  return `【理事会議事録ドラフト】

議案名
${data.caseItem.board_agenda_title || data.caseItem.title || '議案タイトル未設定'}

概要
管理会社から、本件「${data.caseItem.title || '案件名未設定'}」について説明がなされた。
現在の案件ステータスは「${data.caseItem.status || '未設定'}」であり、理事会ステータスは「${data.caseItem.board_status || '未設定'}」である旨共有がなされた。

協議内容
${data.caseItem.board_next_action || '今後の進め方について確認が必要である旨説明がなされた。'}
決定状況は「${data.caseItem.board_decision_status || '未設定'}」である。
必要に応じて今後の対応方針について意見交換が行われた。

参考となる直近履歴
${logText}

決定事項
${data.caseItem.board_decision_note || '決定事項は未整理のため、理事会後に記録してください。'}

今後の対応
・必要な連絡を行う
・未完了タスクを整理する
・次回までに必要資料を整える

補足
決定日：${formatDate(data.caseItem.board_decision_date)}`
}

export default async function BoardMinutesPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildBoardMinutes(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">理事会議事録作成機能</h1>
          <p className="mt-1 text-sm text-gray-600">
            議事録のたたき台を、案件情報と最近の履歴から作ります。
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
          className="min-h-[440px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}