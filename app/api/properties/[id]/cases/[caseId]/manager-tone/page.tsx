import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseAiToolClient from '@/app/components/CaseAiToolClient'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type ManagerTonePageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function ManagerTonePage({
  params,
}: ManagerTonePageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI上司向け文体整形</h1>
          <p className="mt-1 text-sm text-gray-600">
            上司に報告しやすい文体へ自動で整えます。
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
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-manager-tone`}
        title="AI上司向け文体整形"
        description="長すぎず、状況・問題点・次アクションが伝わる社内共有文を生成します。"
      />
    </div>
  )
}