import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiReportPolishPackPage({
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
      title: '報告のベース要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、報告のベースになる要約を作成してください。`,
    },
    {
      key: 'format',
      title: '報告文の整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、上司や理事会へ報告しやすい整った文面へ整形してください。`,
    },
    {
      key: 'minutes',
      title: '記録寄りの報告文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、記録としても残しやすい報告文を作成してください。`,
    },
    {
      key: 'boardExplanation',
      title: '口頭説明の補強',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-board-explanation`,
      basePrompt: `${propertyName}の「${caseTitle}」について、報告時の口頭説明を補強する文章を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-report-polish-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI報告磨き込みパック"
        description={`${propertyName} / ${caseTitle} の報告文を、提出しやすく読みやすい形まで磨き込むパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          '理事会報告ドラフト生成',
          'AI要約',
          'AI議事録生成',
        ]}
        notePlaceholder="例：上司提出向けに簡潔、でも理事会転用も少し意識、など"
      />
    </div>
  )
}