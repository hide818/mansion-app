import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type LogsPageProps = {
  searchParams?: Promise<{
    q?: string
    propertyId?: string
    type?: string
  }>
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
  type: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  assignee: string | null
  company_id?: string | null
}

type PropertyRow = {
  id: string
  name: string | null
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

function getLogTypeLabel(type: string | null) {
  if (!type) return '未設定'
  if (type === 'comment') return 'コメントログ'
  return type
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = searchParams ? await searchParams : {}

  const q = params?.q?.trim() || ''
  const propertyId = params?.propertyId?.trim() || 'all'
  const type = params?.type?.trim() || 'all'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .select('id, property_id, title, status, assignee, company_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (casesError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">案件情報の取得に失敗しました</h1>
          <p className="mt-3 text-sm text-red-700">
            cases テーブルの取得でエラーが出ています。
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-sm text-red-700">
            {casesError.message}
          </pre>
        </div>
      </div>
    )
  }

  const cases = (casesData ?? []) as CaseRow[]
  const caseIds = cases.map((item) => item.id)

  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name')
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

  let logs: LogRow[] = []

  if (caseIds.length > 0) {
    const { data: logsData, error: logsError } = await supabase
      .from('logs')
      .select('id, case_id, message, created_at, type')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false })

    if (logsError) {
      return (
        <div className="p-6">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h1 className="text-2xl font-bold text-red-700">ログ一覧の取得に失敗しました</h1>
            <p className="mt-3 text-sm text-red-700">
              logs テーブルの取得でエラーが出ています。
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-sm text-red-700">
              {logsError.message}
            </pre>
          </div>
        </div>
      )
    }

    logs = (logsData ?? []) as LogRow[]
  }

  const caseMap = new Map<string, CaseRow>()
  for (const item of cases) {
    caseMap.set(item.id, item)
  }

  const propertyMap = new Map<string, string>()
  for (const property of properties) {
    propertyMap.set(property.id, property.name || '物件名未設定')
  }

  const uniqueTypes = Array.from(
    new Set(logs.map((log) => log.type || '').filter((value) => value))
  )

  let filteredLogs = [...logs]

  if (q) {
    const keyword = q.toLowerCase()

    filteredLogs = filteredLogs.filter((log) => {
      const caseInfo = log.case_id ? caseMap.get(log.case_id) : undefined
      const propertyName =
        caseInfo?.property_id ? propertyMap.get(caseInfo.property_id) || '' : ''

      const messageText = normalizeText(log.message)
      const typeText = normalizeText(log.type)
      const caseTitleText = normalizeText(caseInfo?.title)
      const propertyText = normalizeText(propertyName)

      return (
        messageText.includes(keyword) ||
        typeText.includes(keyword) ||
        caseTitleText.includes(keyword) ||
        propertyText.includes(keyword)
      )
    })
  }

  if (propertyId !== 'all') {
    filteredLogs = filteredLogs.filter((log) => {
      const caseInfo = log.case_id ? caseMap.get(log.case_id) : undefined
      return (caseInfo?.property_id || '') === propertyId
    })
  }

  if (type !== 'all') {
    filteredLogs = filteredLogs.filter((log) => (log.type || '') === type)
  }

  const totalCount = logs.length
  const commentCount = logs.filter((log) => log.type === 'comment').length

  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const latestCount = logs.filter((log) => {
    if (!log.created_at) return false
    return new Date(log.created_at) >= threeDaysAgo
  }).length

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ログ管理</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              全ログ一覧
            </h1>
            <p className="mt-3 text-base text-slate-600">
              全案件のログを横断して確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cases"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              全案件一覧へ
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
            <p className="text-sm text-slate-500">全ログ数</p>
            <p className="mt-3 text-5xl font-bold text-slate-900">{totalCount}</p>
          </div>

          <div className="rounded-3xl border border-blue-300 bg-blue-50 p-6 shadow-sm">
            <p className="text-sm text-blue-700">コメントログ</p>
            <p className="mt-3 text-5xl font-bold text-blue-700">{commentCount}</p>
          </div>

          <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm text-emerald-700">直近3日ログ</p>
            <p className="mt-3 text-5xl font-bold text-emerald-700">{latestCount}</p>
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
                placeholder="ログ本文・案件名・物件名で検索"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                物件
              </label>
              <select
                name="propertyId"
                defaultValue={propertyId}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部の物件</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name || '物件名未設定'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                ログ種別
              </label>
              <select
                name="type"
                defaultValue={type}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                {uniqueTypes.map((value) => (
                  <option key={value} value={value}>
                    {getLogTypeLabel(value)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3 xl:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                検索する
              </button>

              <Link
                href="/logs"
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
            <p className="text-sm text-slate-500">{filteredLogs.length}件</p>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-base text-slate-600">
                条件に合うログはありません。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredLogs.map((log) => {
                const caseInfo = log.case_id ? caseMap.get(log.case_id) : undefined
                const propertyName =
                  caseInfo?.property_id
                    ? propertyMap.get(caseInfo.property_id) || '物件名未設定'
                    : '物件未設定'

                const caseTitle = caseInfo?.title || '案件名未設定'
                const logTypeLabel = getLogTypeLabel(log.type)

                const caseHref =
                  caseInfo?.property_id && caseInfo?.id
                    ? `/properties/${caseInfo.property_id}/cases/${caseInfo.id}`
                    : '#'

                return (
                  <div
                    key={log.id}
                    className="rounded-3xl border border-slate-300 bg-slate-50 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold text-slate-900">
                            {caseTitle}
                          </h3>

                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {logTypeLabel}
                          </span>

                          {caseInfo?.status ? (
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              {caseInfo.status}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          物件名：{propertyName}
                          <span className="mx-2"> </span>
                          担当者：{caseInfo?.assignee || '-'}
                          <span className="mx-2"> </span>
                          登録日時：{formatDateTime(log.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {caseInfo?.property_id && caseInfo?.id ? (
                          <Link
                            href={caseHref}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            案件詳細へ
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                            案件詳細へ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white p-5">
                      <p className="mb-2 text-sm font-semibold text-slate-500">ログ本文</p>
                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {log.message || '本文がありません。'}
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
