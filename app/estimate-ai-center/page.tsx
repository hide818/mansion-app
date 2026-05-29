import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
  created_at: string | null
}

type CaseRow = {
  id: string
  property_id: string
  title: string | null
  status: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getStatusLabel(status: string | null) {
  const normalized = (status ?? '').trim()
  return normalized || '未設定'
}

function getStatusClassName(status: string | null) {
  const normalized = (status ?? '').toLowerCase()

  if (
    normalized.includes('done') ||
    normalized.includes('complete') ||
    normalized.includes('完了')
  ) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (
    normalized.includes('hold') ||
    normalized.includes('pending') ||
    normalized.includes('保留')
  ) {
    return 'border border-amber-200 bg-amber-50 text-amber-700'
  }

  if (
    normalized.includes('urgent') ||
    normalized.includes('炎上') ||
    normalized.includes('注意')
  ) {
    return 'border border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border border-slate-200 bg-slate-100 text-slate-700'
}

export default async function EstimateAiCenterEntryPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.18em] text-slate-400">
            AI見積比較センター
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            会社情報を確認できませんでした
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            まずログイン状態と所属会社の設定を確認してください。
          </p>
        </div>
      </div>
    )
  }

  const { data: propertiesData } = await supabase
    .from('properties')
    .select('id, name, address, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const properties = (propertiesData ?? []) as PropertyRow[]
  const propertyIds = properties.map((property) => property.id)

  let cases: CaseRow[] = []

  if (propertyIds.length > 0) {
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, property_id, title, status, created_at')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })

    cases = (caseData ?? []) as CaseRow[]
  }

  const casesByProperty = new Map<string, CaseRow[]>()

  for (const property of properties) {
    casesByProperty.set(property.id, [])
  }

  for (const caseItem of cases) {
    const current = casesByProperty.get(caseItem.property_id) ?? []
    current.push(caseItem)
    casesByProperty.set(caseItem.property_id, current)
  }

  const totalCaseCount = cases.length
  const propertiesWithCases = properties.filter((property) => {
    const propertyCases = casesByProperty.get(property.id) ?? []
    return propertyCases.length > 0
  }).length

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-emerald-600">
                AI見積比較センター
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                見積比較を始める案件を選ぶ
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                ここは入口ページです。サイドバーから来ても、物件一覧に丸投げせず、
                この画面で物件と案件を選んだら、そのまま見積比較へ入れます。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                  管理中物件
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {properties.length}件
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                  案件総数
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {totalCaseCount}件
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                  比較候補物件
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {propertiesWithCases}件
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-bold text-emerald-700">1. 物件を選ぶ</div>
              <p className="mt-2 text-sm leading-6 text-emerald-700">
                まず比較したい見積のある物件を見つけます。
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-sm font-bold text-sky-700">2. 案件を選ぶ</div>
              <p className="mt-2 text-sm leading-6 text-sky-700">
                その物件の案件カードから比較対象を選びます。
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-sm font-bold text-violet-700">3. そのまま開始</div>
              <p className="mt-2 text-sm leading-6 text-violet-700">
                ワンクリックでAI見積比較ページへ入れます。
              </p>
            </div>
          </div>
        </section>

        {properties.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              まだ物件がありません
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              先に物件を登録すると、ここから案件を選んで見積比較へ進めます。
            </p>
            <div className="mt-6">
              <Link
                href="/properties"
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                物件一覧へ
              </Link>
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            {properties.map((property) => {
              const propertyCases = (casesByProperty.get(property.id) ?? []).slice(0, 6)

              return (
                <article
                  key={property.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                        物件
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        {property.name ?? '名称未設定'}
                      </h2>
                      <div className="mt-3 space-y-1 text-sm text-slate-500">
                        <div>住所: {property.address ?? '未設定'}</div>
                        <div>登録日: {formatDate(property.created_at)}</div>
                        <div>案件数: {casesByProperty.get(property.id)?.length ?? 0}件</div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/properties/${property.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        物件詳細
                      </Link>
                      <Link
                        href={`/properties/${property.id}/cases`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        案件一覧
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        見積比較の候補案件
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        この中から選ぶと、そのままAI見積比較センターへ入れます。
                      </p>
                    </div>

                    {propertyCases.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-5">
                        <div className="text-sm font-semibold text-slate-700">
                          この物件にはまだ案件がありません
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          まず案件一覧へ移動して、見積比較したい案件を確認してください。
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/properties/${property.id}/cases`}
                            className="inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            この物件の案件一覧へ
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {propertyCases.map((caseItem) => (
                          <div
                            key={caseItem.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-lg font-bold text-slate-900">
                                  {caseItem.title ?? '案件名未設定'}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(caseItem.status)}`}
                                  >
                                    {getStatusLabel(caseItem.status)}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    作成日: {formatDate(caseItem.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <Link
                                href={`/properties/${property.id}/cases/${caseItem.id}/estimate-ai-center`}
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                この案件で見積比較
                              </Link>
                              <Link
                                href={`/properties/${property.id}/cases/${caseItem.id}`}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                案件詳細
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}