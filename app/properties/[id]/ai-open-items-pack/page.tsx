import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiOpenItemsPackPage({
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
      key: 'nextActions',
      title: '未完了整理と優先順',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で未完了のまま残っていそうなことを整理し、優先順で出してください。`,
    },
    {
      key: 'propertyHandover',
      title: '未了事項つき引き継ぎメモ',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、未了事項が一目で分かる引き継ぎメモを作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '今の残件ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}で今残っている重要事項を、社内共有向けに短く整理してください。`,
    },
    {
      key: 'logSummary',
      title: '残件につながる流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の流れから、残件がどう積み上がっているか分かるように要約してください。`,
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
          href={`/properties/${id}/handover-ai`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          引き継ぎAIへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI未完了整理パック"
        description={`${propertyName}で今どれが残件か、何から潰すべきか、引き継ぎ前提で整理するパックです。`}
        tools={tools}
        featureList={[
          '未完了タスク整理表示',
          '次回アクション表示',
          '次にやること自動表示',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：今週やること優先、担当変更前提で見落としゼロ重視、など"
      />
    </div>
  )
}