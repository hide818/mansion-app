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
    caseId?: string
    error?: string
  }>
}

async function createTaskAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const status = String(formData.get('status') ?? 'todo')
  const priority = String(formData.get('priority') ?? 'medium')
  const dueDate = String(formData.get('due_date') ?? '').trim()

  if (!isValidUuid(propertyId)) {
    redirect('/properties')
  }

  if (!propertyId || !title) {
    redirect(
      `/properties/${propertyId}/tasks/new?caseId=${encodeURIComponent(
        caseId,
      )}&error=${encodeURIComponent('必須項目が不足しています')}`,
    )
  }

  const payload: Record<string, string | null> = {
    company_id: companyId,
    property_id: propertyId,
    title,
    status,
    priority,
    due_date: dueDate || null,
    case_id: caseId || null,
  }

  const { error } = await supabase.from('tasks').insert(payload)

  if (error) {
    redirect(
      `/properties/${propertyId}/tasks/new?caseId=${encodeURIComponent(
        caseId,
      )}&error=${encodeURIComponent(error.message || 'タスクの保存に失敗しました')}`,
    )
  }

  if (caseId) {
    redirect(`/properties/${propertyId}/cases/${caseId}?taskCreated=1`)
  }

  redirect(`/properties/${propertyId}/tasks?created=1`)
}

export default async function NewTaskPage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const caseId = resolvedSearchParams?.caseId ?? ''
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : ''

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">タスクを追加</h1>
            <p className="mt-2 text-sm text-slate-600">
              {caseId
                ? 'この案件に新しいタスクを追加します。'
                : 'この物件に紐づくタスクを追加します。'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {caseId ? (
              <Link
                href={`/properties/${id}/cases/${caseId}`}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                案件詳細へ戻る
              </Link>
            ) : (
              <Link
                href={`/properties/${id}/tasks`}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                物件タスク一覧へ戻る
              </Link>
            )}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">保存エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createTaskAction} className="space-y-5">
          <input type="hidden" name="property_id" value={id} />
          <input type="hidden" name="case_id" value={caseId} />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              タスク名
            </label>
            <input
              name="title"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="例：理事長へ連絡"
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
              優先度
            </label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
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
          </div>
        </form>
      </section>
    </div>
  )
}