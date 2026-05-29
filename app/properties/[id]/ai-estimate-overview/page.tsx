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

type FileRow = {
  id: string
  case_id: string | null
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

export default async function PropertyAiEstimateOverviewPage({ params }: PageProps) {
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
    .limit(30)

  const safeCases = (cases ?? []) as CaseRow[]
  const caseIds = safeCases.map((item) => item.id)

  let files: FileRow[] = []
  if (caseIds.length > 0) {
    const { data: filesData } = await supabase
      .from('case_files')
      .select('id, case_id, file_name, category, note, created_at')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false })
      .limit(40)

    files = (filesData ?? []) as FileRow[]
  }

  const caseMap = new Map(safeCases.map((item) => [item.id, item.title ?? '案件名未設定']))
  const estimateFiles = files.filter((item) => item.category === 'estimate')

  const contextText = `【AIへ渡す見積関連まとめ元データ】
物件名：${property.name ?? '未設定'}
住所：${property.address ?? '未設定'}

見積カテゴリ資料：
${
  estimateFiles.length === 0
    ? '・見積資料なし'
    : estimateFiles
        .map(
          (item) =>
            `・${formatDate(item.created_at)} / ${caseMap.get(item.case_id ?? '') ?? '案件名不明'} / ${item.file_name ?? 'ファイル名未設定'} / メモ:${item.note ?? 'メモなし'}`
        )
        .join('\n')
}

その他添付資料：
${
  files.length === 0
    ? '・添付資料なし'
    : files
        .slice(0, 20)
        .map(
          (item) =>
            `・${formatDate(item.created_at)} / ${caseMap.get(item.case_id ?? '') ?? '案件名不明'} / ${item.file_name ?? 'ファイル名未設定'} / 種別:${item.category ?? 'other'} / メモ:${item.note ?? 'メモなし'}`
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
        <h1 className="text-2xl font-bold">AI見積関連まとめ</h1>
        <p className="text-sm text-gray-600 mt-2">
          物件内の見積資料や添付資料を横断して、理事会説明や社内共有に使えるまとめ文をAIで作ります。
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">AIへ渡す元データ</div>
        <pre className="whitespace-pre-wrap text-sm leading-7 rounded-xl border bg-gray-50 p-4">
          {contextText}
        </pre>
      </div>

      <AiTextGenerator
        title="AI見積関連まとめ"
        description="見積資料の比較視点、説明コメント、確認不足ポイントをまとめて生成します。"
        apiPath={`/api/properties/${propertyId}/ai-estimate-overview`}
      />
    </div>
  )
}