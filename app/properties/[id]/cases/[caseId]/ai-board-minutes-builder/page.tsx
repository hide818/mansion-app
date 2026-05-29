import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiBoardMinutesBuilderPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="board_minutes_builder"
        title="AI 理事会議事録作成機能"
        description="理事会後に、決定事項・継続審議・宿題事項が分かる議事録向け文案を作ります。"
        inputLabel="議事録に残したい観点"
        placeholder="例）決定事項と継続審議を分けたいです。誰が何を持ち帰ったかも分かる形にしたいです。"
        buttonText="議事録を作る"
        resultTitle="理事会議事録ドラフト"
        tips={[
          '理事会後の整理に向いています。',
          '決定事項と未決事項を分けやすいです。',
          '引き継ぎにも使いやすい文になります。',
        ]}
      />
    </div>
  )
}