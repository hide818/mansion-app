import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CopyTextButton from '@/app/components/CopyTextButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  assignee: string | null
  board_next_action: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

function buildExplanationText(params: {
  propertyName: string
  caseItem: CaseRow
  latestLog: LogRow | undefined
}) {
  const { propertyName, caseItem, latestLog } = params

  return `【案件説明文】
${propertyName}における「${caseItem.title ?? '案件名未設定'}」の件です。
現在の状況は「${caseItem.status ?? '未設定'}」です。
直近の内容としては、
${latestLog?.message ?? '最新状況のログが未登録です。'}

今後は、
${caseItem.board_next_action ?? '次の対応を整理する必要があります。'}

以上が本案件の概要です。`
}

export default async function SimpleExplanationPage({ params }: PageProps) {
  const { id, caseId } = await params
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
        <h1 className="text-2xl font-bold">案件説明文生成</h1>
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

  const { data: caseItem, error: caseError } = await supabase
    .from('cases')
    .select('id, property_id, title, status, assignee, board_next_action')
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const { data: logs } = await supabase
    .from('logs')
    .select('id, message, created_at')
    .eq('company_id', companyId)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)

  const explanationText = buildExplanationText({
    propertyName: property.name ?? '物件名未設定',
    caseItem,
    latestLog: logs?.[0],
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">案件説明文生成</h1>
          <p className="mt-2 text-sm text-gray-600">
            理事会や社内共有で使える、短く説明しやすい文章を作ります。
          </p>
        </div>

        <CopyTextButton text={explanationText} label="説明文をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/board-draft`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          理事会報告ドラフトへ
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
          {explanationText}
        </pre>
      </div>
    </div>
  )
}