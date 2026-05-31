import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

type Props = {
  params: Promise<{
    id: string
    caseId: string
  }>
  searchParams?: Promise<{
    saved?: string
    error?: string
    taskCreated?: string
    taskCompleted?: string
    taskDeleted?: string
    caseDeleted?: string
  }>
}

type RawCaseRow = {
  id?: string
  title?: string | null
  name?: string | null
  status?: string | null
  due_date?: string | null
  deadline?: string | null
  due_at?: string | null
  limit_date?: string | null
  created_at?: string | null
  updated_at?: string | null
  property_id?: string | null
  overview?: string | null
  description?: string | null
  content?: string | null
  source_minutes_record_id?: string | null
  [key: string]: unknown
}

type RawTaskRow = {
  id?: string
  title?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  deadline?: string | null
  due_at?: string | null
  limit_date?: string | null
  created_at?: string | null
  [key: string]: unknown
}

type MinutesLinkRow = {
  id: string
  title: string | null
  official_title: string | null
  meeting_type: string | null
  held_on: string | null
  created_at: string | null
}

const CASE_DATE_FIELDS = ['due_date', 'deadline', 'due_at', 'limit_date'] as const

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

function pickCaseTitle(item: RawCaseRow) {
  return item.title ?? item.name ?? '無題案件'
}

function pickCaseDueDate(item: RawCaseRow) {
  return (item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date ?? null) as string | null
}

function pickCaseDescription(item: RawCaseRow) {
  return (item.overview ?? item.description ?? item.content ?? '') as string
}

function pickTaskDueDate(item: RawTaskRow) {
  return (item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date ?? null) as string | null
}

function detectCaseDateField(item: RawCaseRow): string {
  for (const field of CASE_DATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      return field
    }
  }

  return ''
}

function formatMeetingType(value: string | null) {
  if (value === 'general_meeting') return '総会'
  if (value === 'board_meeting') return '理事会'
  return value || '議事録'
}

async function updateCaseAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '')
  const status = String(formData.get('status') ?? 'todo')
  const dueDate = String(formData.get('due_date') ?? '').trim()
  const dueField = String(formData.get('due_field') ?? '').trim()

  if (!isValidUuid(propertyId)) {
    redirect('/properties')
  }

  if (!propertyId || !caseId) {
    redirect(`/properties/${propertyId}/cases/${caseId}?error=案件の指定が不足しています`)
  }

  if (!dueField) {
    redirect(
      `/properties/${propertyId}/cases/${caseId}?error=${encodeURIComponent(
        '期限列が見つからないため、期限を更新できません。cases テーブルの列名を確認してください。',
      )}`,
    )
  }

  const payload: Record<string, string | null> = {
    status,
    [dueField]: dueDate || null,
  }

  const { error } = await supabase
    .from('cases')
    .update(payload)
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .eq('company_id', companyId)

  if (error) {
    redirect(
      `/properties/${propertyId}/cases/${caseId}?error=${encodeURIComponent(
        error.message || '案件の更新に失敗しました',
      )}`,
    )
  }

  redirect(`/properties/${propertyId}/cases/${caseId}?saved=1`)
}

async function deleteCaseAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '')

  await supabase
    .from('tasks')
    .update({ case_id: null })
    .eq('company_id', companyId)
    .eq('property_id', propertyId)
    .eq('case_id', caseId)

  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .eq('company_id', companyId)

  if (error) {
    redirect(
      `/properties/${propertyId}/cases/${caseId}?error=${encodeURIComponent(
        error.message || '案件の削除に失敗しました',
      )}`,
    )
  }

  redirect(`/properties/${propertyId}/cases?caseDeleted=1`)
}

