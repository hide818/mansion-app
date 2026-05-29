import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardReadyPackPage({
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
      basePrompt: `${propertyName}の月次報告ドラフトを、理事会共有向けに実務で使いやすく作成してください。`,
    },
    {
      key: 'boardBrief',
      title: '理事会全体ブリーフ',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会前確認用ブリーフを作成してください。今月の重要論点と注意点が分かるようにしてください。`,
    },
    {
      key: 'complaintBrief',
      title: 'クレーム共有要約',
      endpoint: `/api/properties/${id}/ai-complaint-brief`,
      basePrompt: `${propertyName}の最近のクレームを、理事会前共有向けに落ち着いた文体で整理してください。`,
    },
    {
      key: 'nextActions',
      title: '理事会前の次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で理事会前に優先して進めるべき次アクションを、実務順で整理してください。`,
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
          href={`/properties/${id}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI理事会準備パック"
        description={`${propertyName}の理事会前に欲しい文書を一気に生成するパックです。`}
        tools={tools}
        featureList={[
          '理事会報告ドラフト生成',
          'AI月次報告生成',
          'AIクレーム要約',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：役員向けにやわらかく、今月の注意点を少し厚めに、など"
      />
    </div>
  )
}