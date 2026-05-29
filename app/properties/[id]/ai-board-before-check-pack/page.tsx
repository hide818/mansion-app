import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardBeforeCheckPackPage({
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
      title: '理事会前の最終確認ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会前に、最終確認しておくべき点だけを短く整理してください。`,
    },
    {
      key: 'monthlyReport',
      title: '提出直前の報告文',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の理事会提出直前に使いやすい報告文を作成してください。`,
    },
    {
      key: 'boardBatch',
      title: '理事会提出まとめ',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会提出用に、複数論点をまとめた文章を作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内確認メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の理事会前に社内で確認しておくべき点を短くまとめてください。`,
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
          href={`/properties/${id}/ai-board-exec-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会実行パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会前確認パック"
        description={`${propertyName}の理事会直前に、確認漏れを減らすための最終確認AIパックです。`}
        tools={tools}
        featureList={[
          '理事会提出推奨アラート',
          '理事会報告ドラフト生成',
          'AI理事会説明文生成',
          'AI月次報告生成',
        ]}
        notePlaceholder="例：役員向けに短く、提出前の確認漏れゼロを重視、など"
      />
    </div>
  )
}