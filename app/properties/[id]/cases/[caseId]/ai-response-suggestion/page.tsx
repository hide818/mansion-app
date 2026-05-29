import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseAiToolClient from '@/app/components/CaseAiToolClient'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResponseSuggestionPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI対応提案</h1>
          <p className="mt-1 text-sm text-gray-600">
            今この案件で優先すべき動きを、AIが実務寄りに提案します。
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
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-response-suggestion`}
        title="AI対応提案"
        description="今の案件判断、優先対応、相手待ちを減らす打ち手まで出します。"
      />
    </div>
  )
}