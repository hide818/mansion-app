import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  status: string | null
}

type Card = {
  title: string
  description: string
  href: string
}

export default async function PropertyAiCenterPage({ params }: PageProps) {
  const { id: propertyId } = await params
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()

  if (!property) {
    notFound()
  }

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, status')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const openCases = safeCases.filter((item) => item.status !== '完了')
  const openTasks = safeTasks.filter((item) => item.status !== '完了')
  const openComplaints = safeComplaints.filter((item) => item.status !== '完了')

  const coreCards: Card[] = [
    {
      title: 'AI理事会報告ドラフト',
      description: '物件内の理事会候補案件をまとめて、理事会報告文を生成します。',
      href: `/properties/${propertyId}/ai-board-report-batch`,
    },
    {
      title: 'AIクレーム要約（共有向け）',
      description: '物件カルテや引き継ぎに貼りやすいクレーム共有文を作ります。',
      href: `/properties/${propertyId}/ai-complaint-brief`,
    },
    {
      title: 'AI月次報告（役員向け）',
      description: '理事会や役員報告で使いやすい月次文章をAIで作ります。',
      href: `/properties/${propertyId}/ai-monthly-report-board`,
    },
  ]

  const subCards: Card[] = [
    {
      title: 'AI対応提案（物件単位）',
      description: '物件全体の案件・タスク・クレームを見て、今の優先順位をAIが提案します。',
      href: `/properties/${propertyId}/ai-management-brief`,
    },
    {
      title: '物件AI次アクション提案',
      description: '物件全体で今やるべきことを、順番つきでAIが整理します。',
      href: `/properties/${propertyId}/ai-property-next-actions`,
    },
    {
      title: 'AI月次報告',
      description: '物件・案件・タスク・クレームをもとに、月次報告文を作ります。',
      href: `/properties/${propertyId}/monthly-report-ai`,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          物件詳細へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">物件AIツールセンター</h1>
        <p className="text-sm text-gray-600 mt-2">
          この物件で使うAI機能を1か所にまとめました。月次報告、理事会、クレーム共有、次アクション提案までここから入れます。
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">進行中案件</div>
          <div className="text-2xl font-bold mt-2">{openCases.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">未完了タスク</div>
          <div className="text-2xl font-bold mt-2">{openTasks.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">対応中クレーム</div>
          <div className="text-2xl font-bold mt-2">{openComplaints.length}</div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">中核機能</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {coreCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-green-300 hover:bg-green-50 transition"
            >
              <div className="font-semibold text-gray-900">{card.title}</div>
              <div className="text-sm text-gray-600 mt-2 leading-6">
                {card.description}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">補助機能</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {subCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-slate-100 transition"
            >
              <div className="font-semibold text-slate-600">{card.title}</div>
              <div className="text-sm text-slate-400 mt-2 leading-6">
                {card.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
