import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiDecisionMemoPackPage({
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
      title: '判断用の短い要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、判断前提で短く要点だけ整理した要約を作成してください。`,
    },
    {
      key: 'estimateComment',
      title: '見積・判断論点メモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-estimate-comment`,
      basePrompt: `${propertyName}の「${caseTitle}」について、見積比較や判断時の論点メモを作成してください。`,
    },
    {
      key: 'similarCases',
      title: '類似案件の示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、類似案件から見た注意点や判断の参考点を出してください。`,
    },
    {
      key: 'responseSuggestion',
      title: 'おすすめ判断方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、現実的な判断方針と次対応を提案してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-manager-brief-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          管理共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI判断メモパック"
        description={`${propertyName} / ${caseTitle} の判断材料を、短く強くまとめるパックです。`}
        tools={tools}
        featureList={[
          'おすすめアクション表示',
          'AIによる判断補助',
          'AI要約',
          'AI見積比較コメント生成',
          'AI類似案件提案',
        ]}
        notePlaceholder="例：上司に一発で判断してもらえるよう短く、でも懸念は残して、など"
      />
    </div>
  )
}