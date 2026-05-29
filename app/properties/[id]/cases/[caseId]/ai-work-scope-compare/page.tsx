import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiWorkScopeComparePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="work_scope_compare"
      title="AI 工事項目比較"
      description="見積ごとの工事項目や作業範囲の差を整理します。何が含まれていて、何が抜けていそうかを確認したい時に使う機能です。"
      placeholder="各社の見積本文や工事項目一覧をそのまま貼ってください。A社、B社などの見出しがあると比較しやすくなります。"
      tips={[
        '含まれる作業、含まれない作業を比較します。',
        '曖昧な表現や抜け漏れの可能性も拾います。',
        '発注前に確認すべき質問まで出します。',
        '複数見積を一気に貼るのがおすすめです。',
      ]}
    />
  )
}