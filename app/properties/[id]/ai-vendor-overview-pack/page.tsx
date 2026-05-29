import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiVendorOverviewPackPage({
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
      title: '業者・見積の全体整理',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}の見積や業者対応について、全体像が分かるように整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内判断ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の業者判断について、社内で見やすい短いブリーフを作成してください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会説明前提の整理',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の業者・見積論点を、理事会説明も見据えて整理してください。`,
    },
    {
      key: 'logSummary',
      title: 'やり取りの流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の業者や見積に関するやり取りの流れが分かるように要約してください。`,
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
          href={`/properties/${id}/ai-estimate-judgement-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          見積判断パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI業者俯瞰パック"
        description={`${propertyName}の業者対応・見積論点を、物件単位で俯瞰して整理するパックです。`}
        tools={tools}
        featureList={[
          '見積履歴管理',
          '見積履歴分析',
          'AI文書整形',
          'AI要約',
          'AIによる判断補助',
        ]}
        notePlaceholder="例：業者比較よりも全体感重視、理事会向け説明も少し意識、など"
      />
    </div>
  )
}