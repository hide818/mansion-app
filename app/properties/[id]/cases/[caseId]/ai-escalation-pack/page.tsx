import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiEscalationPackPage({
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
      basePrompt: `${propertyName}の「${caseTitle}」について、厳しめの質問や突っ込みを想定して洗い出してください。`,
    },
    {
      key: 'questionSimulation',
      title: 'やり取りシミュレーション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、厳しめの相手とのやり取りを想定してシミュレーションしてください。`,
    },
    {
      key: 'responseSuggestion',
      title: '回答方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、エスカレーション時でもぶれにくい回答方針を提案してください。`,
    },
    {
      key: 'summary',
      title: '短い状況整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、荒れた場面でもまず読み返せる短い状況整理文を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-answer-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          回答準備パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AIエスカレーション対応パック"
        description={`${propertyName} / ${caseTitle} で厳しい質問や荒れやすい場面に備えるためのAIパックです。`}
        tools={tools}
        featureList={[
          '想定質問生成',
          '理事会シミュレーション',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：理事長が強め、住民説明が必要、謝罪感は出しすぎない、など"
      />
    </div>
  )
}