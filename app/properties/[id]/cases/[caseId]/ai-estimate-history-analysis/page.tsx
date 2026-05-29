import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiEstimateHistoryAnalysisPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="estimate_history_analysis"
      title="AI 見積履歴分析"
      description="見積資料やログの流れをもとに、比較の観点、金額以外の注意点、次に確認したいことを整理します。"
      placeholder="どの見積で迷っているか、比較で気になっている点、補足したい事情があればここへ書いてください。"
      tips={[
        '見積の流れを整理します。',
        '比較の観点を短く出します。',
        '金額以外の注意点も見ます。',
        '次に確認したいことまで出します。',
      ]}
    />
  )
}