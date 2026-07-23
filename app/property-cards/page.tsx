import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyCardsPageProps = {
  searchParams?: Promise<{
    q?: string
    pin?: string
    caution?: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
}

type PropertyCardRow = {
  id: string
  property_id: string | null
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeText(value: string | null | undefined) {
  return (value || '').toLowerCase()
}

function firstFilledString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

function getPinnedInfo(card: PropertyCardRow) {
  return firstFilledString([
    card.pinned_info,
    card.pin_info,
    card.important_info,
    card.pinnedMemo,
  ])
}

function getManagementMemo(card: PropertyCardRow) {
  return firstFilledString([
    card.management_memo,
    card.manager_memo,
    card.memo,
    card.managementMemo,
  ])
}

function getBoardMemo(card: PropertyCardRow) {
  return firstFilledString([
    card.board_memo,
    card.meeting_memo,
    card.director_memo,
    card.boardMemo,
  ])
}

function getCautionNotes(card: PropertyCardRow) {
  return firstFilledString([
    card.caution_notes,
    card.cautions,
    card.notice,
    card.warning_notes,
    card.cautionMemo,
  ])
}

function getExecutiveMemo(card: PropertyCardRow) {
  return firstFilledString([
    card.executive_memo,
    card.officer_memo,
    card.chairman_memo,
    card.role_memo,
    card.executiveMemo,
  ])
}

function hasText(value: string) {
  return value.trim().length > 0
}

export default async function PropertyCardsPage({
  searchParams,
}: PropertyCardsPageProps) {
  const params = searchParams ? await searchParams : {}

  const q = params?.q?.trim() || ''
  const pin = params?.pin?.trim() || 'all'
  const caution = params?.caution?.trim() || 'all'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (propertiesError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">物件情報の取得に失敗しました</h1>
          <p className="mt-3 text-sm text-red-700">
            properties テーブルの取得でエラーが出ています。
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-sm text-red-700">
            {propertiesError.message}
          </pre>
        </div>
      </div>
    )
  }

  const properties = (propertiesData ?? []) as PropertyRow[]
  const propertyIds = properties.map((property) => property.id)

  let cards: PropertyCardRow[] = []

  if (propertyIds.length > 0) {
    const { data: cardsData, error: cardsError } = await supabase
      .from('property_cards')
      .select('*')
      .in('property_id', propertyIds)
      .order('updated_at', { ascending: false })

    if (cardsError) {
      return (
        <div className="p-6">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h1 className="text-2xl font-bold text-red-700">物件カルテ一覧の取得に失敗しました</h1>
            <p className="mt-3 text-sm text-red-700">
              property_cards テーブルの取得でエラーが出ています。
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-sm text-red-700">
              {cardsError.message}
            </pre>
          </div>
        </div>
      )
    }

    cards = (cardsData ?? []) as PropertyCardRow[]
  }

  const propertyMap = new Map<string, PropertyRow>()
  for (const property of properties) {
    propertyMap.set(property.id, property)
  }

  let filteredCards = [...cards]

  if (q) {
    const keyword = q.toLowerCase()

    filteredCards = filteredCards.filter((card) => {
      const property = card.property_id ? propertyMap.get(card.property_id) : undefined
      const propertyName = normalizeText(property?.name)
      const address = normalizeText(property?.address)
      const pinnedInfo = normalizeText(getPinnedInfo(card))
      const managementMemo = normalizeText(getManagementMemo(card))
      const boardMemo = normalizeText(getBoardMemo(card))
      const cautionNotes = normalizeText(getCautionNotes(card))
      const executiveMemo = normalizeText(getExecutiveMemo(card))

      return (
        propertyName.includes(keyword) ||
        address.includes(keyword) ||
        pinnedInfo.includes(keyword) ||
        managementMemo.includes(keyword) ||
        boardMemo.includes(keyword) ||
        cautionNotes.includes(keyword) ||
        executiveMemo.includes(keyword)
      )
    })
  }

  if (pin === 'has_pin') {
    filteredCards = filteredCards.filter((card) => hasText(getPinnedInfo(card)))
  }

  if (caution === 'has_caution') {
    filteredCards = filteredCards.filter((card) => hasText(getCautionNotes(card)))
  }

  const totalCount = cards.length
  const pinCount = cards.filter((card) => hasText(getPinnedInfo(card))).length
  const cautionCount = cards.filter((card) => hasText(getCautionNotes(card))).length

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">物件カルテ管理</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              全物件カルテ一覧
            </h1>
            <p className="mt-3 text-base text-slate-600">
              全物件のカルテを横断して確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              物件一覧へ
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">全カルテ数</p>
            <p className="mt-3 text-5xl font-bold text-slate-900">{totalCount}</p>
          </div>

          <div className="rounded-3xl border border-blue-300 bg-blue-50 p-6 shadow-sm">
            <p className="text-sm text-blue-700">重要情報あり</p>
            <p className="mt-3 text-5xl font-bold text-blue-700">{pinCount}</p>
          </div>

          <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm text-amber-700">注意事項あり</p>
            <p className="mt-3 text-5xl font-bold text-amber-700">{cautionCount}</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">検索と絞り込み</h2>

          <form method="GET" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                キーワード検索
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="物件名・住所・カルテ内容で検索"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                重要情報
              </label>
              <select
                name="pin"
                defaultValue={pin}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                <option value="has_pin">ありのみ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                注意事項
              </label>
              <select
                name="caution"
                defaultValue={caution}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                <option value="has_caution">ありのみ</option>
              </select>
            </div>

            <div className="flex items-end gap-3 xl:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                検索する
              </button>

              <Link
                href="/property-cards"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">一覧</h2>
            <p className="text-sm text-slate-500">{filteredCards.length}件</p>
          </div>

          {filteredCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-base text-slate-600">
                条件に合う物件カルテはありません。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredCards.map((card) => {
                const property = card.property_id ? propertyMap.get(card.property_id) : undefined
                const propertyName = property?.name || '物件名未設定'
                const address = property?.address || '-'
                const pinnedInfo = getPinnedInfo(card)
                const managementMemo = getManagementMemo(card)
                const boardMemo = getBoardMemo(card)
                const cautionNotes = getCautionNotes(card)
                const executiveMemo = getExecutiveMemo(card)

                return (
                  <div
                    key={card.id}
                    className="rounded-3xl border border-slate-300 bg-slate-50 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold text-slate-900">
                            {propertyName}
                          </h3>

                          {hasText(pinnedInfo) ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              重要情報あり
                            </span>
                          ) : null}

                          {hasText(cautionNotes) ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              注意事項あり
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          住所：{address}
                          <span className="mx-2"> </span>
                          最終更新：{formatDateTime(card.updated_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {card.property_id ? (
                          <Link
                            href={`/properties/${card.property_id}`}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            物件詳細へ
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                            物件詳細へ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-semibold text-slate-500">重要情報ピン留め</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {pinnedInfo || '未登録'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-semibold text-slate-500">注意事項</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {cautionNotes || '未登録'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-semibold text-slate-500">管理メモ</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {managementMemo || '未登録'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-semibold text-slate-500">理事会メモ</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {boardMemo || '未登録'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5 lg:col-span-2">
                        <p className="text-sm font-semibold text-slate-500">理事長・役員対応メモ</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {executiveMemo || '未登録'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}