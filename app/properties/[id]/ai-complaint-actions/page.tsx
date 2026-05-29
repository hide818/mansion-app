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

type ComplaintRow = {
  id: string
  title: string | null
  detail: string | null
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

export default async function PropertyAiComplaintActionsPage({ params }: PageProps) {
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

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(15)

  const safeComplaints = (complaints ?? []) as ComplaintRow[]

  const contextText = `【AIへ渡すクレーム対応提案元データ】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

クレーム一覧：
${
  safeComplaints.length === 0
    ? '・クレームなし'
    : safeComplaints
        .map(
          (item) =>
            `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'} / 状況:${item.status ?? '未設定'} / 内容:${item.detail ?? '詳細なし'}`
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
        <h1 className="text-2xl font-bold">AIクレーム対応提案</h1>
        <p className="text-sm text-gray-600 mt-2">
          クレームの内容と状況を見て、今やるべき対応、先に共有すべきこと、注意点をAIが提案します。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AIクレーム対応提案"
        description="クレーム対応の優先順位と動き方をAIが整理します。"
        apiPath={`/api/properties/${propertyId}/ai-complaint-actions`}
      />
    </div>
  )
}