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

function buildAgendaDocument(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>
) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const recentLog = data.logs[0]
  const agendaTitle =
    data.caseItem.board_agenda_title || data.caseItem.title || '議案タイトル未設定'

  const taskText =
    incompleteTasks.length === 0
      ? '現在、大きな残作業はありません。'
      : incompleteTasks
          .slice(0, 5)
          .map((task) => {
            return `・${task.title || '未設定'}（期限：${formatDate(task.due_date)} / 優先度：${task.priority || '未設定'}）`
          })
          .join('\n')

  return `【議案書ドラフト】

議案名
${agendaTitle}

1. 提案の趣旨
本件は「${data.caseItem.title || '案件名未設定'}」として対応している案件です。
現在の案件ステータスは「${data.caseItem.status || '未設定'}」です。
${
  recentLog
    ? `直近の更新は ${formatDateTime(recentLog.created_at)} です。`
    : '直近の更新記録は未登録です。'
}

2. 現在の状況
${data.caseItem.board_next_action || '今後の進め方は未整理のため、先に確認が必要です。'}
理事会ステータスは「${data.caseItem.board_status || '未設定'}」です。
上程予定は「${data.caseItem.board_scheduled_for || '未設定'}」です。

3. 現時点の残作業
${taskText}

4. 理事会で確認または承認いただきたい事項
・本件の進め方
・必要な対応方針
・今後のスケジュール感

5. 補足
決定状況：${data.caseItem.board_decision_status || '未設定'}
決定日：${formatDate(data.caseItem.board_decision_date)}
決定メモ：${data.caseItem.board_decision_note || '未設定'}`
}

export default async function AgendaDocumentPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildAgendaDocument(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">議案書作成機能</h1>
          <p className="mt-1 text-sm text-gray-600">
            理事会に提出する議案書のたたき台を、今の案件情報から整えます。
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
          className="min-h-[420px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}