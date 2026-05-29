import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiWeekClosePackPage({
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
      key: 'weeklyReport',
      title: '週末共有文',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}について、この1週間の動きを週末共有として使いやすい形でまとめてください。`,
    },
    {
      key: 'logSummary',
      title: '週内の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、この1週間の流れが分かるように要約してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内共有用ひとこと',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、週末の社内共有向けに重要点だけ短く整理してください。`,
    },
    {
      key: 'propertyHandover',
      title: '週末時点の引き継ぎメモ',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、週末時点の現況と注意点が分かる引き継ぎメモを作成してください。`,
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
          href={`/properties/${id}/ai-weekly-share-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          週次共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI週末整理パック"
        description={`${propertyName}の週末時点で、共有・要約・引き継ぎまでまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          'コピペ用テキスト出力',
          'AI文書整形',
          'AI要約',
          'AI月次報告生成',
          '現在の状況要約',
        ]}
        notePlaceholder="例：月次ほど重くなく、週末共有で軽く回したい、など"
      />
    </div>
  )
}