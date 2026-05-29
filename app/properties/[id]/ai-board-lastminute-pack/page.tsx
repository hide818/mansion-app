import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardLastminutePackPage({
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
      key: 'boardBrief',
      title: '理事会直前ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会直前確認用として、争点・注意点・伝える順番が分かるブリーフを作成してください。`,
    },
    {
      key: 'boardBatch',
      title: '提出用まとめ文',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会提出前提で、物件全体の重要論点を短くまとめた文章を作成してください。`,
    },
    {
      key: 'complaintBrief',
      title: 'クレーム補足共有',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}で理事会前に共有しておくべきクレーム状況を簡潔に整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内最終確認メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の理事会前に社内で最終確認しておくべき点を短く整理してください。`,
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
          href={`/properties/${id}/ai-board-before-check-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会前確認パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会直前パック"
        description={`${propertyName}の理事会直前に、提出・争点整理・社内確認を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          '理事会提出推奨アラート',
          '理事会報告ドラフト生成',
          '想定質問生成',
          'AI理事会説明文生成',
          'AIクレーム要約',
        ]}
        notePlaceholder="例：理事長が厳しめ、短くても争点は落としたくない、など"
      />
    </div>
  )
}