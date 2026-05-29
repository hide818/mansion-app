import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildFutureTaskDraft,
  buildTodayActionMemo,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function FutureTaskPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const futureTaskText = buildFutureTaskDraft(data)
  const todayText = buildTodayActionMemo(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/coverage-pack`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          対応抜けチェックへ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          未来のタスク自動生成 / 次にやること提案 / 今日やること自動抽出
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          未来タスク提案パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          次に詰まりそうなポイントを先回りして、タスクたたき台を作ります。
        </p>
      </div>

      <GeneratedSectionCard title="未来タスクたたき台" text={futureTaskText} />
      <GeneratedSectionCard title="今日やることメモ" text={todayText} />
    </div>
  )
}