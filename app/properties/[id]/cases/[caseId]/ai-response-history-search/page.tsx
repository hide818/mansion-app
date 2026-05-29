import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiResponseHistorySearchPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="response_history_search"
        title="AI 対応履歴検索"
        description="誰が、いつ、何をしたかという対応履歴を探しやすい形に整理して返す検索AIです。"
        inputLabel="探したい履歴"
        placeholder="例）理事長へいつ説明したか、業者へ再見積依頼した履歴、住民へ返信したログを探したいです。"
        buttonText="履歴を検索する"
        resultTitle="対応履歴検索結果"
        tips={[
          '過去ログを探す時間を減らせます。',
          '説明責任の確認に向いています。',
          '監査や引き継ぎにも使いやすいです。',
        ]}
      />
    </div>
  )
}