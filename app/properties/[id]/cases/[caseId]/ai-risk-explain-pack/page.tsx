import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiRiskExplainPackPage({
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
      key: 'summary',
      title: 'リスクの短い整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、リスクがどこにあるか短く整理してください。`,
    },
    {
      key: 'boardExplanation',
      title: '説明しやすいリスク文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、リスクを相手に説明しやすい文章を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: 'リスク低減アクション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、リスクを下げるための対応を提案してください。`,
    },
    {
      key: 'similarCases',
      title: '似た案件の注意点',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、似た案件から見たリスクの注意点を出してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-risk-guard-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          火種監視パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AIリスク説明パック"
        description={`${propertyName} / ${caseTitle} のリスクを、説明しやすく整理して対応までつなげるパックです。`}
        tools={tools}
        featureList={[
          '注意メッセージ表示',
          'AIによる判断補助',
          'AI理事会説明文生成',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：住民にも上司にも説明しやすい表現で、など"
      />
    </div>
  )
}