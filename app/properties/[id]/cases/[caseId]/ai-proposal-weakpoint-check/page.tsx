import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiProposalWeakpointCheckPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="proposal_weakpoint_check"
        title="AI 議案弱点診断"
        description="議案として見た時の弱点、突っ込まれやすい論点、補強すべき説明を整理します。"
        inputLabel="弱い気がするところ"
        placeholder="例）金額の妥当性、工事項目の違い、今やる必要性の説明がまだ弱い気がします。"
        buttonText="弱点を診断する"
        resultTitle="議案弱点診断"
        tips={[
          '議案の詰めに向いています。',
          '想定質問の前に土台の弱点を把握できます。',
          '理事会で刺される前に補強できます。',
        ]}
      />
    </div>
  )
}