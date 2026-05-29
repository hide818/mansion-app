import Link from 'next/link'
import { notFound } from 'next/navigation'
import AiTextGenerator from '@/app/components/AiTextGenerator'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

type FileRow = {
  id: string
  file_name: string | null
  category: string | null
  note: string | null
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

export default async function AiVendorRequestPage({ params }: PageProps) {
  const { id: propertyId, caseId } = await params
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

  const { data: caseItem } = await supabase
    .from('cases')
    .select('id, title, status, assignee, board_next_action')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .single()

  if (!caseItem) notFound()

  const { data: logs } = await supabase
    .from('logs')
    .select('id, message, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: files } = await supabase
    .from('case_files')
    .select('id, file_name, category, note, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(12)

  const safeLogs = (logs ?? []) as LogRow[]
  const safeFiles = (files ?? []) as FileRow[]

  const contextText = `【AIへ渡す業者依頼文元データ】
物件名：${property.name ?? '未設定'}
所在地：${property.address ?? '未設定'}
案件名：${caseItem.title ?? '未設定'}
案件状況：${caseItem.status ?? '未設定'}
担当者：${caseItem.assignee ?? '未設定'}
次アクション：${caseItem.board_next_action ?? '未設定'}

最近の状況メモ：
${
  safeLogs.length === 0
    ? '・ログなし'
    : safeLogs
        .map((item) => `・${formatDate(item.created_at)} / ${item.message ?? '内容なし'}`)
        .join('\n')
}

添付資料候補：
${
  safeFiles.length === 0
    ? '・資料なし'
    : safeFiles
        .map(
          (item) =>
            `・${item.file_name ?? 'ファイル名未設定'} / 種別:${item.category ?? 'other'} / メモ:${item.note ?? 'メモなし'} / 登録日:${formatDate(item.created_at)}`
        )
        .join('\n')
}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}/cases/${caseId}`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          案件詳細へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">AI業者依頼文生成</h1>
        <p className="text-sm text-gray-600 mt-2">
          業者へ送る依頼文、見積依頼文、現地確認依頼文の土台をAIで作ります。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 bg-gray-50 rounded-xl border p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI業者依頼文"
        description="業者にそのまま送りやすい丁寧な依頼文を生成します。"
        apiPath={`/api/properties/${propertyId}/cases/${caseId}/ai-vendor-request`}
      />
    </div>
  )
}