import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiPersonHandlingMemoPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="person_handling_memo"
        title="AI 人物対応メモ"
        description="この案件で関わる人物ごとに、対応時のコツや注意点を実務メモとして残します。"
        inputLabel="人物対応で残したいこと"
        placeholder="例）申出者は丁寧な経過共有が必要、理事長は先に要点、業者は期限を明記すると動きやすいです。"
        buttonText="人物対応メモを作る"
        resultTitle="人物対応メモ"
        tips={[
          '人ごとの対応の違いを整理できます。',
          '居住者・理事長・役員・業者を横断して残せます。',
          'まさに属人化解消ど真ん中の機能です。',
        ]}
      />
    </div>
  )
}