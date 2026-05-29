import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiRiskWatchPackPage({
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
      key: 'managementBrief',
      title: 'リスク監視ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}で今注意すべきリスクを、社内共有向けに短く整理してください。`,
    },
    {
      key: 'nextActions',
      title: '先回りアクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で事故や炎上を防ぐため、先に打つべきアクションを優先順で整理してください。`,
    },
    {
      key: 'logSummary',
      title: '不穏な動きの要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きの中で、トラブル化しそうな点が分かるように要約してください。`,
    },
    {
      key: 'complaintActions',
      title: '火種対応の提案',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}で火種になりそうなクレームや相談について、先回りの対応提案をしてください。`,
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
        title="物件AIリスク監視パック"
        description={`${propertyName}で事故・炎上・対応漏れを防ぐための監視用AIパックです。`}
        tools={tools}
        featureList={[
          '案件リスク判定',
          '注意メッセージ表示',
          'AIによる判断補助',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：理事会前で荒れそうな点を重視、居住者トラブルを優先、など"
      />
    </div>
  )
}