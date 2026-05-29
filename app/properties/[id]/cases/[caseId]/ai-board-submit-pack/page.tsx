import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardSubmitPackPage({
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
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会提出用の議案ドラフトを作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '理事会説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会で説明しやすい文章を作成してください。`,
    },
    {
      key: 'expectedQuestions',
      title: '想定質問',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会で聞かれそうな質問を洗い出してください。`,
    },
    {
      key: 'format',
      title: '提出文整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、提出文として見やすい形に文章を整えてください。`,
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
        title="案件AI理事会提出完成パック"
        description={`${propertyName} / ${caseTitle} の理事会提出用文書をそのまま作りやすくするパックです。`}
        tools={tools}
        featureList={[
          'AI議案生成',
          'AI理事会説明文生成',
          '想定質問生成',
          'AI文書整形',
        ]}
        notePlaceholder="例：反対意見が出ても崩れにくい説明に、など"
      />
    </div>
  )
}