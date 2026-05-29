import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiHandoverQuickPackPage({
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
      key: 'caseHandover',
      title: 'クイック引き継ぎ文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、短時間で読めるクイック引き継ぎ文を作成してください。`,
    },
    {
      key: 'summary',
      title: '一言要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、最初に読む一言要約を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '引き継ぎ後の初動',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、引き継ぎ後すぐやるべきことを提案してください。`,
    },
    {
      key: 'format',
      title: '読みやすい整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、引き継ぎ文を読みやすく整形してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-assignee-ready-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          担当変更準備パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AIクイック引き継ぎパック"
        description={`${propertyName} / ${caseTitle} を短時間で引き継ぐための軽量パックです。`}
        tools={tools}
        featureList={[
          '案件単位の引き継ぎサマリー',
          '注意点表示',
          'AI引き継ぎサマリー',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：休暇前に5分で渡したい、など"
      />
    </div>
  )
}