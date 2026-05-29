import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  daysSince,
  formatDate,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type CoverageCheckPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type CheckItem = {
  title: string
  ok: boolean
  note: string
}

function buildCheckItems(data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const overdueTasks = incompleteTasks.filter((task) => {
    if (!task.due_date) return false
    return new Date(task.due_date).getTime() < new Date().getTime()
  })
  const noDueTasks = incompleteTasks.filter((task) => !task.due_date)
  const lastLogDays = data.logs[0] ? daysSince(data.logs[0].created_at) : null

  const items: CheckItem[] = [
    {
      title: '担当者が入っている',
      ok: Boolean(data.caseItem.assignee),
      note: data.caseItem.assignee
        ? `担当者：${data.caseItem.assignee}`
        : '担当者が未設定です。',
    },
    {
      title: '次アクションが明文化されている',
      ok: Boolean(data.caseItem.board_next_action),
      note: data.caseItem.board_next_action
        ? `次アクション：${data.caseItem.board_next_action}`
        : '次アクションが空欄です。',
    },
    {
      title: '未完了タスクに期限が入っている',
      ok: noDueTasks.length === 0,
      note:
        noDueTasks.length === 0
          ? '期限未設定タスクはありません。'
          : `期限未設定タスクが ${noDueTasks.length} 件あります。`,
    },
    {
      title: '期限切れタスクが放置されていない',
      ok: overdueTasks.length === 0,
      note:
        overdueTasks.length === 0
          ? '期限切れタスクはありません。'
          : `期限切れタスクが ${overdueTasks.length} 件あります。`,
    },
    {
      title: '最近のログが残っている',
      ok: lastLogDays !== null && lastLogDays <= 14,
      note:
        lastLogDays === null
          ? 'ログがありません。'
          : `最終ログから ${lastLogDays} 日経過しています。`,
    },
    {
      title: '理事会予定時に議案タイトルが入っている',
      ok:
        data.caseItem.board_status !== '上程予定' &&
        data.caseItem.board_status !== '提出予定'
          ? true
          : Boolean(data.caseItem.board_agenda_title),
      note:
        data.caseItem.board_status === '上程予定' ||
        data.caseItem.board_status === '提出予定'
          ? data.caseItem.board_agenda_title
            ? `議案タイトル：${data.caseItem.board_agenda_title}`
            : '上程予定なのに議案タイトルが未入力です。'
          : 'まだ上程予定ではありません。',
    },
  ]

  return items
}

function buildText(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>,
  items: CheckItem[]
) {
  const ngItems = items.filter((item) => !item.ok)

  return `【対応抜けチェック】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}
案件ステータス：${data.caseItem.status || '未設定'}

${items
  .map((item) => `${item.ok ? '○' : '×'} ${item.title}：${item.note}`)
  .join('\n')}

■ 先に直したい項目
${
  ngItems.length === 0
    ? '・特になし'
    : ngItems.map((item) => `・${item.title}`).join('\n')
}

■ 補足
未完了タスク数：${data.tasks.filter((task) => task.status !== '完了').length} 件
最も近い期限：${
    data.tasks.find((task) => task.status !== '完了' && task.due_date)
      ? formatDate(
          data.tasks.find((task) => task.status !== '完了' && task.due_date)?.due_date || null
        )
      : '未設定'
  }`
}

export default async function CoverageCheckPage({
  params,
}: CoverageCheckPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const items = buildCheckItems(data)
  const text = buildText(data, items)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">対応抜けチェック</h1>
          <p className="mt-1 text-sm text-gray-600">
            事故りやすい抜けを先に見つけるための確認画面です。
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

      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item.title}
            className={`rounded-xl border p-4 ${
              item.ok ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">
                {item.ok ? '○ ' : '× '}
                {item.title}
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.ok
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {item.ok ? 'OK' : '要確認'}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-700">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">コピペ用まとめ</h2>
        <textarea
          readOnly
          value={text}
          className="min-h-[320px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}