import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardLastminutePackPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params
  const data = await getCaseWorkbenchData(id, caseId)

  if (!data) notFound()

  const propertyName = data.property.name ?? '物件'
  const caseTitle = data.caseRow.title ?? '案件'

  const tools = [
    {
      key: 'agenda',
      title: '議案の最終版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-agenda`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会直前の最終版として使いやすい議案文を作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '理事会説明の最終版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会直前の口頭説明用文章を作成してください。`,
    },
    {
      key: 'expectedQuestions',
      title: '直前チェック用 想定質問',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会直前に確認すべき想定質問を出してください。`,
    },
    {
      key: 'questionSimulation',
      title: '直前シミュレーション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会直前確認用の短いシミュレーションを作成してください。`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/ai-board-submit-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会提出完成パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI理事会直前パック"
        description={`${propertyName} / ${caseTitle} の理事会直前に、議案・説明・質問対策を最終確認するパックです。`}
        tools={tools}
        featureList={[
          'AI議案生成',
          '想定質問生成',
          '理事会シミュレーション',
          'AI理事会説明文生成',
          '理事会報告ドラフト生成',
        ]}
        notePlaceholder="例：理事長が厳しめ、金額への質問を重く、など"
      />
    </div>
  )
}