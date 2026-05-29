import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiEstimateHistorySearchPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="estimate_history_search"
        title="AI 見積履歴検索"
        description="見積の履歴、比較論点、過去の似た金額感や注意点を探すための見積検索AIです。"
        inputLabel="見積履歴で探したいこと"
        placeholder="例）過去に似た工事項目でどんな比較をしたか、保証差で揉めた案件があったかを探したいです。"
        buttonText="見積履歴を検索する"
        resultTitle="見積履歴検索結果"
        tips={[
          '見積の比較経験を再利用しやすくなります。',
          '業者比較の説明材料を探すのに向いています。',
          '見積系AIの司令塔になりやすいです。',
        ]}
      />
    </div>
  )
}