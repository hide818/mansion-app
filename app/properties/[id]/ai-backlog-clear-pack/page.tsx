import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBacklogClearPackPage({
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
      title: '残件の優先順整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の残件を洗い出し、今すぐ・今週中・来週以降に分けて整理してください。`,
    },
    {
      key: 'propertyHandover',
      title: '残件つき引き継ぎメモ',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、未完了事項が見落とされにくい引き継ぎメモを作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '残件共有ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の残件を社内共有向けに短く整理してください。`,
    },
    {
      key: 'complaintActions',
      title: '放置防止アクション',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}で放置すると火種になりそうな残件について、先回りの対応を提案してください。`,
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
          href={`/properties/${id}/ai-open-items-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          未完了整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI残件一掃パック"
        description={`${propertyName}の残件を洗い出して、優先順整理と放置防止まで一気に進めるパックです。`}
        tools={tools}
        featureList={[
          '次にやること自動表示',
          '未来のタスク自動生成',
          '未完了タスク整理表示',
          'AI次アクション提案',
          'AI対応提案',
        ]}
        notePlaceholder="例：今週で片付ける前提、放置火種を重視、など"
      />
    </div>
  )
}