import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiDelayReportPackPage({
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
      title: '遅延状況の報告用要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、遅延状況を上司に報告しやすい形で要約してください。`,
    },
    {
      key: 'format',
      title: '上司報告向け整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、遅延報告として提出しやすい文面に整形してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '遅延回復の方針',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、遅延回復のための現実的な方針を提案してください。`,
    },
    {
      key: 'vendorRequest',
      title: '進捗催促の文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、進捗催促や確認に使う業者文面を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-delay-recovery-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          遅延回復パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI遅延報告パック"
        description={`${propertyName} / ${caseTitle} の遅延状況を上司へ報告しつつ、回復方針まで整えるパックです。`}
        tools={tools}
        featureList={[
          '案件の詰まり検知',
          '時間がかかりすぎている案件の検知',
          '上司向け文体整形',
          'AI文書整形',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：上司には短く、でも業者催促は強めにしたい、など"
      />
    </div>
  )
}