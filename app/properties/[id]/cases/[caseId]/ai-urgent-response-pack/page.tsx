import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiUrgentResponsePackPage({
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
      title: '緊急状況の一言整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、緊急時に一読で分かる短い状況整理を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '緊急対応アクション',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、緊急時の初動アクションを実務順で提案してください。`,
    },
    {
      key: 'vendorRequest',
      title: '至急連絡の文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、至急確認や至急対応依頼に使う業者向け文面を作成してください。`,
    },
    {
      key: 'format',
      title: '社内緊急共有文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、社内緊急共有に使いやすい文面へ整形してください。`,
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
        title="案件AI緊急対応パック"
        description={`${propertyName} / ${caseTitle} の緊急初動、社内共有、業者連絡をすぐ出すためのパックです。`}
        tools={tools}
        featureList={[
          '注意メッセージ表示',
          'おすすめアクション表示',
          'AI対応提案',
          'AI文書整形',
          'AI要約',
        ]}
        notePlaceholder="例：夜間対応想定、まず安全確保優先、など"
      />
    </div>
  )
}