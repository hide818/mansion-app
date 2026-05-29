import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildHandoverReport,
  buildNextActionMemo,
  buildOneLineStatus,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function HandoverPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const handoverText = buildHandoverReport(data)
  const oneLineText = buildOneLineStatus(data)
  const nextActionText = buildNextActionMemo(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}/document-center`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件文書センターへ戻る
        </Link>
        <Link
          href={`/properties/${id}/handover-ai`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          物件引き継ぎAIへ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          引き継ぎ報告書生成 / 現在の状況要約 / 未完了タスク整理表示 / 次回アクション表示
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          引き継ぎパック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          担当変更や休み前の共有で、そのまま使いやすいセットです。
        </p>
      </div>

      <GeneratedSectionCard title="案件引き継ぎ報告書" text={handoverText} />
      <GeneratedSectionCard title="案件一言ステータス" text={oneLineText} />
      <GeneratedSectionCard title="次にやることメモ" text={nextActionText} />
    </div>
  )
}