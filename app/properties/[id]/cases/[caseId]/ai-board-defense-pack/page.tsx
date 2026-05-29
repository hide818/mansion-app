import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardDefensePackPage({
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
      key: 'expectedQuestions',
      title: '厳しめ想定質問',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会で厳しめに聞かれそうな質問を出してください。`,
    },
    {
      key: 'questionSimulation',
      title: '防御シミュレーション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、厳しい質問にどう返すかのシミュレーションを作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '防御しやすい説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、突っ込まれても崩れにくい説明文を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '回答方針メモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会でぶれにくい回答方針を短く整理してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-board-ready-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会準備パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI理事会防御パック"
        description={`${propertyName} / ${caseTitle} で、厳しい質問や反対意見に備えるための防御用AIパックです。`}
        tools={tools}
        featureList={[
          '想定質問生成',
          '理事会シミュレーション',
          'AI理事会説明文生成',
          'AI対応提案',
        ]}
        notePlaceholder="例：理事長がかなり厳しめ、費用面の反発がありそう、など"
      />
    </div>
  )
}