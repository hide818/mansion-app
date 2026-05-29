import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardLastminuteBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_lastminute_brief"
        title="AI 理事会30秒要約"
        description="理事会直前に、背景・今の状況・決めてほしいことを30秒で話せる形に圧縮します。"
        inputLabel="直前に押さえたいこと"
        placeholder="例）理事長には短く、役員には判断ポイントが伝わるようにしたいです。"
        buttonText="30秒要約を作る"
        resultTitle="理事会30秒要約"
        tips={[
          '直前確認にかなり向いています。',
          '長い案件を一瞬で口頭説明モードにできます。',
          '理事会前の脳内整理に強いです。',
        ]}
      />
    </div>
  )
}