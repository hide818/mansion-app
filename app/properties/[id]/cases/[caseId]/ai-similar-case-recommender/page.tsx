import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSimilarCaseRecommenderPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="similar_case_recommender"
        title="類似案件レコメンド"
        description="今回案件に近い進め方や参考にできる対応パターンをAIが提案します。"
        inputLabel="似た事例として見たい観点"
        placeholder="例）クレーム系、業者選定系、理事会で揉めやすい案件として近いものがあれば、その進め方を参考にしたいです。"
        submitLabel="類似案件を提案する"
        resultTitle="類似案件レコメンド結果"
      />
    </div>
  )
}