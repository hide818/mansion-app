import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseAutoSummaryPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_auto_summary"
        title="案件自動要約"
        description="案件の背景、現状、課題、次の動きを含めた案件専用の要約を自動で作ります。"
        inputLabel="案件要約で強く出したい点"
        placeholder="例）理事会に上げるかどうか、業者確認の状況、住民説明の必要性を含めて整理したいです。"
        buttonText="案件要約を作る"
        resultTitle="案件自動要約"
        tips={[
          'AI要約より案件特化です。',
          '引き継ぎにも上司共有にも使いやすいです。',
          '案件ページの司令塔感を強める本命機能です。',
        ]}
      />
    </div>
  )
}