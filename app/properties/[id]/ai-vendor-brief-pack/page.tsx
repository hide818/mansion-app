import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiVendorBriefPackPage({
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
      title: '業者状況ブリーフ',
      endpoint: `/api/properties/${id}/ai-estimate-overview`,
      basePrompt: `${propertyName}について、業者状況や見積状況をブリーフ形式で整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内確認メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、業者対応で社内確認すべき点を短く整理してください。`,
    },
    {
      key: 'logSummary',
      title: 'やり取り経過の要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、業者やり取りの経過が分かるように要約してください。`,
    },
    {
      key: 'nextActions',
      title: '次に動くこと',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}について、業者対応で次に動くべきことを整理してください。`,
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
          href={`/properties/${id}/ai-vendor-status-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          業者状況整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI業者ブリーフパック"
        description={`${propertyName}の業者対応を、短いブリーフで俯瞰しやすくするパックです。`}
        tools={tools}
        featureList={[
          '見積履歴管理',
          '見積履歴分析',
          '見積依頼文生成',
          'AI要約',
          'AIによる判断補助',
        ]}
        notePlaceholder="例：見積待ちのものを先に、動いていない案件を重く、など"
      />
    </div>
  )
}