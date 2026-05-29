import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiMonthEndPackPage({
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
      title: '月末まとめ報告',
      endpoint: `/api/properties/${id}/ai-monthly-report-board`,
      basePrompt: `${propertyName}の月末時点の動きを、月次報告としてそのまま使いやすい文章にしてください。`,
    },
    {
      key: 'logSummary',
      title: '当月の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の今月の動きを、流れが分かる形で要約してください。`,
    },
    {
      key: 'nextActions',
      title: '翌月の初動整理',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}で翌月の頭にすぐ着手すべきことを、優先順で整理してください。`,
    },
    {
      key: 'propertyHandover',
      title: '月末引き継ぎメモ',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}の月末引き継ぎメモとして、現況・注意点・未了事項が分かる文章を作成してください。`,
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
          href={`/properties/${id}/ai-manager-report-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          管理共有パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI月末整理パック"
        description={`${propertyName}の月末時点で、報告・要約・翌月初動・引き継ぎまで一気に整えるパックです。`}
        tools={tools}
        featureList={[
          '月次報告ドラフト生成',
          'AI月次報告生成',
          '現在の状況要約',
          '未完了タスク整理表示',
        ]}
        notePlaceholder="例：翌月頭の宿題が分かりやすい形で、役員共有にも少し流用したい、など"
      />
    </div>
  )
}