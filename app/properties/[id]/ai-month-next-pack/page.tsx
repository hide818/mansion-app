import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiMonthNextPackPage({
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
      title: '今月の着地まとめ',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}について、今月の着地が分かるまとめ文を作成してください。`,
    },
    {
      key: 'propertyHandover',
      title: '翌月に持ち越すこと',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}について、翌月へ持ち越す事項が分かる引き継ぎメモを作成してください。`,
    },
    {
      key: 'nextActions',
      title: '来月初動アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}について、来月頭に最優先で着手すべきことを整理してください。`,
    },
    {
      key: 'logSummary',
      title: '今月の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、今月の流れが分かるように短く要約してください。`,
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
          href={`/properties/${id}/ai-month-close-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          月末着地パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI来月準備パック"
        description={`${propertyName}の月末着地から、来月初動までつなげるパックです。`}
        tools={tools}
        featureList={[
          '月次報告ドラフト生成',
          '未完了タスク整理表示',
          '次回アクション表示',
          'AI次アクション提案',
          'AI要約',
        ]}
        notePlaceholder="例：翌月頭の宿題を絶対落としたくない、など"
      />
    </div>
  )
}