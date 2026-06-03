import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { primaryButtonClass, secondaryButtonClass, smallButtonClass } from '@/app/components/ui/buttonStyles'

type SearchParams = Promise<{
  q?: string
  status?: string
}>

type PageProps = {
  searchParams: SearchParams
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  property_id: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_next_action: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getDecisionStatusClass(status: string | null) {
  if (status === '承認') return 'bg-green-50 border-green-200 text-green-700'
  if (status === '条件付き承認') return 'bg-blue-50 border-blue-200 text-blue-700'
  if (status === '継続審議') return 'bg-purple-50 border-purple-200 text-purple-700'
  if (status === '否決') return 'bg-red-50 border-red-200 text-red-700'
  if (status === '報告のみ') return 'bg-slate-50 border-slate-200 text-slate-700'
  return 'bg-slate-50 border-gray-200 text-slate-700'
}

export default async function BoardCasesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const keyword = String(params.q ?? '').trim()
  const boardStatusFilter = String(params.status ?? '').trim()

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: properties, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .returns<PropertyRow[]>()

  if (propertyError || !properties) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">理事会予定案件一覧</h1>
          <p className="mt-3 text-sm text-red-600">
            物件データの取得に失敗しました。
          </p>
        </div>
      </div>
    )
  }

  const propertyIds = properties.map((item) => item.id)
  const propertyNameMap = new Map(properties.map((item) => [item.id, item.name ?? '名称未設定']))

  let caseRows: CaseRow[] = []

  if (propertyIds.length > 0) {
    let query = supabase
      .from('cases')
      .select(
        'id, title, status, assignee, created_at, property_id, board_status, board_scheduled_for, board_agenda_title, board_decision_status, board_decision_date, board_next_action'
      )
      .in('property_id', propertyIds)
      .not('board_scheduled_for', 'is', null)
      .order('board_scheduled_for', { ascending: true })
      .order('created_at', { ascending: false })

    if (boardStatusFilter !== '') {
      query = query.eq('board_status', boardStatusFilter)
    }

    if (keyword !== '') {
      query = query.or(
        [
          `title.ilike.%${keyword}%`,
          `board_agenda_title.ilike.%${keyword}%`,
          `assignee.ilike.%${keyword}%`,
          `board_next_action.ilike.%${keyword}%`,
        ].join(',')
      )
    }

    const { data, error } = await query.returns<CaseRow[]>()

    if (!error && data) {
      caseRows = data
    }
  }

  const boardStatusOptions = [
    '上程候補',
    '上程準備中',
    '理事会提出予定',
    '継続審議',
    '承認済み',
    '否決',
  ]

  const totalCount = caseRows.length
  const preparedCount = caseRows.filter((item) => item.board_status === '上程準備中').length
  const scheduledCount = caseRows.filter((item) => item.board_status === '理事会提出予定').length
  const continuedCount = caseRows.filter((item) => item.board_status === '継続審議').length

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">理事会予定案件一覧</h1>
        <p className="mt-2 text-sm text-slate-600">
          理事会に出す予定の案件を、日付順でまとめて確認できます。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">登録件数</p>
          <p className="mt-2 text-2xl font-bold">{totalCount}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">上程準備中</p>
          <p className="mt-2 text-2xl font-bold">{preparedCount}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">理事会提出予定</p>
          <p className="mt-2 text-2xl font-bold">{scheduledCount}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">継続審議</p>
          <p className="mt-2 text-2xl font-bold">{continuedCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div>
            <label htmlFor="q" className="mb-2 block text-sm font-medium">
              検索
            </label>
            <input
              id="q"
              name="q"
              defaultValue={keyword}
              placeholder="案件名 / 議案タイトル / 担当者 / 次回対応"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium">
              議案ステータス
            </label>
            <select
              id="status"
              name="status"
              defaultValue={boardStatusFilter}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">すべて</option>
              {boardStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-max items-end justify-end gap-3">
            <button
              type="submit"
              className={primaryButtonClass}
            >
              絞り込む
            </button>

            <Link
              href="/board-cases"
              className={secondaryButtonClass}
            >
              リセット
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">一覧</h2>

        {caseRows.length === 0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
            該当する理事会予定案件はありません。
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {caseRows.map((item) => {
              const propertyName = item.property_id
                ? propertyNameMap.get(item.property_id) ?? '名称未設定'
                : '名称未設定'

              return (
                <div key={item.id} className="rounded-md border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.title ?? '無題案件'}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border px-3 py-1 text-sm text-slate-700">
                          理事会予定日：{formatDate(item.board_scheduled_for)}
                        </span>

                        <span className="rounded-full border px-3 py-1 text-sm text-slate-700">
                          議案ステータス：{item.board_status ?? '未設定'}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${getDecisionStatusClass(
                            item.board_decision_status
                          )}`}
                        >
                          決定結果：{item.board_decision_status ?? '未設定'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/properties/${item.property_id}/cases/${item.id}`}
                        className={smallButtonClass}
                      >
                        案件詳細
                      </Link>

                      <Link
                        href={`/properties/${item.property_id}/cases/${item.id}/board-settings`}
                        className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        理事会予定設定
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">議案タイトル</p>
                      <p className="mt-1 text-slate-900">
                        {item.board_agenda_title ?? '未設定'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">物件名</p>
                      <p className="mt-1 text-slate-900">{propertyName}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">担当者</p>
                      <p className="mt-1 text-slate-900">{item.assignee ?? '未設定'}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">決定日</p>
                      <p className="mt-1 text-slate-900">
                        {formatDate(item.board_decision_date)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">案件ステータス</p>
                      <p className="mt-1 text-slate-900">{item.status ?? '未設定'}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">作成日時</p>
                      <p className="mt-1 text-slate-900">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">次回対応方針</p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-900">
                        {item.board_next_action ?? '未設定'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">決定事項の有無</p>
                      <p className="mt-1 text-slate-900">
                        {item.board_decision_status ? '登録済み' : '未登録'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}