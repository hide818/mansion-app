import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiHandoverQuickPackPage({
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
      title: 'クイック引き継ぎ文',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、短時間で読めるクイック引き継ぎ文を作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '最重要注意メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、引き継ぎ時に最重要の注意点だけを短くまとめてください。`,
    },
    {
      key: 'logSummary',
      title: '最近の流れ一発要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、最近の流れが一発で分かるように短く要約してください。`,
    },
    {
      key: 'nextActions',
      title: '引き継ぎ後すぐやること',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}について、引き継ぎ後すぐ着手すべきことを整理してください。`,
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
          href={`/properties/${id}/ai-assignee-ready-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          担当変更準備パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AIクイック引き継ぎパック"
        description={`${propertyName}を短時間で引き継ぐための、軽量で使いやすいパックです。`}
        tools={tools}
        featureList={[
          '物件単位の引き継ぎサマリー',
          '次回アクション表示',
          '注意点表示',
          'AI引き継ぎサマリー',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：休暇前に5分で渡したい、短くても注意点は欲しい、など"
      />
    </div>
  )
}