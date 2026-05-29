import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  formatDate,
  formatDateTime,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function BoardPrintPage({ params }: PageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const recentLogs = data.logs.slice(0, 5)
  const estimateFiles = data.caseFiles.filter((file) => file.category === 'estimate')
  const photoFiles = data.caseFiles.filter((file) => file.category === 'photo')
  const otherFiles = data.caseFiles.filter(
    (file) => file.category !== 'estimate' && file.category !== 'photo'
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">理事会提出用まとめ表示</h1>
          <p className="mt-1 text-sm text-gray-600">
            ブラウザ印刷しやすいように、理事会向け情報をまとめています。
          </p>
        </div>

        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">案件基本情報</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-sm text-gray-500">物件名</div>
            <div className="font-semibold">{data.property.name || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">案件名</div>
            <div className="font-semibold">{data.caseItem.title || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">案件ステータス</div>
            <div className="font-semibold">{data.caseItem.status || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">担当者</div>
            <div className="font-semibold">{data.caseItem.assignee || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">理事会ステータス</div>
            <div className="font-semibold">{data.caseItem.board_status || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">上程予定</div>
            <div className="font-semibold">{data.caseItem.board_scheduled_for || '未設定'}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">議案情報</h2>
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-sm text-gray-500">議案タイトル</div>
            <div className="font-semibold">
              {data.caseItem.board_agenda_title || data.caseItem.title || '未設定'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">次アクション</div>
            <div className="leading-7">
              {data.caseItem.board_next_action || '未設定'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">決定状況</div>
            <div className="leading-7">
              {data.caseItem.board_decision_status || '未設定'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">決定日</div>
            <div className="leading-7">{formatDate(data.caseItem.board_decision_date)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">決定メモ</div>
            <div className="leading-7">
              {data.caseItem.board_decision_note || '未設定'}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">未完了タスク</h2>
        <div className="mt-4 space-y-3">
          {incompleteTasks.length === 0 ? (
            <div className="text-sm text-gray-600">未完了タスクはありません。</div>
          ) : (
            incompleteTasks.slice(0, 10).map((task) => (
              <div key={task.id} className="rounded-lg border p-3">
                <div className="font-semibold">{task.title || '未設定'}</div>
                <div className="mt-1 text-sm text-gray-600">
                  状態：{task.status || '未設定'} / 優先度：{task.priority || '未設定'} / 期限：
                  {formatDate(task.due_date)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">最近の履歴</h2>
        <div className="mt-4 space-y-3">
          {recentLogs.length === 0 ? (
            <div className="text-sm text-gray-600">関連ログはありません。</div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <div className="text-sm text-gray-500">{formatDateTime(log.created_at)}</div>
                <div className="mt-1 text-sm leading-7">
                  {(log.message || '').replace(/\s+/g, ' ').trim() || '内容未入力'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">添付資料</h2>

        <div className="mt-4">
          <h3 className="font-semibold">見積資料</h3>
          <div className="mt-2 space-y-2">
            {estimateFiles.length === 0 ? (
              <div className="text-sm text-gray-600">見積資料はありません。</div>
            ) : (
              estimateFiles.map((file) => (
                <div key={file.id} className="rounded-lg border p-3 text-sm">
                  {file.file_name || '未設定'}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">写真資料</h3>
          <div className="mt-2 space-y-2">
            {photoFiles.length === 0 ? (
              <div className="text-sm text-gray-600">写真資料はありません。</div>
            ) : (
              photoFiles.map((file) => (
                <div key={file.id} className="rounded-lg border p-3 text-sm">
                  {file.file_name || '未設定'}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">その他資料</h3>
          <div className="mt-2 space-y-2">
            {otherFiles.length === 0 ? (
              <div className="text-sm text-gray-600">その他資料はありません。</div>
            ) : (
              otherFiles.map((file) => (
                <div key={file.id} className="rounded-lg border p-3 text-sm">
                  {file.file_name || '未設定'}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}