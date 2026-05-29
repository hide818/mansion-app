import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiBoardFollowupPackPage({
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
      title: '理事会後の宿題整理',
      endpoint: `/api/properties/${id}/ai-board-brief`,
      basePrompt: `${propertyName}の理事会後に残りそうな宿題や継続確認事項を整理してください。`,
    },
    {
      key: 'boardBatch',
      title: '提出後フォローメモ',
      endpoint: `/api/properties/${id}/ai-board-report-batch`,
      basePrompt: `${propertyName}の理事会提出後、次に何を追うべきかが分かるフォローメモを作成してください。`,
    },
    {
      key: 'nextActions',
      title: '理事会後の次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の理事会後に優先して進めるべきアクションを順番付きで整理してください。`,
    },
    {
      key: 'managementBrief',
      title: '社内向け宿題共有',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}の理事会後に社内共有しておくべき宿題事項を短く整理してください。`,
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
        title="物件AI理事会宿題パック"
        description={`${propertyName}の理事会後に残る宿題、追いかけ事項、社内共有事項を一気に整理するパックです。`}
        tools={tools}
        featureList={[
          '理事会履歴管理',
          '理事会提出推奨アラート',
          '理事会報告ドラフト生成',
          'AI次アクション提案',
        ]}
        notePlaceholder="例：理事会後の宿題を漏れなく、役員宿題と管理会社宿題を分けたい、など"
      />
    </div>
  )
}