import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiVendorEvaluationBriefPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="vendor_evaluation_brief"
      title="AI 業者評価メモ"
      description="最近の対応ログや見積資料から、業者対応の良かった点・気になった点・次回依頼時の注意を短く整理します。"
      placeholder="業者対応で気になった点、良かった点、今後も依頼したいかどうかなどがあればここへ補足してください。"
      tips={[
        '感情ではなく実務メモとして整理します。',
        '良かった点と気になる点を分けて出します。',
        '次回依頼時の注意も一緒に出します。',
        '社内共有メモに向いています。',
      ]}
    />
  )
}