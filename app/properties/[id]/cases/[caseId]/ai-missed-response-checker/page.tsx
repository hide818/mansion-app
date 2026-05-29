import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiMissedResponseCheckerPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="missed_response_checker"
        title="対応抜けチェック"
        description="確認漏れ、連絡漏れ、提出漏れ、判断漏れをAIで洗い出します。事故防止向けの派手機能です。"
        inputLabel="不安な点"
        placeholder="例）業者への追加確認が必要かもしれません。理事会提出の要否も少し不安です。住民説明が足りているかも見てほしいです。"
        submitLabel="抜けをチェックする"
        resultTitle="対応抜けチェック結果"
      />
    </div>
  )
}