import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiStuckUnlockPackPage({
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
      title: '停滞理由の整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、どこで止まっているかが分かるように整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '解除アクション提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、停滞を解除するための現実的なアクションを提案してください。`,
    },
    {
      key: 'similarCases',
      title: '似た案件からの示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、似た案件の打開パターンを示してください。`,
    },
    {
      key: 'vendorRequest',
      title: '停滞解消の確認文',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、停滞解消に向けた確認文や催促文を作成してください。`,
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
          href={`/properties/${id}/cases/${caseId}/ai-stuck-unlock-pack`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI停滞解除パック"
        description={`${propertyName} / ${caseTitle} の停滞理由整理、解除アクション、確認文をまとめるパックです。`}
        tools={tools}
        featureList={[
          '案件の詰まり検知',
          '時間がかかりすぎている案件の検知',
          '次にやること自動表示',
          '停滞案件アラート',
          'おすすめアクション表示',
          'AI対応提案',
          'AI要約',
        ]}
        notePlaceholder="例：とにかく今週動かしたい、業者確認を優先、など"
      />
    </div>
  )
}