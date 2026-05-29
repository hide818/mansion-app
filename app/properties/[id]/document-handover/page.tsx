import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentHandoverPage({
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
    '次の物件情報をもとに、担当変更や休暇前にそのまま使える引き継ぎ報告書を作成してください。',
    '現在の状況、注意点、未完了事項、重要人物対応、次にやることが自然に伝わる文章にしてください。',
    '読む人が短時間でこの物件の空気感までつかめることを重視してください。',
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
        title="物件引き継ぎ報告書"
        description="担当交代や休暇前に、そのまま渡せる引き継ぎ文を作ります。"
        endpoint={`/api/properties/${id}/ai-property-handover`}
        defaultPrompt={defaultPrompt}
        outputTitle="引き継ぎ報告書"
        notePlaceholder="例：休暇中の代行者向けに、注意点を強めに、など"
        bullets={[
          '現状と未完了事項を短時間でつかめる形にする',
          '注意点や引っかかりやすい点を先に出す',
          '次にやることまで落とし込む',
        ]}
      />
    </div>
  )
}