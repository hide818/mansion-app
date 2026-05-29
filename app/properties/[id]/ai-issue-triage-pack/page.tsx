import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiIssueTriagePackPage({
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
      key: 'managementBrief',
      title: '問題の仕分けメモ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}について、今ある問題を優先度順に仕分けたメモを作成してください。`,
    },
    {
      key: 'nextActions',
      title: '優先順アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}について、問題ごとに次のアクションを優先順で整理してください。`,
    },
    {
      key: 'logSummary',
      title: '問題発生の流れ要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}について、今の問題がどう積み上がってきたか分かるように要約してください。`,
    },
    {
      key: 'complaintActions',
      title: '悪化防止アクション',
      endpoint: `/api/properties/${id}/ai-complaint-actions`,
      basePrompt: `${propertyName}について、放置すると悪化しそうな問題を先に潰すための対応提案をしてください。`,
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
          href={`/properties/${id}/ai-priority-check-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          優先度整理パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI問題仕分けパック"
        description={`${propertyName}の問題を優先度ごとに仕分けて、何から潰すか決めるパックです。`}
        tools={tools}
        featureList={[
          '優先度自動判定',
          'おすすめアクション表示',
          '次にやること自動表示',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：クレーム化しそうなもの優先、理事会前の宿題も重視、など"
      />
    </div>
  )
}