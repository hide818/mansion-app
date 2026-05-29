import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiDailyCheckinPackPage({
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
      key: 'nextActions',
      title: '今日の優先アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}について、今日優先して動くべきことを順番付きで整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '朝の社内共有メモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、朝の社内共有で使える短いメモを作成してください。`,
    },
    {
      key: 'logSummary',
      title: '直近の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、直近の流れが一目で分かるように要約してください。`,
    },
    {
      key: 'complaintActions',
      title: '火種の先回り対応',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}について、今日のうちに先回りで潰すべき火種対応を提案してください。`,
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
          href={`/properties/${id}/ai-week-start-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          週初整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI日次チェックインパック"
        description={`${propertyName}の朝一確認、今日の優先順位、火種確認を一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'おすすめアクション表示',
          'AIによる判断補助',
          '次にやること自動表示',
          'AI次アクション提案',
          'AI要約',
        ]}
        notePlaceholder="例：朝イチで5分で見たい、クレーム火種は重めに、など"
      />
    </div>
  )
}