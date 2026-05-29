import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiWorkExplanationSimpleDraftPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="work_explanation_simple_draft"
        title="AI 工事説明やさしい文"
        description="工事や修繕の内容を、専門用語を減らして分かりやすく説明する文章に整えます。"
        inputLabel="やさしく説明したい内容"
        placeholder="例）工事項目の違いや、なぜこの修繕が必要かを住民にも役員にも分かる言い方にしたいです。"
        buttonText="やさしい説明文を作る"
        resultTitle="工事説明やさしい文"
        tips={[
          '専門用語をかみ砕くのに向いています。',
          '理事会説明にも住民周知にも使えます。',
          '伝わらない説明の改善に強いです。',
        ]}
      />
    </div>
  )
}