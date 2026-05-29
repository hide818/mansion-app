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
  title: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  status: string | null
  due_date: string | null
}

type ComplaintRow = {
  id: string
  status: string | null
  created_at: string | null
}

type ToolCard = {
  title: string
  description: string
  href: string
  category: string
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isOverdue(value: string | null) {
  if (!value) return false

  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export default async function PropertyToolsPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">物件ツール一覧</h1>
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
    .select('id, title, status, assignee, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const caseIds = (cases ?? []).map((item) => item.id)

  const { data: tasks } = caseIds.length
    ? await supabase
        .from('tasks')
        .select('id, status, due_date')
        .eq('company_id', companyId)
        .in('case_id', caseIds)
    : { data: [] as TaskRow[] }

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, status, created_at')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const activeCases = (cases ?? []).filter((item) => item.status !== '完了')
  const openComplaints = (complaints ?? []).filter((item) => item.status !== '完了')
  const overdueTasks = (tasks ?? []).filter((item) => item.status !== '完了' && isOverdue(item.due_date))

  const toolCards: ToolCard[] = [
    {
      title: '物件健康スコア',
      description: '案件数、期限切れ、クレーム状況から物件の健康度を見ます。',
      href: `/properties/${id}/health`,
      category: '判断支援',
    },
    {
      title: '継続案件の要点',
      description: 'まだ終わっていない案件をまとめて見て、引き継ぎしやすくします。',
      href: `/properties/${id}/continuing-cases`,
      category: '引き継ぎ',
    },
    {
      title: '物件クレーム履歴',
      description: 'この物件で過去に起きたクレームを時系列で確認できます。',
      href: `/properties/${id}/complaints-history`,
      category: 'クレーム',
    },
    {
      title: '過去トラブル傾向',
      description: '再発しやすいテーマを見て、注意点を先回りできます。',
      href: `/properties/${id}/trouble-trends`,
      category: 'クレーム',
    },
    {
      title: '物件ログ一覧',
      description: '物件に紐づく案件ログをまとめて確認できます。',
      href: `/properties/${id}/logs`,
      category: 'ログ',
    },
    {
      title: '引き継ぎAI',
      description: '物件単位の引き継ぎ文を生成・保存・印刷できます。',
      href: `/properties/${id}/handover-ai`,
      category: 'AI',
    },
    {
      title: '物件別日報',
      description: 'この物件の動きを日報としてすぐ出せます。',
      href: `/properties/${id}/daily-report`,
      category: '文書生成',
    },
    {
      title: '物件の案件一覧',
      description: 'この物件の案件を一覧で確認できます。',
      href: `/properties/${id}/cases`,
      category: '案件',
    },
    {
      title: '物件のタスク一覧',
      description: 'この物件に関するタスクをまとめて確認できます。',
      href: `/properties/${id}/tasks`,
      category: 'タスク',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">物件ツール一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          この物件でよく使う売り機能を、迷わず開けるようにまとめています。
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
          href="/property-cards"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          物件カルテ一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">進行中案件</p>
          <p className="mt-2 text-3xl font-bold">{activeCases.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">期限切れタスク</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{overdueTasks.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">未完了クレーム</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{openComplaints.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">最新クレーム日</p>
          <p className="mt-2 text-sm font-medium">{formatDate(complaints?.[0]?.created_at ?? null)}</p>
        </div>
      </div>

      {activeCases.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">この物件の最近の案件</h2>
          <div className="mt-4 space-y-3">
            {activeCases.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title ?? '案件名未設定'}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      状態: {item.status ?? '未設定'} / 担当: {item.assignee ?? '未設定'}
                    </p>
                  </div>
                  <Link
                    href={`/properties/${id}/cases/${item.id}/tools`}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    この案件のツール一覧
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border bg-white p-5 transition hover:border-gray-400 hover:bg-gray-50"
          >
            <p className="text-xs font-medium text-gray-500">{card.category}</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}