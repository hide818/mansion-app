import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCaseBlockageDetectorPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="case_blockage_detector"
        title="案件の詰まり検知"
        description="案件がどこで詰まっているかを見抜き、ボトルネックを言語化します。"
        inputLabel="詰まっている気がする点"
        placeholder="例）誰も明確に止めていないのに進みません。確認不足か、判断待ちか、優先度負けか見たいです。"
        buttonText="詰まりを検知する"
        resultTitle="案件の詰まり検知"
        tips={[
          '表面上は平和でも進まない案件に向いています。',
          '何がボトルネックか見えやすくなります。',
          '停滞脱出プランの前段としてかなり強いです。',
        ]}
      />
    </div>
  )
}