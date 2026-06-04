import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { canEdit } from '@/lib/permissions'
import PrintHandoverButton from '@/app/components/PrintHandoverButton'
import { secondaryButtonClass } from '@/app/components/ui/buttonStyles'

type Props = {
  params: Promise<{
    docId: string
  }>
  searchParams?: Promise<{
    updated?: string
  }>
}

type HandoverRow = {
  id: string
  property_id: string | null
  basic_info: string | null
  management_system: string | null
  board_info: string | null
  schedule: string | null
  rules: string | null
  directors: string | null
  vendors: string | null
  history: string | null
  cautions: string | null
  tasks: string | null
  note: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
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

function Section({
  title,
  content,
}: {
  title: string
  content: string | null
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>

      {content ? (
        <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
          {content}
        </pre>
      ) : (
        <p className="mt-4 text-sm text-slate-500">未入力</p>
      )}
    </section>
  )
}

async function deleteHandoverAction(formData: FormData) {
  'use server'

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    redirect('/handover-documents?error=' + encodeURIComponent('権限がありません'))
  }

  const docId = String(formData.get('doc_id') ?? '').trim()

  if (!docId) {
    redirect('/handover-documents')
  }

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { error } = await supabase
    .from('handover_documents')
    .delete()
    .eq('id', docId)
    .eq('company_id', companyId)

  if (error) {
    redirect(`/handover-documents/${docId}`)
  }

  redirect('/handover-documents?deleted=1')
}

export default async function HandoverDocumentDetailPage({
  params,
  searchParams,
}: Props) {
  const { docId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const updated = resolvedSearchParams?.updated === '1'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('handover_documents')
    .select(`
      id,
      property_id,
      basic_info,
      management_system,
      board_info,
      schedule,
      rules,
      directors,
      vendors,
      history,
      cautions,
      tasks,
      note,
      created_at
    `)
    .eq('id', docId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">引き継ぎ詳細</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">
            引き継ぎ書の取得に失敗しました
          </h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const doc = data as HandoverRow | null

  if (!doc) {
    return notFound()
  }

  let propertyName = ''
  if (doc.property_id) {
    const { data: propertyData } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', doc.property_id)
      .eq('company_id', companyId)
      .maybeSingle()

    const property = propertyData as PropertyRow | null
    propertyName = property?.name ?? ''
  }

  return (
    <div className="space-y-6 p-6 print:space-y-4 print:p-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">引き継ぎDX</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {propertyName || '引き継ぎ書詳細'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              保存日時: {formatDateTime(doc.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={
                doc.property_id
                  ? `/handover-documents?propertyId=${doc.property_id}`
                  : '/handover-documents'
              }
              className={secondaryButtonClass}
            >
              引き継ぎ一覧へ戻る
            </Link>

            <Link
              href={`/handover-documents/${doc.id}/edit`}
              className={secondaryButtonClass}
            >
              編集する
            </Link>

            <PrintHandoverButton />
          </div>
        </div>
      </section>

      {updated ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm print:hidden">
          <p className="text-sm font-semibold text-blue-700">更新完了</p>
          <p className="mt-2 text-sm text-blue-700">
            引き継ぎ書を更新しました。
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none">
        <div className="border-b border-slate-200 pb-6 print:mb-4 print:border-b print:pb-3">
          <p className="text-sm font-semibold text-emerald-600">引き継ぎDX</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">引き継ぎ書</h1>
          <p className="mt-2 text-sm text-slate-600">
            物件名: {propertyName || '未設定'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            保存日時: {formatDateTime(doc.created_at)}
          </p>
        </div>

        <div className="mt-6 space-y-6 print:mt-4 print:space-y-4">
          <Section title="1．基本情報" content={doc.basic_info} />
          <Section title="2．管理体制" content={doc.management_system} />
          <Section title="3．理事会・総会関係" content={doc.board_info} />
          <Section title="5．年間スケジュール" content={doc.schedule} />
          <Section title="6．重要ルール・ローカルルール" content={doc.rules} />
          <Section title="7．理事長・役員情報" content={doc.directors} />
          <Section title="8．業者関係" content={doc.vendors} />
          <Section title="9．過去トラブル・履歴" content={doc.history} />
          <Section title="10．注意事項" content={doc.cautions} />
          <Section title="11．引き継ぎタスク" content={doc.tasks} />
          <Section title="13．備考" content={doc.note} />
        </div>
      </section>

      <section className="rounded-lg border border-rose-200 bg-white p-6 shadow-sm print:hidden">
        <h2 className="text-xl font-bold text-rose-700">削除</h2>
        <p className="mt-2 text-sm text-slate-600">
          間違って作成した引き継ぎ書を削除できます。
        </p>

        <form action={deleteHandoverAction} className="mt-5">
          <input type="hidden" name="doc_id" value={doc.id} />

          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
          >
            この引き継ぎ書を削除
          </button>
        </form>
      </section>
    </div>
  )
}