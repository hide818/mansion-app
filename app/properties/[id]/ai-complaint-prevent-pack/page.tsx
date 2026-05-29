import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiComplaintPreventPackPage({
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
      key: 'complaintBrief',
      title: '最近のクレーム傾向整理',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の最近のクレーム傾向を、再発しやすい観点を意識して整理してください。`,
    },
    {
      key: 'complaintActions',
      title: '再発予防アクション',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}でクレームが再発しないよう、先回りの対応を実務順で提案してください。`,
    },
    {
      key: 'logSummary',
      title: '火種になりそうな流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きから、クレーム化しそうな流れが分かるように要約してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内注意メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}で社内共有しておくべきクレーム再発防止メモを短く作成してください。`,
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
          href={`/properties/${id}/ai-risk-watch-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          リスク監視パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AIクレーム予防パック"
        description={`${propertyName}のクレーム傾向、火種、再発予防を先回りで整理するパックです。`}
        tools={tools}
        featureList={[
          'クレーム再発警告',
          'クレーム傾向分析',
          'AIクレーム要約',
          'AI対応提案',
          'AIによる判断補助',
        ]}
        notePlaceholder="例：騒音系を重めに、理事長から見ても納得感があるように、など"
      />
    </div>
  )
}