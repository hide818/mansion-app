import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiAssigneeReadyPackPage({
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
      key: 'propertyHandover',
      title: '担当変更用 引き継ぎサマリー',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、担当変更前提で、現況・注意点・未了事項・重要人物対応が伝わる引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '担当変更用 社内メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、新担当者が最初に読む社内メモを短く作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、新担当者が流れをつかめるように要約してください。`,
    },
    {
      key: 'nextActions',
      title: '引き継ぎ後の初動整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で引き継ぎ後すぐ着手すべきことを、優先順で整理してください。`,
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
          href={`/properties/${id}/ai-handover-exec-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          引き継ぎ実務パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI担当変更準備パック"
        description={`${propertyName}の担当変更前に、引き継ぎ・社内共有・初動整理をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '担当変更時の専用画面',
          '重要人物メモ表示',
          '次回アクション表示',
          'AI引き継ぎサマリー',
          'AI要約',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：新担当が初見でも動けるように、注意点を厚めに、など"
      />
    </div>
  )
}