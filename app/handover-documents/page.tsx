import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type SearchParams = Promise<{
  propertyId?: string
  created?: string
  deleted?: string
}>

type HandoverRow = {
  id: string
  property_id: string | null
  basic_info: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '未設定'

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

function extractPropertyName(text: string | null) {
  if (!text) return '引き継ぎ書'

  const line = text
    .split('\n')
    .find((row) => row.includes('物件名') || row.includes('物件名：'))

  if (!line) return '引き継ぎ書'

  return line.replace('物件名：', '').replace('物件名:', '').trim() || '引き継ぎ書'
}

function displayPropertyName(name: string | null) {
  const text = (name ?? '').trim()
  return text || '無題物件'
}

function filterButtonClass(active: boolean) {
  if (active) {
    return 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition'
  }

  return 'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
}

export default async function HandoverDocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const propertyId = params?.propertyId ?? ''
  const created = params?.created === '1'
  const deleted = params?.deleted === '1'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: propertiesData } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const properties = (propertiesData ?? []) as PropertyRow[]
  const propertyNameMap = new Map<string, string>(
    properties.map((item) => [item.id, displayPropertyName(item.name)]),
  )

  let query = supabase
    .from('handover_documents')
    .select('id, property_id, basic_info, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">引き継ぎ一覧</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">
            引き継ぎ書の取得に失敗しました
          </h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const documents = (data ?? []) as HandoverRow[]

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">引き継ぎDX</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">引き継ぎ一覧</h1>
            <p className="mt-2 text-sm text-slate-600">
              保存済みの引き継ぎ書を一覧で確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/handover-documents/new"
              className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              引き継ぎ書を新規作成
            </Link>
          </div>
        </div>
      </section>

      {created ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">保存完了</p>
          <p className="mt-2 text-sm text-blue-700">
            引き継ぎ書を保存しました。
          </p>
        </section>
      ) : null}

      {deleted ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">削除完了</p>
          <p className="mt-2 text-sm text-slate-600">
            引き継ぎ書を削除しました。
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">物件で絞り込み</h2>
            <p className="mt-1 text-sm text-slate-600">
              必要な物件の引き継ぎ書だけに絞れます。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/handover-documents"
              className={filterButtonClass(!propertyId)}
            >
              すべて
            </Link>

            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/handover-documents?propertyId=${property.id}`}
                className={filterButtonClass(propertyId === property.id)}
              >
                {displayPropertyName(property.name)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">引き継ぎ書一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {documents.length}件
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            引き継ぎ書はまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {extractPropertyName(doc.basic_info)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        保存日時: {formatDateTime(doc.created_at)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        物件:{' '}
                        {doc.property_id
                          ? (propertyNameMap.get(doc.property_id) ?? '無題物件')
                          : '未設定'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/handover-documents/${doc.id}`}
                    className="text-sm font-medium text-slate-600 hover:underline"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}