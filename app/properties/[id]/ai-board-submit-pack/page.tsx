import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardSubmitPackPage({
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
      key: 'monthlyReport',
      title: '月次報告ドラフト',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の理事会提出向け月次報告ドラフトを作成してください。役員が読みやすい形にしてください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会全体ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会提出前に確認すべき全体ブリーフを作成してください。`,
    },
    {
      key: 'boardBatch',
      title: '理事会提出まとめ',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会提出資料として使いやすいまとめ文を作成してください。案件横断で重要点を整理してください。`,
    },
    {
      key: 'complaintBrief',
      title: 'クレーム共有要約',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の最近のクレーム状況を、理事会前共有向けに簡潔に整理してください。`,
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
          href={`/properties/${id}/ai-board-ready-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          理事会準備パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会提出完成パック"
        description={`${propertyName}の理事会提出で、そのまま叩き台にしやすい文書を一気に作るパックです。`}
        tools={tools}
        featureList={[
          '理事会報告ドラフト生成',
          'ワンクリック理事会報告',
          'AI月次報告生成',
          'AIクレーム要約',
        ]}
        notePlaceholder="例：役員向けにかたすぎない文体で、注意点は強めに、など"
      />
    </div>
  )
}