import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiAssigneeNoticeDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="assignee_notice_draft"
      title="AI 担当者通知文生成"
      description="担当変更や担当依頼の通知文を、分かりやすく整理して作ります。"
      placeholder="担当変更の背景、相手、引き継ぎの有無、いつから変更かなどがあればここへ書いてください。"
      tips={[
        '件名案も一緒に出します。',
        '社内向けと社外向けを分けて出します。',
        '担当変更の伝わり方を整理します。',
        '引き継ぎ連絡にも使えます。',
      ]}
    />
  )
}