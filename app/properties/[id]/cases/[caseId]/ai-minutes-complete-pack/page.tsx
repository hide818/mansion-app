import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiMinutesCompletePackPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params
  const data = await getCaseWorkbenchData(id, caseId)

  if (!data) notFound()

  const propertyName = data.property.name ?? '物件'
  const caseTitle = data.caseRow.title ?? '案件'

  const tools = [
    {
      key: 'agenda',
      title: '議案ドラフト',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-agenda`,
      basePrompt: `${propertyName}の「${caseTitle}」について、議事録作成前提で議案ドラフトを整えてください。`,
    },
    {
      key: 'minutes',
      title: '議事録ドラフト',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、理事会議事録ドラフトを作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '説明文補助',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、議事録の補助になる説明文を作成してください。`,
    },
    {
      key: 'format',
      title: '文書整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、議事録や報告文に転用しやすい整った文章にしてください。`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/board-minutes`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          議事録ページへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI議事録完成パック"
        description={`${propertyName} / ${caseTitle} の議案・議事録・整形までまとめて作るパックです。`}
        tools={tools}
        featureList={[
          'AI議事録生成',
          'AI議案生成',
          '理事会議事録作成機能',
          'AI文書整形',
        ]}
        notePlaceholder="例：正式文寄りに、決定事項が伝わりやすい形で、など"
      />
    </div>
  )
}