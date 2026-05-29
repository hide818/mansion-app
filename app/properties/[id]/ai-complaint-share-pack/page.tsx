import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiComplaintSharePackPage({
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
      title: 'クレーム共有文',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}について、最近のクレーム状況を社内共有しやすい文章で整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '注意点メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、クレーム対応で社内が注意すべき点を短く整理してください。`,
    },
    {
      key: 'complaintActions',
      title: '次対応の整理',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}について、クレーム対応の次アクションを提案してください。`,
    },
    {
      key: 'logSummary',
      title: '対応履歴の要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、クレーム対応履歴の流れが分かるように要約してください。`,
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
          href={`/properties/${id}/ai-complaint-prevent-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          クレーム予防パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AIクレーム共有パック"
        description={`${propertyName}のクレーム状況を、社内へ共有しやすい形でまとめるパックです。`}
        tools={tools}
        featureList={[
          'クレーム履歴一覧',
          'クレーム対応履歴の蓄積',
          'コピペ用テキスト出力',
          'AIクレーム要約',
          'AI文書整形',
        ]}
        notePlaceholder="例：事実ベースで、感情的に見えないように、など"
      />
    </div>
  )
}