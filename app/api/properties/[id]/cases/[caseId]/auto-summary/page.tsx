import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseAiToolClient from '@/app/components/CaseAiToolClient'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type AutoSummaryPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AutoSummaryPage({
  params,
}: AutoSummaryPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI案件自動要約</h1>
          <p className="mt-1 text-sm text-gray-600">
            案件の要点、注意点、次の動きを読みやすく要約します。
          </p>
        </div>

        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <CaseAiToolClient
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-auto-summary`}
        title="AI案件自動要約"
        description="引き継ぎや社内共有でそのまま使える要約文を生成します。"
      />
    </div>
  )
}