import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'

type Props = {
  params: Promise<{ id: string; caseId: string }>
}

async function createLogAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  const currentProfile = await getUserProfile()
  const canViewAll =
    currentProfile?.role === 'admin' || currentProfile?.can_view_all_data === true

  const propertyId = String(formData.get('property_id') ?? '')
  const caseId = String(formData.get('case_id') ?? '')
  const message = String(formData.get('message') ?? '').trim()

  // canViewAll=false かつ currentProfile がない場合は操作不可
  if (!canViewAll && !currentProfile?.id) {
    redirect(`/properties/${propertyId}/cases?error=${encodeURIComponent('権限がありません')}`)
  }

  // 全ユーザー共通：targetCase の存在確認（company_id / property_id / case_id 整合確認）
  const { data: targetCase } = await supabase
    .from('cases')
    .select('id, assigned_to')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!targetCase) {
    redirect(`/properties/${propertyId}/cases?error=${encodeURIComponent('案件が見つかりません')}`)
  }

  // canViewAll=false の場合のみ、自分担当かを追加確認
  if (!canViewAll && targetCase.assigned_to !== currentProfile?.id) {
    redirect(`/properties/${propertyId}/cases?error=${encodeURIComponent('権限がありません')}`)
  }

  if (!message) {
    redirect(`/properties/${propertyId}/cases/${caseId}`)
  }

  const { error } = await supabase
    .from('logs')
    .insert({
      case_id: caseId,
      company_id: companyId,
      message,
      type: 'manual',
    })

  if (error) {
    redirect(
      `/properties/${propertyId}/cases/${caseId}?error=${encodeURIComponent('ログ保存エラー')}`,
    )
  }

  redirect(`/properties/${propertyId}/cases/${caseId}`)
}

export default async function NewLogPage({ params }: Props) {
  const { id, caseId } = await params

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">対応履歴追加</h1>

      <form action={createLogAction} className="space-y-4">
        <input type="hidden" name="property_id" value={id} />
        <input type="hidden" name="case_id" value={caseId} />

        <textarea
          name="message"
          placeholder="対応内容を書く"
          className="w-full border p-3 rounded"
          rows={5}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          保存
        </button>
      </form>

      <div className="mt-4">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="text-sm text-slate-600 hover:underline"
        >
          戻る
        </Link>
      </div>
    </div>
  )
}
