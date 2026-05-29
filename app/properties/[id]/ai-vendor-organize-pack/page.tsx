import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiVendorOrganizePackPage({
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
      basePrompt: `${propertyName}の業者対応や見積状況を、全体像が分かるように整理してください。`,
    },
    {
      key: 'logSummary',
      title: '業者やり取り要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の業者やり取りの流れを短く要約してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内向け業者整理メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の業者対応について、社内向けに整理メモを作成してください。`,
    },
    {
      key: 'nextActions',
      title: '業者対応の次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の業者対応で次に取るべき行動を優先順で整理してください。`,
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
          href={`/properties/${id}/ai-vendor-overview-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          業者俯瞰パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI業者整理パック"
        description={`${propertyName}の業者対応と見積状況を、物件単位で整理して次対応まで出すパックです。`}
        tools={tools}
        featureList={[
          '見積履歴管理',
          '見積履歴分析',
          '見積依頼文生成',
          'AIによる判断補助',
          'AI要約',
        ]}
        notePlaceholder="例：今月動いていない業者案件を重視、など"
      />
    </div>
  )
}