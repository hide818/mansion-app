import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiDailyControlPackPage({
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
      title: '日常運用ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の日常運用で、今押さえるべき点を社内共有向けに短く整理してください。`,
    },
    {
      key: 'nextActions',
      title: '今日からの次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で今日から優先して進めるべき次アクションを、実務順で整理してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動き要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近のログを、流れが分かるように要約してください。`,
    },
    {
      key: 'complaintActions',
      title: 'クレーム火種の対応提案',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}でクレーム化しやすい火種がある前提で、先回りの対応提案を実務的に整理してください。`,
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
        title="物件AI日常運用パック"
        description={`${propertyName}の日常運用で、今日どこを見て何を動かすかを一気に整理するパックです。`}
        tools={tools}
        featureList={[
          'AI次アクション提案',
          'AI要約',
          'AI対応提案',
          'AIによる判断補助',
        ]}
        notePlaceholder="例：対応漏れ防止を最優先で、理事長対応が荒れないように、など"
      />
    </div>
  )
}