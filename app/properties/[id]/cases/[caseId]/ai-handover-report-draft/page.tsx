import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiHandoverReportDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="handover_report_draft"
      title="AI 引き継ぎ報告書生成"
      description="案件の現在地、未完了タスク、注意点、次アクションを引き継ぎ報告書の形でまとめます。担当変更や休暇前の共有に強い機能です。"
      placeholder="特に引き継ぎたい事情、注意人物、要注意のやり取りがあればここへ補足してください。"
      tips={[
        '未完了タスクを整理して出します。',
        '注意点と次アクションを分けて出します。',
        '担当変更時の事故防止に向いています。',
        '案件のログが溜まっているほど強いです。',
      ]}
    />
  )
}