import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiGeneralNotificationDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="general_notification_draft"
      title="AI 通知文ひな形生成"
      description="まだ用途が固まっていない時でも使える、汎用の通知文ひな形を作ります。"
      placeholder="誰向けの通知か、何を知らせたいか、丁寧さの強さなどがあればここへ書いてください。"
      tips={[
        '件名案も出します。',
        '短め版も出します。',
        '状況別の言い換えも出します。',
        'とりあえず通知文を作りたい時に便利です。',
      ]}
    />
  )
}