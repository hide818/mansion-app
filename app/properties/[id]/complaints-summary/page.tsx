import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type ComplaintsSummaryPageProps = {
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

function normalizeText(value: string | null, maxLength = 90) {
  if (!value) return '特記事項なし'
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return '特記事項なし'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}…`
    : normalized
}

function pickKeywordSource(list: ComplaintRow[]) {
  return list
    .map((item) => `${item.title ?? ''} ${item.detail ?? ''}`)
    .join(' ')
    .toLowerCase()
}

export default async function ComplaintsSummaryPage({
  params,
}: ComplaintsSummaryPageProps) {
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

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, title, detail, status, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(30)

  const safeComplaints = (complaints ?? []) as ComplaintRow[]
  const openComplaints = safeComplaints.filter((item) => item.status !== '完了')
  const closedComplaints = safeComplaints.filter((item) => item.status === '完了')

  const keywordSource = pickKeywordSource(safeComplaints)

  const possibleTheme =
    keywordSource.includes('騒音')
      ? '騒音系'
      : keywordSource.includes('水') || keywordSource.includes('漏')
      ? '漏水・給排水系'
      : keywordSource.includes('ごみ') || keywordSource.includes('ゴミ')
      ? 'ゴミ出し系'
      : keywordSource.includes('駐車')
      ? '駐車・車両系'
      : keywordSource.includes('ペット')
      ? 'ペット系'
      : '生活マナー・運用系'

  const recurrenceLevel =
    safeComplaints.length >= 5
      ? '高め'
      : safeComplaints.length >= 3
      ? '注意'
      : safeComplaints.length >= 1
      ? '低め'
      : 'なし'

  const warningText =
    safeComplaints.length === 0
      ? '現在、再発警告を出すレベルのクレーム蓄積はありません。'
      : `現在の主テーマは「${possibleTheme}」で、再発リスクは「${recurrenceLevel}」です。初動の記録統一、対応履歴の一本化、関係者への説明文面の共通化を優先してください。`

  const summaryText = `【クレーム要約・再発警告】

対象物件：${property.name ?? '物件名未設定'}
所在地：${property.address ?? '未登録'}

1．全体状況
登録クレーム総数：${safeComplaints.length} 件
対応中クレーム：${openComplaints.length} 件
完了クレーム：${closedComplaints.length} 件

2．傾向要約
本物件では、現時点で「${possibleTheme}」に近い相談・苦情が目立っています。
件数としては ${safeComplaints.length} 件であり、同種相談が繰り返される前に、記録の整理と説明ルールの統一を進めるべき段階です。

3．再発警告
${warningText}

4．直近のクレーム一覧
${
  safeComplaints.length === 0
    ? '・現在、登録されたクレームはありません。'
    : safeComplaints
        .slice(0, 8)
        .map((item) => {
          return `・${formatDate(item.created_at)} / ${item.title ?? '件名未設定'}（状況：${
            item.status ?? '未設定'
          }） / ${normalizeText(item.detail, 70)}`
        })
        .join('\n')
}

5．対応方針案
・同じテーマの相談が出た際の一次回答文を統一する
・理事長 / 役員への報告基準を明確にする
・完了していない案件は、次回対応日を決めて止めない
・記録を案件やログへ寄せて、担当者変更時に見落としを防ぐ

6．管理会社コメント
クレームは件数だけでなく、再発しやすいテーマの把握が重要です。今後は、類似案件の早期整理と、同種説明の統一で再発抑制を図ります。`

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
          href={`/complaints`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          クレーム一覧へ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">クレーム要約＋再発警告</h1>
        <p className="text-sm text-gray-600 mt-2">
          物件ごとのクレームをまとめて、再発しそうなテーマと対応方針をすぐ見られるようにします。
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">総クレーム数</div>
          <div className="text-2xl font-bold mt-2">{safeComplaints.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">対応中</div>
          <div className="text-2xl font-bold mt-2">{openComplaints.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">完了</div>
          <div className="text-2xl font-bold mt-2">{closedComplaints.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">主テーマ</div>
          <div className="text-lg font-bold mt-2">{possibleTheme}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">クレーム要約テキスト</div>
        <textarea
          readOnly
          defaultValue={summaryText}
          className="w-full min-h-[500px] rounded-xl border p-4 text-sm leading-7 bg-gray-50"
        />
      </div>
    </div>
  )
}