import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildBoardSettingCheck(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>
) {
  const items = [
    {
      label: '理事会ステータス',
      value: data.caseItem.board_status || '未設定',
      ok: Boolean(data.caseItem.board_status),
      note: data.caseItem.board_status ? '入力済みです。' : '未設定です。',
    },
    {
      label: '上程予定',
      value: data.caseItem.board_scheduled_for || '未設定',
      ok: Boolean(data.caseItem.board_scheduled_for),
      note: data.caseItem.board_scheduled_for ? '入力済みです。' : '未設定です。',
    },
    {
      label: '議案タイトル',
      value: data.caseItem.board_agenda_title || '未設定',
      ok: Boolean(data.caseItem.board_agenda_title),
      note: data.caseItem.board_agenda_title ? '入力済みです。' : '未設定です。',
    },
    {
      label: '決定状況',
      value: data.caseItem.board_decision_status || '未設定',
      ok: Boolean(data.caseItem.board_decision_status),
      note: data.caseItem.board_decision_status ? '入力済みです。' : '未設定です。',
    },
    {
      label: '次アクション',
      value: data.caseItem.board_next_action || '未設定',
      ok: Boolean(data.caseItem.board_next_action),
      note: data.caseItem.board_next_action ? '入力済みです。' : '未設定です。',
    },
  ]

  const missing = items.filter((item) => !item.ok)

  const text = `【理事会設定確認】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}

${items
  .map((item) => `${item.ok ? '○' : '×'} ${item.label}：${item.value}`)
  .join('\n')}

■ 先に埋めたい項目
${
  missing.length === 0
    ? '・主要項目は揃っています。'
    : missing.map((item) => `・${item.label}`).join('\n')
}`

  return { items, text }
}

export default async function BoardSettingsPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const result = buildBoardSettingCheck(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">理事会ステータス管理の見える化</h1>
          <p className="mt-1 text-sm text-gray-600">
            理事会対応に必要な項目が埋まっているか、ひと目で確認できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={result.text} />
        </div>
      </div>

      <div className="grid gap-4">
        {result.items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${
              item.ok ? 'bg-green-50' : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{item.label}</div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.ok ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}
              >
                {item.ok ? '入力済み' : '未入力'}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-700">{item.value}</div>
            <div className="mt-2 text-xs text-gray-500">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">コピペ用まとめ</h2>
        <textarea
          readOnly
          value={result.text}
          className="min-h-[260px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}