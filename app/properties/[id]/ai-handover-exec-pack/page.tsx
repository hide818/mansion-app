import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getPropertyWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function PropertyAiHandoverExecPackPage({
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
      key: 'handover',
      title: '物件引き継ぎサマリー',
      endpoint: `/api/properties/${id}/ai-property-handover`,
      basePrompt: `${propertyName}の担当変更や休暇前に渡せる、実務的な引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'managementBrief',
      title: '引き継ぎ相手向け全体ブリーフ',
      endpoint: `/api/properties/${id}/ai-management-brief`,
      basePrompt: `${propertyName}を初見でもつかみやすいように、引き継ぎ相手向けの全体ブリーフを作成してください。`,
    },
    {
      key: 'logSummary',
      title: '最近の動き要約',
      endpoint: `/api/properties/${id}/ai-log-summary`,
      basePrompt: `${propertyName}の最近の動きを、引き継ぎ相手が流れをつかめるように要約してください。`,
    },
    {
      key: 'nextActions',
      title: '引き継ぎ後の次アクション',
      endpoint: `/api/properties/${id}/ai-property-next-actions`,
      basePrompt: `${propertyName}の引き継ぎ後、すぐやるべきアクションを優先順で整理してください。`,
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
          href={`/properties/${id}/handover-ai`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件引き継ぎAIへ
        </Link>
      </div>

      <MultiAiPackClient
        title="物件AI引き継ぎ実務パック"
        description={`${propertyName}の引き継ぎ・注意点整理・次アクションを一気に作るパックです。`}
        tools={tools}
        featureList={[
          'AI引き継ぎサマリー生成',
          '次回アクション表示',
          '注意点表示',
          '引き継ぎ報告書生成',
        ]}
        notePlaceholder="例：休暇代行向けに短め、担当変更向けに注意点を厚めに、など"
      />
    </div>
  )
}