import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSummaryPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="ai_summary"
        title="AI要約"
        description="案件の情報を一気に圧縮して、まず全体像をつかむための短い要約を作ります。"
        inputLabel="要約で特に見たいこと"
        placeholder="例）今の状況、止まっている理由、次に何が必要かを短く知りたいです。"
        buttonText="AI要約を作る"
        resultTitle="AI要約"
        tips={[
          'まず全体像をつかみたい時に向いています。',
          '長い履歴を短時間で理解しやすくします。',
          '社内共有の冒頭文にも使えます。',
        ]}
      />
    </div>
  )
}