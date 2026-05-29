import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseAiToolClient from '@/app/components/CaseAiToolClient'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type TemplateSuggestionsPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function TemplateSuggestionsPage({
  params,
}: TemplateSuggestionsPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AIテンプレ提案</h1>
          <p className="mt-1 text-sm text-gray-600">
            この案件で使い回せる定型文を、用途別にまとめて出します。
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
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-template-suggestions`}
        title="AIテンプレ提案"
        description="社内共有、理事会報告、業者依頼などのコピペ用テンプレを生成します。"
      />
    </div>
  )
}