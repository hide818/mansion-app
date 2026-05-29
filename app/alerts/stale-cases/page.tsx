import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
}

type LogRow = {
  case_id: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getDaysFromToday(value: string | null) {
  if (!value) return null

  const target = new Date(value)
  const today = new Date()

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  const diffMs = todayStart.getTime() - targetStart.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default async function StaleCasesPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, title, property_id, status, assignee, created_at')
    .eq('company_id', companyId)
    .neq('status', '完了')
    .order('created_at', { ascending: true })

  if (casesError) {
    console.error('stale cases page cases error:', casesError)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          長期停滞案件の取得に失敗しました。cases テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const caseIds = safeCases.map((item) => item.id)
  const propertyIds = Array.from(
    new Set(safeCases.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const [{ data: logs }, { data: properties }] = await Promise.all([
    caseIds.length > 0
      ? supabase
          .from('logs')
          .select('case_id, created_at')
          .eq('company_id', companyId)
          .in('case_id', caseIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as LogRow[] }),
    propertyIds.length > 0
      ? supabase.from('properties').select('id, name').in('id', propertyIds)
      : Promise.resolve({ data: [] as PropertyRow[] }),
  ])

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const latestLogMap = new Map<string, string>()
  ;((logs ?? []) as LogRow[]).forEach((item) => {
    if (!item.case_id || !item.created_at) return
    if (!latestLogMap.has(item.case_id)) {
      latestLogMap.set(item.case_id, item.created_at)
    }
  })

  const staleCases = safeCases
    .map((item) => {
      const lastActivityAt = latestLogMap.get(item.id) ?? item.created_at
      const staleDays = getDaysFromToday(lastActivityAt)

      return {
        ...item,
        lastActivityAt,
        staleDays,
      }
    })
    .filter((item) => (item.staleDays ?? 0) >= 14)
    .sort((a, b) => (b.staleDays ?? 0) - (a.staleDays ?? 0))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">長期停滞案件一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          最終更新の目安として、直近ログまたは作成日から14日以上動きがない案件を表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">停滞案件数</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900">{staleCases.length}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">判定基準</div>
          <div className="mt-2 text-sm font-medium text-gray-900">14日以上更新なし</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象</div>
          <div className="mt-2 text-sm font-medium text-gray-900">完了以外の案件</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          長期停滞案件
        </div>

        {staleCases.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">長期停滞案件はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">案件名</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">担当者</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">最終更新目安</th>
                  <th className="px-4 py-3 font-medium">停滞日数</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {staleCases.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題案件'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.assignee || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.status || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDateTime(item.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-yellow-800">
                      {item.staleDays ?? 0}日
                    </td>
                    <td className="px-4 py-3">
                      {item.property_id ? (
                        <Link
                          href={`/properties/${item.property_id}/cases/${item.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                        >
                          案件詳細へ
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">移動先なし</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}