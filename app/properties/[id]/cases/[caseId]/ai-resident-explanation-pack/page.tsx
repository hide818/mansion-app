import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiResidentExplanationPackPage({
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
      key: 'boardExplanation',
      title: '分かりやすい説明文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民や役員へ説明しやすい、分かりやすい文章を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '説明時の対応方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民説明時にぶれにくい対応方針を提案してください。`,
    },
    {
      key: 'format',
      title: '掲示・配布向け整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、掲示や配布にも流用しやすい文面に整えてください。`,
    },
    {
      key: 'summary',
      title: '短い状況要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、まず短く状況が伝わる要約を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-initial-response-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          初動対応パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI居住者説明パック"
        description={`${propertyName} / ${caseTitle} の説明文、対応方針、掲示向け整形をまとめて作るパックです。`}
        tools={tools}
        featureList={[
          'AI理事会説明文生成',
          'AI対応提案',
          'AI文書整形',
          'コピペ用テキスト出力',
        ]}
        notePlaceholder="例：専門用語を減らして、責任追及を受けにくい表現で、など"
      />
    </div>
  )
}