import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiAnswerPackPage({
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
      title: '想定質問一覧',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会や上司から聞かれそうな質問を洗い出してください。`,
    },
    {
      key: 'questionSimulation',
      title: '想定やり取り',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-question-simulation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、質問と返答のシミュレーションを作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '回答方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、ぶれにくい回答方針を提案してください。`,
    },
    {
      key: 'boardExplanation',
      title: '説明文補助',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、質問に答える前提で説明しやすい文章を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/question-simulation`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          質問シミュレーションへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI回答準備パック"
        description={`${propertyName} / ${caseTitle} の質問対策・回答準備を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          '想定質問生成',
          '理事会シミュレーション',
          'AI対応提案',
          'AI理事会説明文生成',
        ]}
        notePlaceholder="例：反対意見が強そうなので厳しめの質問も出して、など"
      />
    </div>
  )
}