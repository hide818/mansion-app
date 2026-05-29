import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  formatDate,
  formatDateTime,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type BoardDraftPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildBoardDraft(data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const latestLog = data.logs[0]
  const agendaTitle =
    data.caseItem.board_agenda_title || data.caseItem.title || '議案タイトル未設定'

  const taskLines =
    incompleteTasks.length === 0
      ? '現在、大きな残作業はありません。'
      : incompleteTasks
          .slice(0, 5)
          .map((task) => {
            return `・${task.title || '未設定'}（期限：${formatDate(task.due_date)} / 優先度：${task.priority || '未設定'}）`
          })
          .join('\n')

  return `【理事会報告ドラフト】

議案名
${agendaTitle}

現状
本件は「${data.caseItem.title || '案件名未設定'}」として対応中です。
案件ステータスは「${data.caseItem.status || '未設定'}」です。
理事会ステータスは「${data.caseItem.board_status || '未設定'}」です。
${
  latestLog
    ? `直近の更新は ${formatDateTime(latestLog.created_at)} です。`
    : '直近の更新記録は未登録です。'
}

現在の主な残作業
${taskLines}

今後の進め方
${data.caseItem.board_next_action || '次アクションは未設定です。先に整理が必要です。'}

補足
決定状況：${data.caseItem.board_decision_status || '未設定'}
決定日：${formatDate(data.caseItem.board_decision_date)}
決定メモ：${data.caseItem.board_decision_note || '未設定'}`
}

export default async function BoardDraftPage({
  params,
}: BoardDraftPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildBoardDraft(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">理事会報告ドラフト</h1>
          <p className="mt-1 text-sm text-gray-600">
            理事会に出す前のたたき台を、案件情報からそのまま作ります。
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