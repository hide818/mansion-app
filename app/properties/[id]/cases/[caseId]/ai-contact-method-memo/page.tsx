import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiContactMethodMemoPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="contact_method_memo"
        title="AI 連絡方法メモ"
        description="誰に、どの順番で、どういう連絡方法が合うかを連絡方法メモとして整理します。"
        inputLabel="連絡方法で残したいこと"
        placeholder="例）理事長は電話先行、役員はメール、業者はチャットだと早いなどを整理したいです。"
        buttonText="連絡方法メモを作る"
        resultTitle="連絡方法メモ"
        tips={[
          '連絡手段の最適化に向いています。',
          '無駄な行き違いを減らしやすいです。',
          '実務の速さがかなり変わるタイプです。',
        ]}
      />
    </div>
  )
}