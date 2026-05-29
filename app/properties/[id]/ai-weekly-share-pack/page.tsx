import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiWeeklySharePackPage({
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
      title: '週次共有文',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の1週間の動きを、週次共有として使える文章にしてください。月次ほど重くなく、社内で流しやすい形にしてください。`,
    },
    {
      key: 'logSummary',
      title: '1週間の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近1週間の流れが分かるように、要点だけ短く要約してください。`,
    },
    {
      key: 'nextActions',
      title: '来週の着手事項',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で来週優先して着手すべきことを整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内共有用ひとこと整理',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の今週の重要点を、社内へ流しやすい短い共有文にしてください。`,
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
          href={`/properties/${id}/ai-staff-share-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          社内共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI週次共有パック"
        description={`${propertyName}の週次共有、来週の初動、社内共有文をまとめて作るパックです。`}
        tools={tools}
        featureList={[
          '月次報告ドラフト生成',
          'コピペ用テキスト出力',
          'AI月次報告生成',
          'AI要約',
          '月次レポート自動生成',
        ]}
        notePlaceholder="例：社内チャットで流す想定、やや短め、など"
      />
    </div>
  )
}