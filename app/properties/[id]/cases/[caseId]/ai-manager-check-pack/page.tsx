import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiManagerCheckPackPage({
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
      key: 'summary',
      title: '上司確認用の短い要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司確認に使う短い要約を作成してください。`,
    },
    {
      key: 'format',
      title: '提出用に整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司提出しやすい整った文面にしてください。`,
    },
    {
      key: 'responseSuggestion',
      title: '判断方針の提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司が判断しやすいように対応方針を提案してください。`,
    },
    {
      key: 'boardExplanation',
      title: '口頭説明用の文章',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司へ口頭説明しやすい文章を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-manager-report-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          上司報告パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI上司確認パック"
        description={`${propertyName} / ${caseTitle} を上司に見せる前提で、短く・判断しやすく整えるAIパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：部長向けに短く、口頭説明しやすい言い回しで、など"
      />
    </div>
  )
}