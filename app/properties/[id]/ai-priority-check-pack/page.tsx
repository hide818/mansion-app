import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiPriorityCheckPackPage({
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
      key: 'nextActions',
      title: '優先順アクション整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で今やるべきことを、優先順が分かるように整理してください。急ぎ、今週中、後回しに分けてください。`,
    },
    {
      key: 'managementBrief',
      title: '優先度共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の今の優先度が高い論点を、社内共有向けに短く整理してください。`,
    },
    {
      key: 'logSummary',
      title: '優先度判断の根拠要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きから、何を優先すべきかが分かるように要約してください。`,
    },
    {
      key: 'complaintActions',
      title: '先回り注意アクション',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}で火種になりそうなことを先回りで潰すためのアクションを提案してください。`,
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
          href={`/properties/${id}/ai-daily-control-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          日常運用パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI優先度整理パック"
        description={`${propertyName}で、今どこから手を付けるべきかを先に決めるためのAIパックです。`}
        tools={tools}
        featureList={[
          '優先度自動判定',
          'おすすめアクション表示',
          '次にやること自動表示',
          'AI次アクション提案',
          'AI要約',
        ]}
        notePlaceholder="例：理事会前のものを重く、クレーム火種を最優先、など"
      />
    </div>
  )
}