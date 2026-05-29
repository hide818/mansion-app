import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildCoverageCheckMemo,
  buildCoverageFixMemo,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function CoveragePackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const checkText = buildCoverageCheckMemo(data)
  const fixText = buildCoverageFixMemo(data)

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
          href={`/properties/${id}/cases/${caseId}/future-task-pack`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          未来タスク提案へ
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          対応抜けチェック機能 / 対応抜けチェック / おすすめアクション表示
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          対応抜けチェックパック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          担当漏れ、ログ不足、資料不足、期限切れを一気に見つけるためのページです。
        </p>
      </div>

      <GeneratedSectionCard title="対応抜けチェックシート" text={checkText} />
      <GeneratedSectionCard title="すぐ直すべきポイント" text={fixText} />
    </div>
  )
}