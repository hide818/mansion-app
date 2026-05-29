import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardDecisionPackPage({
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
      key: 'boardBatch',
      title: '決裁向けまとめ文',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会決裁向けに、物件全体の重要点を短くまとめた文章を作成してください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会決裁ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会決裁で押さえるべき論点を整理してください。`,
    },
    {
      key: 'monthlyReport',
      title: '提出用の報告文',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の理事会決裁前提で、そのまま流用しやすい報告文を作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内確認メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の理事会決裁前に、社内で確認すべき点を短く整理してください。`,
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
          href={`/properties/${id}/ai-board-issues-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会論点整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会決裁パック"
        description={`${propertyName}の理事会決裁前に、提出文と社内確認をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '理事会報告ドラフト生成',
          '理事会提出推奨アラート',
          'AI理事会説明文生成',
          'AI月次報告生成',
        ]}
        notePlaceholder="例：決裁向けに短く、でも争点は落としたくない、など"
      />
    </div>
  )
}