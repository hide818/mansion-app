import Link from 'next/link'
import { notFound } from 'next/navigation'
import GeneratedSectionCard from '@/app/components/GeneratedSectionCard'
import {
  buildManagerToneMemo,
  buildOneLineStatus,
  buildSimpleExplanation,
  getCaseDocumentBaseData,
} from '@/lib/caseDocumentData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function ManagerPackPage({ params }: PageProps) {
  const { id, caseId } = await params

  const data = await getCaseDocumentBaseData({
    propertyId: id,
    caseId,
  })

  if (!data) {
    notFound()
  }

  const managerMemoText = buildManagerToneMemo(data)
  const simpleExplanationText = buildSimpleExplanation(data)
  const oneLineText = buildOneLineStatus(data)

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
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          対応機能：
          案件一言ステータス表示 / 上司向け文体整形 / 案件説明文生成 / コピペ用テキスト出力
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          上司共有パック
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          上司報告や社内共有で、そのまま使える短文をまとめています。
        </p>
      </div>

      <GeneratedSectionCard title="上司共有用メモ" text={managerMemoText} />
      <GeneratedSectionCard title="案件のかんたん説明" text={simpleExplanationText} />
      <GeneratedSectionCard title="案件一言ステータス" text={oneLineText} />
    </div>
  )
}