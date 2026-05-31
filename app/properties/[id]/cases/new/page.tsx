import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    error?: string
  }>
}

async function createCaseAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const status = String(formData.get('status') ?? 'todo')
  const dueDate = String(formData.get('due_date') ?? '').trim()

  if (!isValidUuid(propertyId)) {
    redirect('/properties')
  }

  if (!propertyId || !title) {
    redirect(`/properties/${propertyId}/cases/new?error=必須項目が不足しています`)
  }

  const basePayload = {
    company_id: companyId,
    property_id: propertyId,
    title,
    status,
  }

  let insertErrorMessage = ''

  if (dueDate) {
    const attempts = [
      { ...basePayload, due_date: dueDate },
      { ...basePayload, deadline: dueDate },
      { ...basePayload, due_at: dueDate },
      { ...basePayload, limit_date: dueDate },
    ]

    let inserted = false

    for (const payload of attempts) {
      const { error } = await supabase.from('cases').insert(payload)
      if (!error) {
        inserted = true
        break
      }
      insertErrorMessage = error.message
    }

    if (!inserted) {
      const { error } = await supabase.from('cases').insert(basePayload)
      if (error) {
        redirect(
          `/properties/${propertyId}/cases/new?error=${encodeURIComponent(
            error.message || insertErrorMessage || '案件の保存に失敗しました',
          )}`,
        )
      }
    }
  } else {
    const { error } = await supabase.from('cases').insert(basePayload)
    if (error) {
      redirect(
        `/properties/${propertyId}/cases/new?error=${encodeURIComponent(
          error.message || '案件の保存に失敗しました',
        )}`,
      )
    }
  }

  redirect(`/properties/${propertyId}/cases?created=1`)
}

export default async function NewCasePage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : ''

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">案件を追加</h1>
            <p className="mt-2 text-sm text-slate-600">
              この物件に新しい案件を追加します。
            </p>
          </div>

          <Link
            href={`/properties/${id}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            物件へ戻る
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">保存エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createCaseAction} className="space-y-5">
          <input type="hidden" name="property_id" value={id} />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              案件名
            </label>
            <input
              name="title"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="例：LED照明改修工事"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              状況
            </label>
            <select
              name="status"
              defaultValue="todo"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="todo">未着手</option>
              <option value="doing">進行中</option>
              <option value="pending">保留</option>
              <option value="done">完了</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              期限
            </label>
            <input
              type="date"
              name="due_date"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              保存する
            </button>

            <Link
              href={`/properties/${id}/cases`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              案件一覧へ戻る
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}