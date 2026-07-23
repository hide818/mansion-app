import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { isValidUuid } from '@/lib/isValidUuid'
import { canEdit } from '@/lib/permissions'
import SubmitButton from '@/app/components/SubmitButton'

type Props = {
  params: Promise<{
    id: string
    taskId: string
  }>
  searchParams?: Promise<{
    saved?: string
    error?: string
  }>
}

type RawTaskRow = {
  id?: string
  title?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  created_at?: string | null
  property_id?: string | null
  case_id?: string | null
  assigned_to?: string | null
}

type RawCaseRow = {
  id?: string
  title?: string | null
  name?: string | null
}

type ProfileOption = {
  id: string
  display_name: string | null
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

function toDateInputValue(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getStatusLabel(status: string | null) {
  if (!status) return '未設定'

  switch (status) {
    case 'todo':
      return '未着手'
    case 'doing':
      return '進行中'
    case 'done':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return status
  }
}

function getPriorityLabel(priority: string | null) {
  if (!priority) return '未設定'

  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return priority
  }
}

async function updateTaskAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const taskId = String(formData.get('task_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '')
  const status = String(formData.get('status') ?? 'todo')
  const priority = String(formData.get('priority') ?? 'medium')
  const dueDate = String(formData.get('due_date') ?? '').trim()
  const assignedToCandidate = String(formData.get('assigned_to') ?? '').trim()

  if (!isValidUuid(propertyId)) {
    redirect('/properties')
  }

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
  }
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  if (!canViewAll) {
    if (!currentProfile?.id) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
    }
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, assigned_to, property_id')
      .eq('id', taskId)
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()
    if (!existingTask || existingTask.assigned_to !== currentProfile.id) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
    }
  }

  let assignedTo: string | null = null
  if (assignedToCandidate && isValidUuid(assignedToCandidate)) {
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

  const { error } = await supabase
    .from('tasks')
    .update({
      status,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    })
    .eq('id', taskId)
    .eq('company_id', companyId)

  if (error) {
    redirect(
      `/properties/${propertyId}/tasks/${taskId}?error=${encodeURIComponent(
        error.message || 'タスクの更新に失敗しました',
      )}`,
    )
  }

  if (status === 'done' && caseId) {
    redirect(`/properties/${propertyId}/cases/${caseId}?taskCompleted=1`)
  }

  redirect(`/properties/${propertyId}/tasks/${taskId}?saved=1`)
}

async function deleteTaskAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const taskId = String(formData.get('task_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '')

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
  }
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  if (!canViewAll) {
    if (!currentProfile?.id) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
    }
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, assigned_to, property_id')
      .eq('id', taskId)
      .eq('property_id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()
    if (!existingTask || existingTask.assigned_to !== currentProfile.id) {
      redirect(`/properties/${propertyId}/tasks?error=${encodeURIComponent('権限がありません')}`)
    }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('company_id', companyId)

  if (error) {
    redirect(
      `/properties/${propertyId}/tasks/${taskId}?error=${encodeURIComponent(
        error.message || 'タスクの削除に失敗しました',
      )}`,
    )
  }

  if (caseId) {
    redirect(`/properties/${propertyId}/cases/${caseId}?taskDeleted=1`)
  }

  redirect(`/properties/${propertyId}/tasks?deleted=1`)
}

export default async function TaskDetailPage({ params, searchParams }: Props) {
  const { id, taskId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const saved = resolvedSearchParams?.saved === '1'
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : ''

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!property) {
    return notFound()
  }

  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, created_at, property_id, case_id, assigned_to')
    .eq('id', taskId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (taskError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">タスク詳細</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">タスクの取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{taskError.message}</p>
        </div>
      </div>
    )
  }

  const task = taskData as RawTaskRow | null

  if (!task || !task.id) {
    return notFound()
  }

  if (task.property_id && task.property_id !== id) {
    return notFound()
  }

  if (!canViewAll) {
    if (!currentProfile?.id || task.assigned_to !== currentProfile.id) {
      return notFound()
    }
  }

  let caseTitle = ''
  if (task.case_id) {
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, title, name')
      .eq('id', task.case_id)
      .eq('company_id', companyId)
      .maybeSingle()

    const targetCase = caseData as RawCaseRow | null
    caseTitle = targetCase ? targetCase.title ?? targetCase.name ?? '' : ''
  }

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('company_id', companyId)
    .order('display_name', { ascending: true })

  const profiles = (profilesData ?? []) as ProfileOption[]
  const assigneeName = task.assigned_to
    ? (profiles.find((p) => p.id === task.assigned_to)?.display_name ?? '未設定')
    : '未設定'

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {task.title || '無題タスク'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {property.name || '物件'} に紐づくタスク詳細です。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {task.case_id ? (
              <Link
                href={`/properties/${id}/cases/${task.case_id}`}
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

      {saved ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">保存完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            タスクを更新しました。
          </p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">状況</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {getStatusLabel(task.status ?? null)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">期限</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatDate(task.due_date ?? null)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">優先度</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {getPriorityLabel(task.priority ?? null)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">案件</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {task.case_id ? (caseTitle || '案件あり') : '物件直下'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">担当者</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {assigneeName}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">タスク情報を更新</h2>
        <p className="mt-2 text-sm text-slate-600">
          状況・優先度・期限・担当者をこの画面で変更できます。
        </p>

        <form action={updateTaskAction} className="mt-5 space-y-5">
          <input type="hidden" name="property_id" value={id} />
          <input type="hidden" name="task_id" value={taskId} />
          <input type="hidden" name="case_id" value={task.case_id ?? ''} />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              状況
            </label>
            <select
              name="status"
              defaultValue={task.status ?? 'todo'}
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
              defaultValue={task.priority ?? 'medium'}
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
              defaultValue={toDateInputValue(task.due_date ?? null)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              担当者
            </label>
            <select
              name="assigned_to"
              defaultValue={task.assigned_to ?? ''}
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

          <div className="flex flex-wrap gap-3">
            <SubmitButton label="保存する" loadingLabel="保存中..." />
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-700">削除</h2>
        <p className="mt-2 text-sm text-slate-600">
          間違って作成したタスクを削除できます。
        </p>

        <form action={deleteTaskAction} className="mt-5">
          <input type="hidden" name="property_id" value={id} />
          <input type="hidden" name="task_id" value={taskId} />
          <input type="hidden" name="case_id" value={task.case_id ?? ''} />

          <SubmitButton label="このタスクを削除" loadingLabel="削除中..." variant="danger" />
        </form>
      </section>
    </div>
  )
}
