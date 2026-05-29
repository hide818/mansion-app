import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiCloseReportPackPage({
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
      title: '完了報告用 要約',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了報告として提出しやすい短い要約を作成してください。`,
    },
    {
      key: 'format',
      title: '完了報告の整形版',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-format`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了報告書として見やすい文面へ整形してください。`,
    },
    {
      key: 'caseHandover',
      title: '完了後の引き継ぎメモ',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-case-handover`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了後に見返せる引き継ぎメモを作成してください。`,
    },
    {
      key: 'minutes',
      title: '記録保存用 補強文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-minutes`,
      basePrompt: `${propertyName}の「${caseTitle}」について、完了記録として残しやすい補強文を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-close-approval-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          完了承認パックへ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI完了報告完成パック"
        description={`${propertyName} / ${caseTitle} の完了報告、引き継ぎ保存、記録補強をまとめて整えるパックです。`}
        tools={tools}
        featureList={[
          '上司向け文体整形',
          'AI文書整形',
          '案件単位の引き継ぎサマリー',
          'AI要約',
          'AI議事録生成',
        ]}
        notePlaceholder="例：上司提出向けに短く、でも後で見返せる情報は残したい、など"
      />
    </div>
  )
}