import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardExecPackPage({
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
      title: '理事会提出まとめ',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会提出向けに、案件横断で重要点を整理したまとめ文を作成してください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会前最終ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会前に、絶対押さえるべき点だけを短く整理してください。`,
    },
    {
      key: 'monthlyReport',
      title: '提出用月次報告',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の理事会提出にそのまま流用しやすい月次報告ドラフトを作成してください。`,
    },
    {
      key: 'complaintBrief',
      title: 'クレーム共有補足',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の理事会で補足説明が必要なクレーム状況を簡潔に整理してください。`,
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
          href={`/properties/${id}/ai-board-submit-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会提出完成パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会実行パック"
        description={`${propertyName}の理事会直前に、提出・確認・補足説明をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '理事会報告ドラフト生成',
          '理事会提出推奨アラート',
          'AI理事会説明文生成',
          'AIクレーム要約',
        ]}
        notePlaceholder="例：役員が忙しいので短く、でも争点だけは落とさないように、など"
      />
    </div>
  )
}