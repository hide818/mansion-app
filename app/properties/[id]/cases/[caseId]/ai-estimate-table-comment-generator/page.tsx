import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiEstimateTableCommentGeneratorPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="estimate_table_comment_generator"
        title="AI 見積比較表コメント生成"
        description="比較表を前提に、理事会や上司へ説明しやすい見積比較コメントを作ります。"
        inputLabel="比較で特に伝えたい点"
        placeholder="例）価格だけでなく保証、工事項目、安心感の違いも比較コメントに入れたいです。"
        buttonText="比較コメントを作る"
        resultTitle="AI見積比較表コメント"
        tips={[
          '比較表の横に載せるコメント向けです。',
          '口頭説明より資料向けの表現になります。',
          'なぜこの比較結果なのかを補足しやすいです。',
        ]}
      />
    </div>
  )
}