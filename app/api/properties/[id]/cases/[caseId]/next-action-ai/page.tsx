import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseAiToolClient from '@/app/components/CaseAiToolClient'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type NextActionAiPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function NextActionAiPage({
  params,
}: NextActionAiPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI次アクション提案</h1>
          <p className="mt-1 text-sm text-gray-600">
            ログとタスクを見て、今やることを優先順で出します。
          </p>
        </div>

        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
        <div>物件：{data.property.name || '未設定'}</div>
        <div className="mt-1">案件：{data.caseItem.title || '未設定'}</div>
      </div>

      <CaseAiToolClient
        endpoint={`/api/properties/${id}/cases/${caseId}/ai-next-action`}
        title="AI次アクション提案"
        description="今すぐ動くべき内容、今日中、今週中、放置リスクまでまとめて出します。"
      />
    </div>
  )
}