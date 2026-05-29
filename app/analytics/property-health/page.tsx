import Link from 'next/link'
import { redirect } from 'next/navigation'
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
  property_id: string | null
  status: string | null
  assignee: string | null
}

type TaskRow = {
  id: string
  property_id: string | null
  status: string | null
  due_date: string | null
}

type ComplaintRow = {
  id: string
  property_id: string | null
  status: string | null
}

type CardRow = {
  id: string
  property_id: string | null
  updated_at?: string | null
  created_at?: string | null
}

function healthLabel(score: number) {
  if (score >= 80) return '良好'
  if (score >= 60) return '注意'
  return '要改善'
}

function healthBadgeClass(score: number) {
  if (score >= 80) return 'bg-green-50 text-green-800 border-green-200'
  if (score >= 60) return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  return 'bg-red-50 text-red-800 border-red-200'
}

export default async function PropertyHealthPage() {
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

  const [{ data: properties, error: propertiesError }, { data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: complaints, error: complaintsError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase
        .from('properties')
        .select('id, name, address, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true }),
      supabase
        .from('cases')
        .select('id, property_id, status, assignee')
        .eq('company_id', companyId),
      supabase
        .from('tasks')
        .select('id, property_id, status, due_date')
        .eq('company_id', companyId),
      supabase
        .from('complaints')
        .select('id, property_id, status')
        .eq('company_id', companyId),
      supabase
        .from('property_cards')
        .select('id, property_id, created_at, updated_at')
        .eq('company_id', companyId),
    ])

  if (propertiesError || casesError || tasksError || complaintsError || cardsError) {
    console.error('property health page error:', {
      propertiesError,
      casesError,
      tasksError,
      complaintsError,
      cardsError,
    })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          物件健康スコアの取得に失敗しました。properties / cases / tasks / complaints / property_cards を確認してください。
        </div>
      </div>
    )
  }

  const safeProperties = (properties ?? []) as PropertyRow[]
  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeComplaints = (complaints ?? []) as ComplaintRow[]
  const safeCards = (cards ?? []) as CardRow[]

  const caseCountMap = new Map<string, number>()
  const openCaseCountMap = new Map<string, number>()
  const unassignedCaseCountMap = new Map<string, number>()
  const taskCountMap = new Map<string, number>()
  const overdueTaskCountMap = new Map<string, number>()
  const complaintCountMap = new Map<string, number>()
  const cardCountMap = new Map<string, number>()

  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  safeCases.forEach((item) => {
    if (!item.property_id) return
    caseCountMap.set(item.property_id, (caseCountMap.get(item.property_id) ?? 0) + 1)

    if (item.status !== '完了') {
      openCaseCountMap.set(item.property_id, (openCaseCountMap.get(item.property_id) ?? 0) + 1)
    }

    if (!item.assignee) {
      unassignedCaseCountMap.set(item.property_id, (unassignedCaseCountMap.get(item.property_id) ?? 0) + 1)
    }
  })

  safeTasks.forEach((item) => {
    if (!item.property_id) return
    taskCountMap.set(item.property_id, (taskCountMap.get(item.property_id) ?? 0) + 1)

    if (item.status !== '完了' && item.due_date && item.due_date < todayText) {
      overdueTaskCountMap.set(item.property_id, (overdueTaskCountMap.get(item.property_id) ?? 0) + 1)
    }
  })

  safeComplaints.forEach((item) => {
    if (!item.property_id) return
    complaintCountMap.set(item.property_id, (complaintCountMap.get(item.property_id) ?? 0) + 1)
  })

  safeCards.forEach((item) => {
    if (!item.property_id) return
    cardCountMap.set(item.property_id, (cardCountMap.get(item.property_id) ?? 0) + 1)
  })

  const rows = safeProperties
    .map((item) => {
      const openCases = openCaseCountMap.get(item.id) ?? 0
      const overdueTasks = overdueTaskCountMap.get(item.id) ?? 0
      const complaints = complaintCountMap.get(item.id) ?? 0
      const unassignedCases = unassignedCaseCountMap.get(item.id) ?? 0
      const hasCard = (cardCountMap.get(item.id) ?? 0) > 0

      let score = 100

      score -= openCases * 3
      score -= overdueTasks * 8
      score -= complaints * 5
      score -= unassignedCases * 6

      if (!hasCard) {
        score -= 10
      }

      if (score < 0) score = 0

      const reasons: string[] = []
      if (openCases > 0) reasons.push(`進行中案件${openCases}件`)
      if (overdueTasks > 0) reasons.push(`期限切れタスク${overdueTasks}件`)
      if (complaints > 0) reasons.push(`クレーム${complaints}件`)
      if (unassignedCases > 0) reasons.push(`担当未設定案件${unassignedCases}件`)
      if (!hasCard) reasons.push('物件カルテ未登録')

      return {
        ...item,
        score,
        label: healthLabel(score),
        reasons,
        openCases,
        overdueTasks,
        complaints,
        unassignedCases,
        hasCard,
      }
    })
    .sort((a, b) => a.score - b.score)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">物件健康スコア</h1>
        <p className="mt-2 text-sm text-gray-600">
          進行中案件、期限切れタスク、クレーム、担当未設定案件、物件カルテ有無を元に、物件ごとの健康スコアを表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象物件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">低スコアほど要確認</div>
          <div className="mt-2 text-sm font-medium text-yellow-900">下に行くほど危険ではなく、上が要注意です</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">用途</div>
          <div className="mt-2 text-sm font-medium text-blue-900">担当引き継ぎや重点物件の選定</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          物件健康スコア一覧
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">表示できる物件はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">物件名</th>
                  <th className="px-4 py-3 font-medium">健康スコア</th>
                  <th className="px-4 py-3 font-medium">判定</th>
                  <th className="px-4 py-3 font-medium">主な理由</th>
                  <th className="px-4 py-3 font-medium">進行中案件</th>
                  <th className="px-4 py-3 font-medium">期限切れタスク</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.name || '物件名未設定'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.score}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeClass(item.score)}`}>
                        {item.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.reasons.length > 0 ? item.reasons.join(' / ') : '大きな懸念なし'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.openCases}</td>
                    <td className="px-4 py-3 text-gray-700">{item.overdueTasks}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${item.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                      >
                        物件詳細へ
                      </Link>
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