import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiComplaintResponsePackPage({
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
      title: 'クレーム共有要約',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の最近のクレーム状況を、事実ベースで共有しやすい文面に整理してください。`,
    },
    {
      key: 'complaintActions',
      title: 'クレーム対応提案',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}のクレーム対応について、現実的で実務的な次対応を提案してください。`,
    },
    {
      key: 'logSummary',
      title: '関連ログ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近のログから、クレーム対応に関係する流れが分かるように要約してください。`,
    },
    {
      key: 'nextActions',
      title: '優先アクション整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}のクレーム対応で、今すぐ優先すべきアクションを順番付きで整理してください。`,
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
        title="物件AIクレーム対応パック"
        description={`${propertyName}のクレーム対応で、共有・判断・次アクションを一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'AIクレーム要約',
          'AI対応提案',
          'AI次アクション提案',
          'クレーム対応履歴の蓄積',
        ]}
        notePlaceholder="例：役員向けに落ち着いた表現で、再発防止を強めに、など"
      />
    </div>
  )
}