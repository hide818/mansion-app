import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentNextActionsPage({
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
    '次の物件情報をもとに、この物件で次にやるべきことを優先順で整理してください。',
    '対応漏れを防ぐことを最優先にし、急ぐもの、確認が必要なもの、保留にしてよいものを自然な文章でまとめてください。',
    '最終的に、すぐ着手すること、今週やること、少し先に回せることが分かる形にしてください。',
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
        title="物件次アクション整理文書"
        description="この物件で次にやるべきことを優先順で整理し、対応漏れを防ぎます。"
        endpoint={`/api/properties/${id}/ai-property-next-actions`}
        defaultPrompt={defaultPrompt}
        outputTitle="次アクション整理文書"
        notePlaceholder="例：理事会前に優先すべきことを厚めに、など"
        bullets={[
          '急ぐものを先に出す',
          '確認待ち・保留事項を分ける',
          'そのままタスク整理に移しやすくする',
        ]}
      />
    </div>
  )
}