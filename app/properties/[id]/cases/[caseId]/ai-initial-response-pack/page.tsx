import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiInitialResponsePackPage({
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
      title: '案件要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、初動判断のための短い案件要約を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '初動対応提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、最初に打つべき対応を実務順で提案してください。`,
    },
    {
      key: 'format',
      title: '社内共有文へ整形',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、社内共有で使いやすい整った文面にしてください。`,
    },
    {
      key: 'vendorRequest',
      title: '業者依頼の叩き台',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、必要ならすぐ送れる業者依頼文の叩き台を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          案件AIセンターへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI初動対応パック"
        description={`${propertyName} / ${caseTitle} の初動整理、社内共有、業者連絡まで一気に整えるパックです。`}
        tools={tools}
        featureList={[
          'AI対応提案',
          'AI文書整形',
          'ワンクリック業者依頼文',
          'AI要約',
        ]}
        notePlaceholder="例：まずは沈静化優先、スピード重視、角が立たない表現で、など"
      />
    </div>
  )
}