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

export default async function AiBoardExplanationPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI理事会説明文生成</h1>
          <p className="mt-1 text-sm text-gray-600">
            理事会で説明する時の話し方を、そのまま使える形で作ります。
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
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-board-explanation`}
        title="AI理事会説明文生成"
        description="理事会での口頭説明、短く言う版、確認ポイントまでまとめます。"
      />
    </div>
  )
}