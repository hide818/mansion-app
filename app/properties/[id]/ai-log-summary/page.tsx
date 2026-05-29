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
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
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

export default async function PropertyAiLogSummaryPage({ params }: PageProps) {
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
    .select('id, title')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const safeCases = (cases ?? []) as CaseRow[]
  const caseIds = safeCases.map((item) => item.id)

  let logs: LogRow[] = []

  if (caseIds.length > 0) {
    const { data: logsData } = await supabase
      .from('logs')
      .select('id, case_id, message, created_at')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false })
      .limit(30)

    logs = (logsData ?? []) as LogRow[]
  }

  const caseMap = new Map(safeCases.map((item) => [item.id, item.title ?? '案件名未設定']))

  const contextText = `【AIへ渡す物件ログ要約元データ】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

関連案件：
${
  safeCases.length === 0
    ? '・案件なし'
    : safeCases.map((item) => `・${item.title ?? '案件名未設定'}`).join('\n')
}

最近の対応ログ：
${
  logs.length === 0
    ? '・ログなし'
    : logs
        .map(
          (item) =>
            `・${formatDateTime(item.created_at)} / ${caseMap.get(item.case_id ?? '') ?? '案件名不明'} / ${item.message ?? '内容なし'}`
        )
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
          href={`/properties/${propertyId}/ai-center`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          物件AIセンターへ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">AI物件ログ要約</h1>
        <p className="text-sm text-gray-600 mt-2">
          物件内の対応履歴をまとめて、今の状況・最近の流れ・注意点がわかる形に要約します。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI物件ログ要約"
        description="物件全体の対応履歴を、読みやすい要点整理文にします。"
        apiPath={`/api/properties/${propertyId}/ai-log-summary`}
      />
    </div>
  )
}