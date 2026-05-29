import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiEstimateJudgementPackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertyWorkbenchData(id)

  if (!data) notFound()

  const propertyName = data.property.name ?? '物件'

  const tools = [
    {
      key: 'estimateOverview',
      title: '見積関連まとめ',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}の見積関連の動きを、社内判断しやすい形で整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '見積判断ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の見積判断で、上司確認向けに論点を短く整理してください。`,
    },
    {
      key: 'nextActions',
      title: '見積後の次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の見積確認後に、何を進めるべきかを優先順で整理してください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会説明前提の整理',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の見積案件について、理事会説明も見据えた論点整理をしてください。`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI見積判断パック"
        description={`${propertyName}で見積判断が必要なときに、社内判断・次対応・理事会説明まで見据えて整理するパックです。`}
        tools={tools}
        featureList={[
          '見積履歴管理',
          '見積履歴分析',
          'AIによる判断補助',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：コストだけでなく再発防止も重視して、など"
      />
    </div>
  )
}