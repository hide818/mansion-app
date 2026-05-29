import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiRecommendedActionBuilderPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="recommended_action_builder"
      title="AI おすすめアクション生成"
      description="この案件で次に取るべき動きを、おすすめ順で短く整理します。"
      placeholder="今迷っている次の一手、候補にしている動き、制約があればここへ書いてください。"
      tips={[
        '次アクションを順番つきで出します。',
        'その順番にした理由も出します。',
        '先に連絡すべき相手も出します。',
        '今日中にやる範囲も整理します。',
      ]}
    />
  )
}