import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import { formatDate, getCaseSupportData } from '@/lib/caseSupportData'

type SimpleExplanationPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildExplanationSet(data: Awaited<ReturnType<typeof getCaseSupportData>>) {
  const { property, caseItem, tasks, logs } = data

  const incompleteTasks = tasks.filter((task) => task.status !== '完了')
  const recentLog = logs[0]
  const nextAction = caseItem.board_next_action || '今後の動きを整理して確定すること'
  const boardInfo =
    caseItem.board_status && caseItem.board_status !== '未設定'
      ? `理事会対応は「${caseItem.board_status}」の扱いです。`
      : '理事会対応の整理はこれからです。'

  const easy = `この案件は、${property.name || '対象物件'}で発生している「${caseItem.title || '案件名未設定'}」への対応です。現在の案件ステータスは「${caseItem.status || '未設定'}」で、未完了タスクは ${incompleteTasks.length} 件あります。${boardInfo} 次に進めるべき内容は「${nextAction}」です。`

  const board = `本件につきましては、「${caseItem.title || '案件名未設定'}」として対応を進めております。現時点では案件ステータスは「${caseItem.status || '未設定'}」であり、未完了タスクは ${incompleteTasks.length} 件です。${
    recentLog
      ? `直近の更新は ${formatDate(recentLog.created_at)} です。`
      : '直近の更新記録は未登録です。'
  } 今後は「${nextAction}」を中心に進める想定です。`

  const resident = `現在、「${caseItem.title || '案件名未設定'}」について対応中です。まだ完了ではなく、今は必要な確認や残作業を進めている段階です。今後は「${nextAction}」を進めながら、状況が整理でき次第ご報告します。`

  return {
    easy,
    board,
    resident,
  }
}

function buildCombinedText(explanations: ReturnType<typeof buildExplanationSet>) {
  return `【案件かんたん説明】

■ まず案件を知らない人向け
${explanations.easy}

■ 理事会で説明する時のたたき台
${explanations.board}

■ 居住者に聞かれた時のやわらかい説明
${explanations.resident}`
}

export default async function SimpleExplanationPage({
  params,
}: SimpleExplanationPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportData(id, caseId)
  const explanations = buildExplanationSet(data)
  const generatedText = buildCombinedText(explanations)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">案件かんたん説明</h1>
          <p className="mt-1 text-sm text-gray-600">
            知らない人に伝える用、理事会用、居住者向けの3種類をまとめます。
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
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-500">
            まず案件を知らない人向け
          </div>
          <div className="text-sm leading-7">{explanations.easy}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-500">
            理事会で説明する時のたたき台
          </div>
          <div className="text-sm leading-7">{explanations.board}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-500">
            居住者に聞かれた時のやわらかい説明
          </div>
          <div className="text-sm leading-7">{explanations.resident}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">まとめてコピー</h2>
        <textarea
          readOnly
          value={generatedText}
          className="min-h-[300px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}