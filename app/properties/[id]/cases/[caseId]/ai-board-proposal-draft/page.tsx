import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiBoardProposalDraftPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="board_proposal_draft"
      title="AI 議案書ドラフト生成"
      description="案件情報、ログ、タスク状況から理事会へ出す議案書の叩き台を作ります。背景、提案内容、承認いただきたい事項までまとめる機能です。"
      placeholder="補足したい事情、理事会へ伝えたい背景、見積のポイントなどがあればここに貼ってください。"
      tips={[
        '理事会へ出す前の下書き作成に向いています。',
        '議案タイトルも一緒に整えます。',
        '承認いただきたい事項まで分けて出します。',
        '案件ログが多いほど内容が厚くなります。',
      ]}
    />
  )
}