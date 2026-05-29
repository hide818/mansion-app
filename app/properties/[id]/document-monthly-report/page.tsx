import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyAiToolClient from '@/app/components/PropertyAiToolClient'
import {
  buildPropertySnapshotText,
  getPropertySupportData,
} from '@/lib/propertySupportData'

export default async function PropertyDocumentMonthlyReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropertySupportData(id)

  if (!data) notFound()

  const snapshot = buildPropertySnapshotText(data)

  const defaultPrompt = [
    'あなたはマンション管理会社の実務担当です。',
    '次の物件情報をもとに、社内共有や役員共有でそのまま使いやすい月次報告ドラフトを日本語で作成してください。',
    '箇条書きだけで終わらず、実務で使える自然な文章にしてください。',
    '内容は、現状、最近の動き、注意点、次月に向けた動きが分かる形にしてください。',
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
        title="物件月次報告ドラフト"
        description="役員共有や社内の月次共有でそのまま叩き台にしやすい文章を作ります。"
        endpoint={`/api/properties/${id}/ai-monthly-report-board`}
        defaultPrompt={defaultPrompt}
        outputTitle="月次報告ドラフト"
        notePlaceholder="例：理事長向けにやわらかく、社内報告向けに少し短めで、など"
        bullets={[
          '月内の動きが短時間で伝わる形にする',
          '案件・クレーム・未完了タスクを自然に整理する',
          '次月に向けた注意点まで含める',
        ]}
      />
    </div>
  )
}