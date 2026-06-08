import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { canEdit } from '@/lib/permissions'
import PropertyTimelineClient from '@/app/components/PropertyTimelineClient'
import PropertyMemoryAiClient from '@/app/components/PropertyMemoryAiClient'
import PropertyRepairPlanClient from '@/app/components/PropertyRepairPlanClient'
import PropertyInfoForm from '@/app/properties/[id]/PropertyInfoForm'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    saved?: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
  repair_plan_file_path: string | null
  repair_plan_file_name: string | null
}

type MinutesSettingsRow = {
  bylaws_article: string | null
  owners_total_count: string | null
  voting_rights_total_count: string | null
  management_company_display_name: string | null
  default_chairperson_name: string | null
  signature_person_1: string | null
  signature_person_2: string | null
  general_meeting_title_format: string | null
  board_meeting_title_format: string | null
  show_signature_section: boolean | null
  closing_remarks: string | null
}

async function updateMinutesSettingsAction(formData: FormData) {
  'use server'

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    const propertyId = String(formData.get('property_id') ?? '').trim()
    redirect(`/properties/${propertyId}?error=` + encodeURIComponent('権限がありません'))
  }

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const propertyId = String(formData.get('property_id') ?? '').trim()

  if (!propertyId) return

  // companyId が null の場合は認証エラーとして扱う
  if (!companyId) {
    redirect(`/properties/${propertyId}?saved=error`)
  }

  const bylawsArticle = String(formData.get('bylaws_article') ?? '').trim()
  const ownersTotalCount = String(formData.get('owners_total_count') ?? '').trim()
  const votingRightsTotalCount = String(formData.get('voting_rights_total_count') ?? '').trim()
  const managementCompanyDisplayName = String(formData.get('management_company_display_name') ?? '').trim()
  const defaultChairpersonName = String(formData.get('default_chairperson_name') ?? '').trim()
  const signaturePerson1 = String(formData.get('signature_person_1') ?? '').trim()
  const signaturePerson2 = String(formData.get('signature_person_2') ?? '').trim()
  const showSignatureSection = formData.get('show_signature_section') !== '0'
  const closingRemarks = String(formData.get('closing_remarks') ?? '').trim()

  const { data: updated, error } = await supabase
    .from('properties')
    .update({
      bylaws_article: bylawsArticle || null,
      owners_total_count: ownersTotalCount || null,
      voting_rights_total_count: votingRightsTotalCount || null,
      management_company_display_name: managementCompanyDisplayName || null,
      default_chairperson_name: defaultChairpersonName || null,
      signature_person_1: signaturePerson1 || null,
      signature_person_2: signaturePerson2 || null,
      show_signature_section: showSignatureSection,
      closing_remarks: closingRemarks || null,
    })
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .select('id')

  // DB エラー（カラム未存在・権限不足など）
  if (error) {
    redirect(`/properties/${propertyId}?saved=error`)
  }

  // 0 行更新（company_id 不一致・対象物件なし）
  if (!updated || updated.length === 0) {
    redirect(`/properties/${propertyId}?saved=notfound`)
  }

  redirect(`/properties/${propertyId}?saved=minutes`)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PropertyDetailPage({ params, searchParams }: Props) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return notFound()
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const savedParam = resolvedSearchParams?.saved ?? ''

  const minutesSaved = savedParam === 'minutes'
  const minutesError = savedParam === 'error'
  const minutesNotFound = savedParam === 'notfound'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  // 物件の存在確認は確実に存在するカラムだけで行う
  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, repair_plan_file_path, repair_plan_file_name')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle<PropertyRow>()

  if (!property) {
    return notFound()
  }

  // 物件情報フィールド
  const { data: propertyInfo } = await supabase
    .from('properties')
    .select(`
      built_year, structure, total_units, total_floors,
      association_name, president_name, president_phone, president_email,
      board_frequency, general_meeting_month,
      management_fee, repair_reserve, reserve_balance, repair_plan_year,
      contract_start, contract_renewal,
      cleaning_company, elevator_company, insurance_company
    `)
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  // 議事録設定は別クエリで取得（SQL migration 未実施でもエラーを無視して続行）
  const { data: minutesSettings } = await supabase
    .from('properties')
    .select(`
      bylaws_article,
      owners_total_count,
      voting_rights_total_count,
      management_company_display_name,
      default_chairperson_name,
      signature_person_1,
      signature_person_2,
      general_meeting_title_format,
      board_meeting_title_format,
      show_signature_section,
      closing_remarks
    `)
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle<MinutesSettingsRow>()

  const bylawsArticle = minutesSettings?.bylaws_article ?? null
  const ownersTotalCount = minutesSettings?.owners_total_count ?? null
  const votingRightsTotalCount = minutesSettings?.voting_rights_total_count ?? null
  const managementCompanyDisplayName = minutesSettings?.management_company_display_name ?? null
  const defaultChairpersonName = minutesSettings?.default_chairperson_name ?? null
  const signaturePerson1 = minutesSettings?.signature_person_1 ?? null
  const signaturePerson2 = minutesSettings?.signature_person_2 ?? null
  const showSignatureSection = minutesSettings?.show_signature_section ?? true
  const closingRemarks = minutesSettings?.closing_remarks ?? null

  const [
    { count: caseCount },
    { count: taskCount },
    { count: complaintCount },
    { count: handoverCount },
    { count: minutesCount },
  ] = await Promise.all([
    supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id)
      .neq('status', 'done'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('handover_documents')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
    supabase
      .from('ai_minutes_records')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('property_id', id),
  ])

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">物件詳細</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {property.name || '無題物件'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {property.address || '住所未設定'}
            </p>
          </div>

          <Link
            href="/properties"
            className="self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            物件一覧へ
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">案件数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{caseCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">未完了タスク数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{taskCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">クレーム件数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{complaintCount ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">引き継ぎ書数</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{handoverCount ?? 0}</p>
        </div>

        <Link
          href={`/ai-minutes/records?propertyId=${id}`}
          className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm transition hover:border-sky-400 hover:bg-sky-100"
        >
          <p className="text-sm text-sky-600">保存済み議事録数</p>
          <p className="mt-2 text-3xl font-bold text-sky-900">{minutesCount ?? 0}</p>
          <p className="mt-2 text-xs font-medium text-sky-700">一覧を見る →</p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            主要アクション
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/ai-minutes"
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-medium !text-white hover:bg-sky-800"
            >
              AI議事録を作成
            </Link>
            <Link
              href={`/properties/${id}/cases/new`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium !text-white hover:bg-slate-800"
            >
              案件を追加
            </Link>
            <Link
              href={`/properties/${id}/tasks/new`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium !text-white hover:bg-emerald-800"
            >
              物件タスクを追加
            </Link>
            <Link
              href={`/handover-documents/new?propertyId=${id}`}
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-medium !text-white hover:bg-indigo-800"
            >
              引き継ぎ書を作成
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            確認する
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/properties/${id}/cases`}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              案件一覧を見る
            </Link>
            <Link
              href={`/properties/${id}/tasks`}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              タスク一覧を見る
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            保存済み資産
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/ai-minutes/records?propertyId=${id}`}
              className="rounded-xl border border-sky-300 px-4 py-2.5 text-center text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              この物件の保存済み議事録一覧
            </Link>
            <Link
              href={`/handover-documents?propertyId=${id}`}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              引き継ぎ一覧を見る
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            長期修繕計画書
          </p>
          <p className="mb-3 text-xs text-slate-400">施工会社・設計事務所から受領した計画書PDFを保管</p>
          <PropertyRepairPlanClient
            propertyId={id}
            initialFilePath={property.repair_plan_file_path ?? null}
            initialFileName={property.repair_plan_file_name ?? null}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">物件情報</h2>
        <p className="text-sm text-slate-500 mb-5">建物・管理組合・財務・契約・業者情報。引き継ぎ書AIにも自動反映されます。</p>
        <PropertyInfoForm
          propertyId={id}
          initial={{
            built_year: propertyInfo?.built_year ?? null,
            structure: propertyInfo?.structure ?? null,
            total_units: propertyInfo?.total_units ?? null,
            total_floors: propertyInfo?.total_floors ?? null,
            association_name: propertyInfo?.association_name ?? null,
            president_name: propertyInfo?.president_name ?? null,
            president_phone: propertyInfo?.president_phone ?? null,
            president_email: propertyInfo?.president_email ?? null,
            board_frequency: propertyInfo?.board_frequency ?? null,
            general_meeting_month: propertyInfo?.general_meeting_month ?? null,
            management_fee: propertyInfo?.management_fee ?? null,
            repair_reserve: propertyInfo?.repair_reserve ?? null,
            reserve_balance: propertyInfo?.reserve_balance ?? null,
            repair_plan_year: propertyInfo?.repair_plan_year ?? null,
            contract_start: propertyInfo?.contract_start ?? null,
            contract_renewal: propertyInfo?.contract_renewal ?? null,
            cleaning_company: propertyInfo?.cleaning_company ?? null,
            elevator_company: propertyInfo?.elevator_company ?? null,
            insurance_company: propertyInfo?.insurance_company ?? null,
          }}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <PropertyMemoryAiClient propertyId={id} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <PropertyTimelineClient propertyId={id} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">議事録設定</h2>
        <p className="mt-1 text-sm text-slate-500">
          総会議事録作成時に自動反映される物件固有情報です。一度登録すると毎回の入力が不要になります。
        </p>

        {minutesSaved ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            議事録設定を保存しました。
          </div>
        ) : null}

        {minutesError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            保存に失敗しました。データベースにカラムが追加されているか、権限を確認してください。
            （Supabase で SQL migration が実行済みか確認してください）
          </div>
        ) : null}

        {minutesNotFound ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            更新対象が見つかりませんでした。ログイン状態を確認してください。
          </div>
        ) : null}

        {!minutesSettings && !minutesError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            議事録設定を保存するには、先にデータベースへのカラム追加が必要です。
            管理者に Supabase の SQL 実行を依頼してください。
          </div>
        ) : null}

        <form action={updateMinutesSettingsAction} className="mt-5 space-y-5">
          <input type="hidden" name="property_id" value={id} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              規約根拠条文番号
            </label>
            <input
              type="text"
              name="bylaws_article"
              defaultValue={bylawsArticle ?? ''}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 md:w-64"
              placeholder="例：49"
            />
            <p className="mt-1 text-xs text-slate-400">
              「管理規約第◯条の規定に基づき…」の◯に入る数字
            </p>
          </div>

          <div className="grid gap-4 md:max-w-md md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                組合員総数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="owners_total_count"
                  defaultValue={ownersTotalCount ?? ''}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：120"
                />
                <span className="shrink-0 text-sm text-slate-500">人</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                議決権総数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="voting_rights_total_count"
                  defaultValue={votingRightsTotalCount ?? ''}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：120"
                />
                <span className="shrink-0 text-sm text-slate-500">個</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:max-w-md md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                管理会社表示名
              </label>
              <input
                type="text"
                name="management_company_display_name"
                defaultValue={managementCompanyDisplayName ?? ''}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="例：〇〇管理株式会社"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                議長名（理事長名）
              </label>
              <input
                type="text"
                name="default_chairperson_name"
                defaultValue={defaultChairpersonName ?? ''}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="例：山田太郎"
              />
            </div>
          </div>

          <div className="grid gap-4 md:max-w-md md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                議事録署名人1
              </label>
              <input
                type="text"
                name="signature_person_1"
                defaultValue={signaturePerson1 ?? ''}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="例：田中一郎"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                議事録署名人2
              </label>
              <input
                type="text"
                name="signature_person_2"
                defaultValue={signaturePerson2 ?? ''}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="例：鈴木花子"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              署名欄の表示
            </label>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="show_signature_section"
                  value="1"
                  defaultChecked={showSignatureSection !== false}
                />
                表示する
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="show_signature_section"
                  value="0"
                  defaultChecked={showSignatureSection === false}
                />
                非表示にする
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              議事録末尾の定型文
            </label>
            <textarea
              name="closing_remarks"
              defaultValue={closingRemarks ?? ''}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="議事録末尾に挿入する定型文（任意）"
            />
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium !text-white hover:bg-slate-800"
            >
              保存する
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
