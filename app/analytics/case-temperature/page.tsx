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

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
  due_date: string | null
}

type LogRow = {
  case_id: string | null
  created_at: string | null
}

type ComplaintRow = {
  id: string
  property_id: string | null
  status: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type Temperature = '平和' | '注意' | '炎上'

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

function diffDaysFromToday(value: string | null) {
  if (!value) return null

  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  return Math.floor((todayStart.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
}

function getBadgeClass(temperature: Temperature) {
  if (temperature === '炎上') return 'bg-red-50 text-red-800 border-red-200'
  if (temperature === '注意') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  return 'bg-green-50 text-green-800 border-green-200'
}

export default async function CaseTemperaturePage() {
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

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: logs, error: logsError }, { data: complaints, error: complaintsError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select('id, title, property_id, status, assignee, created_at')
        .eq('company_id', companyId)
        .neq('status', '完了'),
      supabase.from('tasks').select('id, case_id, status, due_date').eq('company_id', companyId),
      supabase.from('logs').select('case_id, created_at').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('complaints').select('id, property_id, status, created_at').eq('company_id', companyId),
    ])

  if (casesError || tasksError || logsError || complaintsError) {
    console.error('case temperature page error:', {
      casesError,
      tasksError,
      logsError,
      complaintsError,
    })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          案件温度感の取得に失敗しました。cases / tasks / logs / complaints を確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]
  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const propertyIds = Array.from(new Set(safeCases.map((item) => item.property_id).filter(Boolean))) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const caseTaskMap = new Map<string, TaskRow[]>()
  safeTasks.forEach((task) => {
    if (!task.case_id) return
    if (!caseTaskMap.has(task.case_id)) caseTaskMap.set(task.case_id, [])
    caseTaskMap.get(task.case_id)!.push(task)
  })

  const latestLogMap = new Map<string, string>()
  safeLogs.forEach((log) => {
    if (!log.case_id || !log.created_at) return
    if (!latestLogMap.has(log.case_id)) {
      latestLogMap.set(log.case_id, log.created_at)
    }
  })

  const complaintCountMap = new Map<string, number>()
  safeComplaints.forEach((item) => {
    if (!item.property_id) return
    complaintCountMap.set(item.property_id, (complaintCountMap.get(item.property_id) ?? 0) + 1)
  })

  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const rows = safeCases
    .map((item) => {
      const relatedTasks = caseTaskMap.get(item.id) ?? []
      const openTasks = relatedTasks.filter((task) => task.status !== '完了')
      const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < todayText)
      const staleDays = diffDaysFromToday(latestLogMap.get(item.id) ?? item.created_at)
      const propertyComplaintCount = item.property_id ? complaintCountMap.get(item.property_id) ?? 0 : 0

      let score = 0
      const reasons: string[] = []

      if (overdueTasks.length >= 2) {
        score += 3
        reasons.push(`期限切れタスク${overdueTasks.length}件`)
      } else if (overdueTasks.length === 1) {
        score += 2
        reasons.push('期限切れタスクあり')
      }

      if ((staleDays ?? 0) >= 21) {
        score += 2
        reasons.push(`更新停滞${staleDays}日`)
      }

      if (!item.assignee) {
        score += 1
        reasons.push('担当未設定')
      }

      if (propertyComplaintCount >= 3) {
        score += 2
        reasons.push(`同物件クレーム${propertyComplaintCount}件`)
      } else if (propertyComplaintCount >= 1) {
        score += 1
        reasons.push('同物件でクレームあり')
      }

      let temperature: Temperature = '平和'
      if (score >= 5) temperature = '炎上'
      else if (score >= 2) temperature = '注意'

      return {
        ...item,
        temperature,
        reasons,
        staleDays,
        propertyComplaintCount,
        lastLogAt: latestLogMap.get(item.id) ?? item.created_at,
      }
    })
    .sort((a, b) => {
      const order = { 炎上: 3, 注意: 2, 平和: 1 }
      return order[b.temperature] - order[a.temperature]
    })

  const calmCount = rows.filter((item) => item.temperature === '平和').length
  const cautionCount = rows.filter((item) => item.temperature === '注意').length
  const fireCount = rows.filter((item) => item.temperature === '炎上').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">案件の温度感表示</h1>
        <p className="mt-2 text-sm text-gray-600">
          期限切れ、更新停滞、担当者未設定、同物件クレーム数を元に、案件の温度感を平和 / 注意 / 炎上で表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象案件数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-sm text-green-700">平和</div>
          <div className="mt-2 text-3xl font-bold text-green-900">{calmCount}</div>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">注意</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900">{cautionCount}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm text-red-700">炎上</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{fireCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
          案件温度感一覧
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">表示できる案件はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">案件名</th>
                  <th className="px-4 py-3 font-medium">物件</th>
                  <th className="px-4 py-3 font-medium">温度感</th>
                  <th className="px-4 py-3 font-medium">理由</th>
                  <th className="px-4 py-3 font-medium">最終更新目安</th>
                  <th className="px-4 py-3 font-medium">移動</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.title || '無題案件'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeClass(item.temperature)}`}>
                        {item.temperature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.reasons.length > 0 ? item.reasons.join(' / ') : '平常運転'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(item.lastLogAt)}</td>
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