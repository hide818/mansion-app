import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiEstimateCommentGeneratorPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="estimate_comment_generator"
      title="AI 見積比較コメント生成"
      description="見積比較の説明コメントを作ります。上司向け、理事会向け、管理組合向けに使いやすい落ち着いた文面へ整理する機能です。"
      placeholder="比較したい見積内容や、すでに書きかけの説明文があればここに貼ってください。"
      tips={[
        '採用候補にする理由も自然な文で出します。',
        '見送り候補にする理由も角が立ちにくい形で出します。',
        '比較表とあわせて使うと強いです。',
        'そのままメール本文の下書きにも使えます。',
      ]}
    />
  )
}