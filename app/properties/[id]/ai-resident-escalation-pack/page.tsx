import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiResidentEscalationPackPage({
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
      title: 'エスカレーション共有文',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}について、住民対応が強めになった時の社内共有文を作成してください。`,
    },
    {
      key: 'complaintActions',
      title: '強め対応の方針整理',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}について、住民対応がエスカレーションした時の現実的な対応方針を提案してください。`,
    },
    {
      key: 'managementBrief',
      title: '上司向け注意メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、住民対応が強くなった時に上司へ送る注意メモを短く作成してください。`,
    },
    {
      key: 'logSummary',
      title: 'エスカレーション経緯の要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、住民対応が強くなった経緯が分かるように要約してください。`,
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
          href={`/properties/${id}/ai-resident-soft-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          住民対応やわらか整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI住民エスカレーションパック"
        description={`${propertyName}の住民対応が強くなった時に、社内共有と対応方針を整理するパックです。`}
        tools={tools}
        featureList={[
          'クレーム対応履歴の蓄積',
          '注意メッセージ表示',
          'AIによる判断補助',
          'AI対応提案',
          'AIクレーム要約',
        ]}
        notePlaceholder="例：住民感情を悪化させたくない、でも引かずに整理したい、など"
      />
    </div>
  )
}