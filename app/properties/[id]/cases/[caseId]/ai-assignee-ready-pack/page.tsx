import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiAssigneeReadyPackPage({
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
      title: '案件引き継ぎサマリー',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、担当変更前提で、現況・注意点・未了事項が伝わる引き継ぎサマリーを作成してください。`,
    },
    {
      key: 'summary',
      title: '案件の短い要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、新担当者が最初に読む短い要約を作成してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '引き継ぎ後の初動',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、引き継ぎ後すぐやるべきことを提案してください。`,
    },
    {
      key: 'similarCases',
      title: '判断の補足メモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、新担当者が迷いにくいように判断の参考観点を出してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-handover-decision-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          引き継ぎ判断パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI担当変更準備パック"
        description={`${propertyName} / ${caseTitle} の担当変更前に、引き継ぎと初動整理をまとめるパックです。`}
        tools={tools}
        featureList={[
          '案件単位の引き継ぎサマリー',
          '担当変更時の専用画面',
          '注意点表示',
          'AI引き継ぎサマリー',
          'AI要約',
          'AI対応提案',
        ]}
        notePlaceholder="例：次担当が初見、判断ミスを減らしたい、など"
      />
    </div>
  )
}