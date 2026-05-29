import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiWarrantyComparePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="warranty_compare"
      title="AI 保証内容比較"
      description="複数見積や提案書の保証条件を比べやすく整理します。保証年数だけでなく、対象範囲や免責まで見たい時に使う機能です。"
      placeholder="保証条件が書かれた本文をここに貼ってください。複数社分をそのまま続けて貼ってOKです。"
      tips={[
        '保証年数だけではなく、対象範囲も見ます。',
        '免責や対象外項目があると注意点として出します。',
        '理事会で説明しやすい言い方も一緒に出します。',
        '本文が長くても、そのまま貼って大丈夫です。',
      ]}
    />
  )
}