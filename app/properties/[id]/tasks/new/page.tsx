import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { isValidUuid } from '@/lib/isValidUuid'
import { canEdit } from '@/lib/permissions'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    caseId?: string
    error?: string
  }>
}

type ProfileOption = {
  id: string
  display_name: string | null
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
  const assignedToCandidate = String(formData.get('assigned_to') ?? '').trim()

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

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
  }
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  if (!canViewAll && !currentProfile?.id) {
    redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
  }

  if (caseId) {
    const { data: targetCase } = await supabase
      .from('cases')
      .select('id, assigned_to')
      .eq('id', caseId)
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()
    if (!targetCase) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('指定された案件が見つかりません')}`)
    }
    if (!canViewAll && targetCase.assigned_to !== currentProfile?.id) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
    }
  }

  let assignedTo: string | null = null
  if (!canViewAll) {
    assignedTo = currentProfile?.id ?? null
  } else {
    if (assignedToCandidate) {
      if (isValidUuid(assignedToCandidate)) {
        const { data: assigneeProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', assignedToCandidate)
          .eq('company_id', companyId)
          .maybeSingle()
        if (assigneeProfile) {
          assignedTo = assignedToCandidate
        }
      }
    }
  }

  const payload: Record<string, string | null> = {
    company_id: companyId,
    property_id: propertyId,
    title,
    status,
    priority,
    due_date: dueDate || null,
    case_id: caseId || null,
    assigned_to: assignedTo,
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

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('company_id', companyId)
    .order('display_name', { ascending: true })

  const profiles = (profilesData ?? []) as ProfileOption[]

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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              担当者
            </label>
            <select
              name="assigned_to"
              defaultValue=""
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">（未設定）</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? 'ユーザー'}
                </option>
              ))}
            </select>
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
