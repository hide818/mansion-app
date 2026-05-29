import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiPdfEstimateAnalysisPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="pdf_estimate_analysis"
      title="AI PDF見積解析"
      description="見積書の本文やPDFから抜いたテキストを貼ると、金額、工事範囲、不足事項、説明時の注意点まで整理します。見積確認を早くするための新機能です。"
      placeholder="ここに見積書の本文やPDFからコピーしたテキストを貼ってください。複数社ぶんをまとめて貼っても大丈夫です。"
      tips={[
        'PDF本文を貼ると精度が上がります。',
        '添付資料の名前だけでも最低限の整理はできます。',
        '読み取れない箇所はAIが「要確認」と出します。',
        '理事会説明や上司説明の注意点まで一緒に出します。',
      ]}
    />
  )
}