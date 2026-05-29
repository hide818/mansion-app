import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import { formatDate, getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type VendorRequestPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildVendorRequest(data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const targetTask = incompleteTasks[0]

  return `件名：${data.property.name || '対象物件'} ${data.caseItem.title || '案件名未設定'} の件

○○株式会社
○○様

いつもお世話になっております。
管理会社の担当です。

表題の件につきまして、${data.property.name || '対象物件'}にて「${data.caseItem.title || '案件名未設定'}」への対応を進めております。
つきましては、下記内容についてご対応またはご確認をお願いいたします。

【物件名】
${data.property.name || '未設定'}

【案件名】
${data.caseItem.title || '未設定'}

【現在の状況】
案件ステータスは「${data.caseItem.status || '未設定'}」です。

【お願いしたい内容】
${targetTask ? `・${targetTask.title || '未設定'}` : '・現地確認または必要対応のご提案'}

【希望時期】
${targetTask ? formatDate(targetTask.due_date) : 'ご都合の良い日程をご教示ください。'}

【補足】
${data.caseItem.board_next_action || '必要に応じて今後の進め方も含めてご提案をお願いいたします。'}

お手数をおかけいたしますが、何卒よろしくお願いいたします。`
}

export default async function VendorRequestPage({
  params,
}: VendorRequestPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildVendorRequest(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ワンクリック業者依頼文</h1>
          <p className="mt-1 text-sm text-gray-600">
            業者へ送る依頼文のたたき台をすぐ作れます。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={text} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <textarea
          readOnly
          value={text}
          className="min-h-[420px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}