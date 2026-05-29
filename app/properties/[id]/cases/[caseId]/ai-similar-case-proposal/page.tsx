import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSimilarCaseProposalPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="similar_case_proposal"
        title="AI類似案件提案"
        description="この案件に近いパターンを推定し、似た進め方や参考にすべき観点を提案します。"
        inputLabel="似た事例として見たい観点"
        placeholder="例）クレーム化しやすい修繕案件として似たパターンがあれば、その進め方を知りたいです。"
        buttonText="類似案件を提案する"
        resultTitle="AI類似案件提案"
        tips={[
          '過去の知見を今の案件へ寄せるイメージです。',
          '属人化を減らす方向に強いです。',
          'ナレッジ活用の入口として革命感があります。',
        ]}
      />
    </div>
  )
}