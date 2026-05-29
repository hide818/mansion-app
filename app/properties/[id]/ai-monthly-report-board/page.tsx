import Link from 'next/link'
import { notFound } from 'next/navigation'
import AiTextGenerator from '@/app/components/AiTextGenerator'
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
  board_status: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default async function AiMonthlyReportBoardPage({ params }: PageProps) {
  const { id: propertyId } = await params
  const companyId = await getUserCompanyId()

  if (!companyId) notFound()

  const supabase = await createSupabaseServerClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()

  if (!property) notFound()

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, board_status')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, status, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const contextText = `【AIへ渡す役員向け月次報告元データ】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

案件：
${
  safeCases.length === 0
    ? '・案件なし'
    : safeCases
        .map((item) => `・${item.title ?? '案件名未設定'} / 状況:${item.status ?? '未設定'} / 理事会:${item.board_status ?? '未設定'}`)
        .join('\n')
}

タスク：
${
  safeTasks.length === 0
    ? '・タスクなし'
    : safeTasks
        .map((item) => `・${item.title ?? 'タスク名未設定'} / 状況:${item.status ?? '未設定'} / 期限:${formatDate(item.due_date)}`)
        .join('\n')
}

クレーム：
${
  safeComplaints.length === 0
    ? '・クレームなし'
    : safeComplaints
        .map((item) => `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'} / 状況:${item.status ?? '未設定'}`)
        .join('\n')
}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link href={`/properties/${propertyId}`} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          物件詳細へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">AI月次報告生成（役員向け版）</h1>
        <p className="text-sm text-gray-600 mt-2">
          役員や理事会への説明を意識した、やや丁寧で報告向けの月次文章をAIで生成します。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI月次報告（役員向け）"
        description="理事会や役員報告でも使いやすい月次報告文を生成します。"
        apiPath={`/api/properties/${propertyId}/ai-monthly-report-board`}
      />
    </div>
  )
}