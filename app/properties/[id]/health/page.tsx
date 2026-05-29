import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  status: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  status: string | null
  due_date: string | null
  case_id: string | null
}

type ComplaintRow = {
  id: string
  status: string | null
  created_at: string | null
}

type PropertyCardRow = {
  id: string
  pinned_note: string | null
  management_memo: string | null
  board_memo: string | null
  caution_note: string | null
}

function toDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function getHealthScore(params: {
  activeCaseCount: number
  overdueTaskCount: number
  openComplaintCount: number
  hasCard: boolean
  hasPinned: boolean
  hasCaution: boolean
}) {
  let score = 100

  score -= params.activeCaseCount * 3
  score -= params.overdueTaskCount * 8
  score -= params.openComplaintCount * 10

  if (!params.hasCard) score -= 15
  if (!params.hasPinned) score -= 5
  if (!params.hasCaution) score -= 3

  if (score < 0) score = 0
  if (score > 100) score = 100

  return score
}

function getScoreLabel(score: number) {
  if (score >= 80) return '良好'
  if (score >= 60) return '注意'
  return '要対応'
}

function getScoreClass(score: number) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700'
  if (score >= 60) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

export default async function PropertyHealthPage({ params }: PageProps) {
  const { id } = await params
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
        <h1 className="text-2xl font-bold">物件健康スコア</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: cases } = await supabase
    .from('cases')
    .select('id, status, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)

  const caseIds = (cases ?? []).map((item) => item.id)

  const { data: tasks } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, status, due_date, case_id')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
    : { data: [] as TaskRow[] }

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, status, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)

  const { data: propertyCard } = await supabase
    .from('property_cards')
    .select('id, pinned_note, management_memo, board_memo, caution_note')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .maybeSingle<PropertyCardRow>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeCaseCount = (cases ?? []).filter((item) => item.status !== '完了').length
  const overdueTaskCount = (tasks ?? []).filter((item) => {
    if (item.status === '完了') return false
    const due = toDate(item.due_date)
    if (!due) return false
    due.setHours(0, 0, 0, 0)
    return due.getTime() < today.getTime()
  }).length
  const openComplaintCount = (complaints ?? []).filter((item) => item.status !== '完了').length

  const hasCard = Boolean(propertyCard?.id)
  const hasPinned = Boolean(propertyCard?.pinned_note)
  const hasCaution = Boolean(propertyCard?.caution_note)

  const score = getHealthScore({
    activeCaseCount,
    overdueTaskCount,
    openComplaintCount,
    hasCard,
    hasPinned,
    hasCaution,
  })

  const label = getScoreLabel(score)

  const recommendations: string[] = []

  if (overdueTaskCount >= 1) {
    recommendations.push('期限切れタスクを先に整理してください。')
  }
  if (openComplaintCount >= 1) {
    recommendations.push('未完了クレームの進捗共有を優先してください。')
  }
  if (activeCaseCount >= 5) {
    recommendations.push('進行中案件が多いため、担当の詰まり確認が必要です。')
  }
  if (!hasCard) {
    recommendations.push('物件カルテが未作成なので、基本メモを先に整えると強いです。')
  }
  if (hasCard && !hasPinned) {
    recommendations.push('重要情報のピン留めを入れると引き継ぎが楽になります。')
  }
  if (recommendations.length === 0) {
    recommendations.push('現状は安定しています。重要情報の更新だけ定期的に続けてください。')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">物件健康スコア</h1>
        <p className="mt-2 text-sm text-gray-600">
          案件数、期限切れ、クレーム、物件カルテの整備状況から物件状態を見ます。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href="/analytics/property-health"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          全体の物件健康一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">健康スコア</p>
          <p className="mt-2 text-4xl font-bold">{score}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">判定</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${getScoreClass(score)}`}>
            {label}
          </span>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">進行中案件</p>
          <p className="mt-2 text-3xl font-bold">{activeCaseCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">期限切れタスク</p>
          <p className="mt-2 text-3xl font-bold">{overdueTaskCount}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">未完了クレーム</p>
          <p className="mt-2 text-3xl font-bold">{openComplaintCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">物件カルテ</p>
          <p className="mt-2 text-sm font-medium">{hasCard ? '作成済み' : '未作成'}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">重要ピン留め</p>
          <p className="mt-2 text-sm font-medium">{hasPinned ? 'あり' : 'なし'}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">おすすめアクション</h2>
        <div className="mt-4 space-y-3">
          {recommendations.map((item) => (
            <div key={item} className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}