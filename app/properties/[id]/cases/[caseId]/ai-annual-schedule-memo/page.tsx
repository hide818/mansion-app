import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiAnnualScheduleMemoPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="annual_schedule_memo"
        title="AI 年間スケジュールメモ"
        description="この物件で毎年・毎時期に意識すべき動きを、年間の実務メモとして整理します。"
        inputLabel="年間で忘れたくない動き"
        placeholder="例）総会準備時期、理事改選、点検案内、住民周知のタイミングを年間感覚で整理したいです。"
        buttonText="年間メモを作る"
        resultTitle="年間スケジュールメモ"
        tips={[
          '季節ごとの定例業務整理に向いています。',
          '前任者の勘を残しやすいです。',
          '管理漏れ防止に効きます。',
        ]}
      />
    </div>
  )
}