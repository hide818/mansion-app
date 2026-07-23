import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type ComplaintsPageProps = {
  searchParams?: Promise<{
    q?: string
    propertyId?: string
    status?: string
    repeat?: string
  }>
}

type ComplaintRow = {
  id: string
  property_id?: string | null
  company_id?: string | null
  created_at?: string | null
  [key: string]: unknown
}

type PropertyRow = {
  id: string
  name?: string | null
}

function getComplaintTitle(complaint: ComplaintRow) {
  const candidates = [
    complaint.title,
    complaint.subject,
    complaint.name,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return '件名未設定'
}

function getComplaintCategory(complaint: ComplaintRow) {
  const candidates = [
    complaint.category,
    complaint.type,
    complaint.kind,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return '-'
}

function getComplaintLocation(complaint: ComplaintRow) {
  const candidates = [
    complaint.location,
    complaint.place,
    complaint.occurred_place,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return '-'
}

function getComplaintPerson(complaint: ComplaintRow) {
  const candidates = [
    complaint.complainant,
    complaint.reporter,
    complaint.applicant,
    complaint.claimant,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return '-'
}

function getComplaintDetail(complaint: ComplaintRow) {
  const candidates = [
    complaint.detail,
    complaint.details,
    complaint.description,
    complaint.content,
    complaint.memo,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return ''
}

function getComplaintStatus(complaint: ComplaintRow) {
  const candidates = [
    complaint.status,
    complaint.response_status,
    complaint.progress_status,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return '未設定'
}

function isRepeatComplaint(complaint: ComplaintRow) {
  const candidates = [
    complaint.is_repeat,
    complaint.repeat_flag,
    complaint.is_recurring,
    complaint.repeated,
  ]

  for (const value of candidates) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
      if (normalized === '1') return true
      if (normalized === '0') return false
    }
    if (typeof value === 'number') {
      return value === 1
    }
  }

  return false
}

function formatDateTime(value?: string | null) {
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

function normalizeText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.toLowerCase()
}

export default async function ComplaintsPage({ searchParams }: ComplaintsPageProps) {
  const params = searchParams ? await searchParams : {}

  const q = params?.q?.trim() || ''
  const propertyId = params?.propertyId?.trim() || 'all'
  const status = params?.status?.trim() || 'all'
  const repeat = params?.repeat?.trim() || 'all'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: complaintsData, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (complaintsError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">クレーム一覧の取得に失敗しました</h1>
          <p className="mt-3 text-sm text-red-700">
            complaints テーブルの取得でエラーが出ています。
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-4 text-sm text-red-700">
            {complaintsError.message}
          </pre>
        </div>
      </div>
    )
  }

  if (propertiesError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">物件一覧の取得に失敗しました</h1>
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

  const complaints = (complaintsData ?? []) as ComplaintRow[]
  const properties = (propertiesData ?? []) as PropertyRow[]

  const propertyMap = new Map<string, string>()
  for (const property of properties) {
    propertyMap.set(property.id, property.name || '物件名未設定')
  }

  const uniqueStatuses = Array.from(
    new Set(
      complaints
        .map((complaint) => getComplaintStatus(complaint))
        .filter((value) => value && value !== '未設定')
    )
  )

  let filteredComplaints = [...complaints]

  if (q) {
    const keyword = q.toLowerCase()

    filteredComplaints = filteredComplaints.filter((complaint) => {
      const title = normalizeText(getComplaintTitle(complaint))
      const category = normalizeText(getComplaintCategory(complaint))
      const location = normalizeText(getComplaintLocation(complaint))
      const person = normalizeText(getComplaintPerson(complaint))
      const detail = normalizeText(getComplaintDetail(complaint))
      const propertyName = complaint.property_id
        ? normalizeText(propertyMap.get(complaint.property_id) || '')
        : ''

      return (
        title.includes(keyword) ||
        category.includes(keyword) ||
        location.includes(keyword) ||
        person.includes(keyword) ||
        detail.includes(keyword) ||
        propertyName.includes(keyword)
      )
    })
  }

  if (propertyId !== 'all') {
    filteredComplaints = filteredComplaints.filter(
      (complaint) => (complaint.property_id || '') === propertyId
    )
  }

  if (status !== 'all') {
    filteredComplaints = filteredComplaints.filter(
      (complaint) => getComplaintStatus(complaint) === status
    )
  }

  if (repeat === 'repeat_only') {
    filteredComplaints = filteredComplaints.filter((complaint) => isRepeatComplaint(complaint))
  }

  if (repeat === 'non_repeat_only') {
    filteredComplaints = filteredComplaints.filter((complaint) => !isRepeatComplaint(complaint))
  }

  const totalCount = complaints.length
  const repeatCount = complaints.filter((complaint) => isRepeatComplaint(complaint)).length
  const openLikeCount = complaints.filter((complaint) => {
    const value = getComplaintStatus(complaint)
    return value !== '完了' && value !== '解決済み' && value !== 'クローズ'
  }).length

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">クレーム管理</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              全クレーム一覧
            </h1>
            <p className="mt-3 text-base text-slate-600">
              全物件のクレームを横断して確認できます。
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
            <p className="text-sm text-slate-500">全クレーム数</p>
            <p className="mt-3 text-5xl font-bold text-slate-900">{totalCount}</p>
          </div>

          <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm text-amber-700">未解決っぽい件数</p>
            <p className="mt-3 text-5xl font-bold text-amber-700">{openLikeCount}</p>
          </div>

          <div className="rounded-3xl border border-rose-300 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm text-rose-700">再発クレーム数</p>
            <p className="mt-3 text-5xl font-bold text-rose-700">{repeatCount}</p>
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
                placeholder="件名・詳細・物件名・申出者などで検索"
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
                対応状況
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                {uniqueStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                再発フラグ
              </label>
              <select
                name="repeat"
                defaultValue={repeat}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="all">全部</option>
                <option value="repeat_only">再発のみ</option>
                <option value="non_repeat_only">再発以外のみ</option>
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
                href="/complaints"
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
            <p className="text-sm text-slate-500">{filteredComplaints.length}件</p>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-base text-slate-600">
                条件に合うクレームはありません。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredComplaints.map((complaint) => {
                const propertyName = complaint.property_id
                  ? propertyMap.get(complaint.property_id) || '物件名未設定'
                  : '物件未設定'

                const title = getComplaintTitle(complaint)
                const category = getComplaintCategory(complaint)
                const location = getComplaintLocation(complaint)
                const person = getComplaintPerson(complaint)
                const detail = getComplaintDetail(complaint)
                const currentStatus = getComplaintStatus(complaint)
                const repeatFlag = isRepeatComplaint(complaint)

                return (
                  <div
                    key={complaint.id}
                    className="rounded-3xl border border-slate-300 bg-slate-50 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>

                          <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {category}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              repeatFlag
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {repeatFlag ? '再発' : '通常'}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          物件名：{propertyName}
                          <span className="mx-2"> </span>
                          対応状況：{currentStatus}
                          <span className="mx-2"> </span>
                          発生場所：{location}
                          <span className="mx-2"> </span>
                          申出者：{person}
                          <span className="mx-2"> </span>
                          登録日時：{formatDateTime(complaint.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {complaint.property_id ? (
                          <Link
                            href={`/properties/${complaint.property_id}`}
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
                        <p className="text-sm font-semibold text-slate-500">詳細</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {detail || '詳細はありません。'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-semibold text-slate-500">確認ポイント</p>
                        <ul className="mt-2 space-y-2 text-sm leading-7 text-slate-700">
                          <li>・同物件での再発か確認</li>
                          <li>・対応状況の更新漏れがないか確認</li>
                          <li>・物件カルテや引き継ぎサマリーへの反映要否を確認</li>
                        </ul>
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