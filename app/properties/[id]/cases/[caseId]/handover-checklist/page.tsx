import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import {
  daysSince,
  formatDate,
  getCaseSupportData,
} from '@/lib/caseSupportData'

type HandoverChecklistPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type ChecklistItem = {
  label: string
  ok: boolean
  note: string
}

function buildChecklist(data: Awaited<ReturnType<typeof getCaseSupportData>>) {
  const { caseItem, tasks, logs } = data

  const incompleteTasks = tasks.filter((task) => task.status !== '完了')
  const overdueTasks = incompleteTasks.filter((task) => {
    if (!task.due_date) return false
    return new Date(task.due_date).getTime() < new Date().getTime()
  })
  const noDueTasks = incompleteTasks.filter((task) => !task.due_date)
  const latestLogDays = logs[0] ? daysSince(logs[0].created_at) : null

  const items: ChecklistItem[] = [
    {
      label: '担当者が設定されている',
      ok: Boolean(caseItem.assignee),
      note: caseItem.assignee
        ? `担当者：${caseItem.assignee}`
        : '担当者が空欄です。',
    },
    {
      label: '未完了タスクに期限が入っている',
      ok: noDueTasks.length === 0,
      note:
        noDueTasks.length === 0
          ? '未完了タスクの期限は整理されています。'
          : `期限未設定タスクが ${noDueTasks.length} 件あります。`,
    },
    {
      label: '期限切れタスクが放置されていない',
      ok: overdueTasks.length === 0,
      note:
        overdueTasks.length === 0
          ? '期限切れタスクはありません。'
          : `期限切れタスクが ${overdueTasks.length} 件あります。`,
    },
    {
      label: '次アクションが明文化されている',
      ok: Boolean(caseItem.board_next_action),
      note: caseItem.board_next_action
        ? `次アクション：${caseItem.board_next_action}`
        : '次アクションが空欄です。',
    },
    {
      label: '直近ログが残っている',
      ok: latestLogDays !== null && latestLogDays <= 14,
      note:
        latestLogDays === null
          ? 'ログがありません。'
          : `最終ログから ${latestLogDays} 日経過しています。`,
    },
    {
      label: '理事会案件なら議案タイトルが入っている',
      ok:
        caseItem.board_status !== '上程予定' &&
        caseItem.board_status !== '提出予定'
          ? true
          : Boolean(caseItem.board_agenda_title),
      note:
        caseItem.board_status === '上程予定' || caseItem.board_status === '提出予定'
          ? caseItem.board_agenda_title
            ? `議案タイトル：${caseItem.board_agenda_title}`
            : '上程予定なのに議案タイトルが空欄です。'
          : '理事会案件ではないか、まだ上程前です。',
    },
  ]

  return items
}

function buildChecklistText(
  data: Awaited<ReturnType<typeof getCaseSupportData>>,
  items: ChecklistItem[]
) {
  const ngItems = items.filter((item) => !item.ok)
  const okCount = items.filter((item) => item.ok).length
  const ngCount = ngItems.length

  const lines = items
    .map((item) => {
      return `${item.ok ? '○' : '×'} ${item.label}：${item.note}`
    })
    .join('\n')

  const summary =
    ngCount === 0
      ? '引き継ぎ前チェックは概ね良好です。このまま担当変更しても事故リスクは低めです。'
      : `引き継ぎ前に ${ngCount} 件の要確認があります。先に整えてから渡した方が安全です。`

  return `【引き継ぎチェックリスト結果】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}
案件ステータス：${data.caseItem.status || '未設定'}

■ 結果まとめ
OK：${okCount} 件
要確認：${ngCount} 件

■ 総評
${summary}

■ 詳細
${lines}

■ 先に直した方がよい項目
${
  ngItems.length === 0
    ? '・特になし'
    : ngItems.map((item) => `・${item.label}`).join('\n')
}`
}

export default async function HandoverChecklistPage({
  params,
}: HandoverChecklistPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportData(id, caseId)
  const items = buildChecklist(data)
  const generatedText = buildChecklistText(data, items)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">引き継ぎチェックリスト</h1>
          <p className="mt-1 text-sm text-gray-600">
            渡していい状態かを、対応漏れ視点で先に確認します。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={generatedText} />
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`rounded-xl border p-4 ${
              item.ok ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">
                {item.ok ? '○ ' : '× '}
                {item.label}
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
          value={generatedText}
          className="min-h-[360px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">参考情報</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <div>最終ログ日：{data.logs[0] ? formatDate(data.logs[0].created_at) : '未登録'}</div>
          <div>
            未完了タスク数：
            {data.tasks.filter((task) => task.status !== '完了').length} 件
          </div>
        </div>
      </div>
    </div>
  )
}