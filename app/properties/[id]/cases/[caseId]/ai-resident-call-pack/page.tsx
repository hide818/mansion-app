import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiResidentCallPackPage({
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
      title: '電話説明の叩き台',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民へ電話で説明しやすい文章を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '電話対応の方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、住民から電話が来た時の対応方針を提案してください。`,
    },
    {
      key: 'summary',
      title: '一言要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、電話前に確認する一言要約を作成してください。`,
    },
    {
      key: 'format',
      title: 'メモしやすい整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、電話対応メモとして使いやすい形へ整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-resident-notice-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          住民通知パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI住民電話対応パック"
        description={`${propertyName} / ${caseTitle} の住民電話対応で、説明・方針・確認メモをまとめて作るパックです。`}
        tools={tools}
        featureList={[
          'コピペ用テキスト出力',
          'AI文書整形',
          'AI対応提案',
          'AI理事会説明文生成',
          'AI要約',
        ]}
        notePlaceholder="例：電話口でそのまま言いやすい表現で、など"
      />
    </div>
  )
}