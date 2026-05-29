import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiAssigneeChangeModePage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="assignee_change_mode"
        title="担当者変更モード"
        description="新担当者が最初の3日で迷わないように、引き継ぎ観点を強く出す専用モードです。"
        inputLabel="引き継ぎ時に気になること"
        placeholder="例）理事長の温度感、業者との関係、未完了タスク、今後炎上しそうな点を特に明確にしたいです。"
        submitLabel="引き継ぎ整理をする"
        resultTitle="担当者変更モード結果"
      />
    </div>
  )
}