export default async function CaseDetailPage({ params, searchParams }: Props) {
  const { id, caseId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const saved = resolvedSearchParams?.saved === '1'
  const taskCreated = resolvedSearchParams?.taskCreated === '1'
  const taskCompleted = resolvedSearchParams?.taskCompleted === '1'
  const taskDeleted = resolvedSearchParams?.taskDeleted === '1'
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : ''

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!property) {
    return notFound()
  }

  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('property_id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (caseError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">案件詳細</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">案件の取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{caseError.message}</p>
        </div>
      </div>
    )
  }

  const targetCase = caseData as RawCaseRow | null

  if (!targetCase || !targetCase.id) {
    return notFound()
  }

  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('case_id', caseId)
    .neq('status', 'done')

  if (taskError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">案件詳細</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">タスクの取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{taskError.message}</p>
        </div>
      </div>
    )
  }

  const tasks = ((taskData ?? []) as RawTaskRow[]).filter(
    (item): item is RawTaskRow & { id: string } =>
      typeof item.id === 'string' && item.id.length > 0,
  )

  const sourceMinutesRecordId =
    typeof targetCase.source_minutes_record_id === 'string'
      ? targetCase.source_minutes_record_id
      : null

  let linkedMinutes: MinutesLinkRow | null = null

  if (sourceMinutesRecordId) {
    const { data: minutesData } = await supabase
      .from('ai_minutes_records')
      .select('id, title, official_title, meeting_type, held_on, created_at')
      .eq('id', sourceMinutesRecordId)
      .eq('company_id', companyId)
      .maybeSingle()

    linkedMinutes = (minutesData as MinutesLinkRow | null) ?? null
  }

  const caseTitle = pickCaseTitle(targetCase)
  const caseDueDate = pickCaseDueDate(targetCase)
  const caseDescription = pickCaseDescription(targetCase)
  const detectedDueField = detectCaseDateField(targetCase)

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">案件・タスク管理</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{caseTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {property.name || '物件'} に紐づく案件詳細です。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/properties/${id}/cases`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              案件一覧へ戻る
            </Link>

            <Link
              href={`/properties/${id}/tasks/new?caseId=${caseId}`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-800"
            >
              タスクを追加
            </Link>

            <Link
              href={`/ai-minutes/records?propertyId=${id}`}
              className="rounded-xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              この物件の保存済み議事録一覧
            </Link>

            {linkedMinutes ? (
              <Link
                href={`/ai-minutes/records/${linkedMinutes.id}`}
                className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                関連議事録を見る
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {linkedMinutes ? (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">関連議事録</p>
          <h2 className="mt-2 text-xl font-bold text-indigo-900">
            {linkedMinutes.title || linkedMinutes.official_title || '議事録'}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-indigo-900">
            <span>会議種別: {formatMeetingType(linkedMinutes.meeting_type)}</span>
            <span>開催日: {formatDate(linkedMinutes.held_on)}</span>
            <span>作成日: {formatDate(linkedMinutes.created_at)}</span>
          </div>
          <div className="mt-4">
            <Link
              href={`/ai-minutes/records/${linkedMinutes.id}`}
              className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              関連議事録を見る
            </Link>
          </div>
        </section>
      ) : null}

      {taskCreated ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">追加完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            この案件にタスクを追加しました。
          </p>
        </section>
      ) : null}

      {taskCompleted ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">完了反映</p>
          <p className="mt-2 text-sm text-emerald-700">
            タスクを完了に更新しました。
          </p>
        </section>
      ) : null}

      {taskDeleted ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">削除完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            タスクを削除しました。
          </p>
        </section>
      ) : null}

      {saved ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">保存完了</p>
          <p className="mt-2 text-sm text-emerald-700">
            案件の状況・期限を更新しました。
          </p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">更新エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">状況</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {getStatusLabel(targetCase.status ?? null)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">期限</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatDate(caseDueDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">登録日</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatDate((targetCase.created_at ?? null) as string | null)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">未完了タスク</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {tasks.length}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">案件内容</h2>
          {caseDescription ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {caseDescription}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">案件内容はまだ入力されていません。</p>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-bold text-slate-900">案件情報を更新</h2>
          <p className="mt-2 text-sm text-slate-600">
            状況と期限をこの画面で変更できます。
          </p>

          {!detectedDueField ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              cases テーブルの期限列を判定できませんでした。現在は状況のみ更新できます。
            </div>
          ) : null}

          <form action={updateCaseAction} className="mt-5 space-y-5">
            <input type="hidden" name="property_id" value={id} />
            <input type="hidden" name="case_id" value={caseId} />
            <input type="hidden" name="due_field" value={detectedDueField} />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                状況
              </label>
              <select
                name="status"
                defaultValue={targetCase.status ?? 'todo'}
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
                defaultValue={toDateInputValue(caseDueDate)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium !text-white hover:bg-slate-800"
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">この案件のタスク一覧</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {tasks.length}件
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            この案件のタスクはまだありません。
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {item.title || '無題タスク'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        状況: {getStatusLabel(item.status ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        優先度: {getPriorityLabel(item.priority ?? null)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        期限: {formatDate(pickTaskDueDate(item))}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/properties/${id}/tasks/${item.id}`}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    タスク詳細を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-700">削除</h2>
        <p className="mt-2 text-sm text-slate-600">
          間違って作成した案件を削除できます。紐づくタスクは物件直下タスクとして残します。
        </p>

        <form action={deleteCaseAction} className="mt-5">
          <input type="hidden" name="property_id" value={id} />
          <input type="hidden" name="case_id" value={caseId} />

          <button
            type="submit"
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700"
          >
            この案件を削除
          </button>
        </form>
      </section>
    </div>
  )
}