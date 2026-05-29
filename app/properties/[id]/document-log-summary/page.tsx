import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentLogSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const defaultPrompt = [
    'あなたはマンション管理会社の担当者です。',
    '次の物件情報をもとに、最近のログや動きを短く整理した要約文を作成してください。',
    '単なる箇条書きの並びではなく、流れが分かるようにまとめてください。',
    '特に、最近何が起きて、今どこまで進み、何に注意すべきかが分かる文章にしてください。',
    '',
    snapshot,
  ].join('\n')

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/document-center`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          文書センターへ戻る
        </Link>
        <Link
          href={`/properties/${id}`}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          物件詳細へ戻る
        </Link>
      </div>

      <PropertyAiToolClient
        title="物件ログ要約文書"
        description="最近のログを短く整理して、何が起きているかを流れでつかめる文書を作ります。"
        endpoint={`/api/properties/${id}/ai-log-summary`}
        defaultPrompt={defaultPrompt}
        outputTitle="ログ要約文書"
        notePlaceholder="例：時系列を強めに、短めに、など"
        bullets={[
          '最近の動きを時系列でつかみやすくする',
          '長いログを共有しやすい形に圧縮する',
          '引き継ぎや会議前確認にも使いやすくする',
        ]}
      />
    </div>
  )
}