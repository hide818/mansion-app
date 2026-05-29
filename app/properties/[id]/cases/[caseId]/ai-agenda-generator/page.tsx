import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiAgendaGeneratorPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="agenda_generator"
        title="AI 議案生成"
        description="案件の内容から、議案名・議案の主旨・承認事項まで含めた議案化を行います。"
        inputLabel="議案化で気になること"
        placeholder="例）この案件を議案にするとしたら、どういうタイトルと主旨で出すのが自然か見たいです。"
        buttonText="AI議案を作る"
        resultTitle="AI議案生成結果"
        tips={[
          '案件から議案へ変換したい時に向いています。',
          '議案タイトルづくりにも使えます。',
          '理事会へ上げるか迷う案件の整理にも使えます。',
        ]}
      />
    </div>
  )
}