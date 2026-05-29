import Link from 'next/link'
import { notFound } from 'next/navigation'
import MultiAiPackClient from '@/app/components/MultiAiPackClient'
import { getCaseWorkbenchData } from '@/lib/aiWorkbenchLookup'

export default async function CaseAiDelayRecoveryPackPage({
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
      title: '遅延状況の整理',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-summary`,
      basePrompt: `${propertyName}の「${caseTitle}」について、どこで止まっているかが分かるように整理してください。`,
    },
    {
      key: 'responseSuggestion',
      title: '回復アクション提案',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-response-suggestion`,
      basePrompt: `${propertyName}の「${caseTitle}」について、遅延から回復するための現実的なアクションを順番付きで提案してください。`,
    },
    {
      key: 'similarCases',
      title: '詰まり解消の示唆',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-similar-cases`,
      basePrompt: `${propertyName}の「${caseTitle}」について、似た案件の詰まり解消に使えそうな観点を出してください。`,
    },
    {
      key: 'vendorRequest',
      title: '遅延確認の業者文面',
      endpoint: `/api/properties/${id}/cases/${caseId}/ai-vendor-request`,
      basePrompt: `${propertyName}の「${caseTitle}」について、遅延確認や進捗催促に使える業者向け文面を作成してください。`,
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
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 opacity-50 pointer-events-none"
        >
          現在のページ
        </Link>
      </div>

      <MultiAiPackClient
        title="案件AI遅延回復パック"
        description={`${propertyName} / ${caseTitle} の停滞理由、回復策、催促文面まで一気に整えるパックです。`}
        tools={tools}
        featureList={[
          '案件の詰まり検知',
          '時間がかかりすぎている案件の検知',
          '次にやること自動表示',
          '停滞案件アラート',
          'おすすめアクション表示',
          'AI次アクション提案',
          'AI対応提案',
        ]}
        notePlaceholder="例：相手を責めすぎない、でも今週中に動かしたい、など"
      />
    </div>
  )
}