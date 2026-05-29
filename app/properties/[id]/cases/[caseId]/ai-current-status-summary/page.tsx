import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCurrentStatusSummaryPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="current_status_summary"
        title="AI 現在状況要約"
        description="案件の今の状態だけを抜き出して、引き継ぎや上司報告で使いやすい形にまとめます。"
        inputLabel="特に要約に入れたいこと"
        placeholder="例）工事時期の話が中心です。理事長との調整状況と、今どこで止まっているかを短く出したいです。"
        buttonText="現在状況をまとめる"
        resultTitle="現在状況要約"
        tips={[
          '今どうなっているかだけを短く整理します。',
          '引き継ぎ冒頭の共有文に向いています。',
          '案件の全履歴ではなく、今の立ち位置を掴みたい時向けです。',
        ]}
      />
    </div>
  )
}