import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiBoardFollowupPackPage({
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
      key: 'minutes',
      title: '理事会後記録メモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後の記録や宿題整理に使える文章を作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '宿題共有用の説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後の継続課題が分かる説明文を作成してください。`,
    },
    {
      key: 'expectedQuestions',
      title: '次回までの論点整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-expected-questions`,
      basePrompt: `${propertyName}の「${caseTitle}」について、次回理事会までに整理しておくべき論点や質問を出してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '理事会後の次対応',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会後に何を追うべきかを順番付きで提案してください。`,
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
        title="案件AI理事会宿題パック"
        description={`${propertyName} / ${caseTitle} の理事会後宿題、記録、次回論点整理をまとめるパックです。`}
        tools={tools}
        featureList={[
          '想定質問生成',
          'AI理事会説明文生成',
          '理事会議事録作成機能',
          'AI議事録生成',
          'AI対応提案',
        ]}
        notePlaceholder="例：次回までの宿題を明確に、管理会社の宿題を重めに、など"
      />
    </div>
  )
}