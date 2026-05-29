import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCrossPropertyComparisonPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="cross_property_comparison"
        title="AI 他物件比較分析"
        description="今の案件や物件の進め方を、他物件でありそうな対応パターンと比べる前提で整理する比較AIです。"
        inputLabel="他物件と比べたい点"
        placeholder="例）この物件の理事会の厳しさ、住民対応の難しさ、修繕案件の通し方が特殊かどうかを見たいです。"
        buttonText="他物件比較を出す"
        resultTitle="他物件比較分析"
        tips={[
          '将来の横断分析の先取り版です。',
          '今の物件の特殊さが見えやすくなります。',
          'かなり差別化しやすい革新枠です。',
        ]}
      />
    </div>
  )
}