import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiTaskPrioritySuggesterPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="task_priority_suggester"
      title="AI タスク優先度自動提案"
      description="未完了タスクを優先順で並べ替え、何から先に触るべきかを理由つきで整理します。忙しい時に優先順位を迷わないための新機能です。"
      placeholder="急ぎで見てほしい事情、今日中に動きたい背景、理事会予定などがあればここへ補足してください。"
      tips={[
        '未完了タスクの優先順位をAIが整理します。',
        '高・中・低に分けて理由つきで出します。',
        '優先度が設定されていないタスクがあっても使えます。',
        '忙しい朝に何からやるか決める時に向いています。',
      ]}
    />
  )
}