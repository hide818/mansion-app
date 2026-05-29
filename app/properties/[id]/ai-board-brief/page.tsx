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
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type ComplaintRow = {
  id: string
  title: string | null
  status: string | null
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

export default async function PropertyAiBoardBriefPage({ params }: PageProps) {
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
    .select('id, title, status, board_status, board_scheduled_for, board_agenda_title, board_next_action')
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
  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const boardCases = safeCases.filter(
    (item) => item.board_status && !['未設定', '不要', '完了'].includes(item.board_status)
  )

  const contextText = `【AIへ渡す理事会用 物件全体ブリーフ元データ】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

理事会候補案件：
${
  boardCases.length === 0
    ? '・理事会候補なし'
    : boardCases
        .map(
          (item) =>
            `・案件名:${item.title ?? '案件名未設定'} / 状況:${item.status ?? '未設定'} / 理事会状況:${item.board_status ?? '未設定'} / 上程予定:${formatDate(item.board_scheduled_for)} / 議案タイトル:${item.board_agenda_title ?? '未設定'} / 次アクション:${item.board_next_action ?? '未設定'}`
        )
        .join('\n')
}

クレーム状況：
${
  safeComplaints.length === 0
    ? '・クレームなし'
    : safeComplaints
        .map((item) => `・${item.title ?? '件名未設定'} / 状況:${item.status ?? '未設定'}`)
        .join('\n')
}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          物件詳細へ戻る
        </Link>
        <Link
          href={`/board-cases/ai-prep`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          理事会AI準備センターへ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">AI理事会用 物件全体ブリーフ</h1>
        <p className="text-sm text-gray-600 mt-2">
          理事会前に、この物件で何をどう説明すべきかを、物件全体目線でAIが整理します。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI理事会用 物件全体ブリーフ"
        description="理事会で話す順番、注意点、全体像をまとめた説明用文を生成します。"
        apiPath={`/api/properties/${propertyId}/ai-board-brief`}
      />
    </div>
  )
}