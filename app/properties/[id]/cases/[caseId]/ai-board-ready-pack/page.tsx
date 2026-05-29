import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardReadyPackPage({
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
      title: '議案ドラフト',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-agenda`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会提出向けの議案ドラフトを作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '理事会説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」を、理事会で口頭説明しやすい文章にしてください。`,
    },
    {
      key: 'expectedQuestions',
      title: '想定質問',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会で聞かれそうな質問を実務目線で出してください。`,
    },
    {
      key: 'questionSimulation',
      title: '理事会シミュレーション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会想定のやり取りを簡潔にシミュレーションしてください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI理事会準備パック"
        description={`${propertyName} / ${caseTitle} の理事会前準備を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'AI議案生成',
          'AI理事会説明文生成',
          '想定質問生成',
          '理事会シミュレーション',
        ]}
        notePlaceholder="例：理事長が厳しめなので反対意見も想定して、など"
      />
    </div>
  )
}