import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiUrgentFirstResponsePage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="urgent_first_response"
        title="AI 緊急初動文"
        description="トラブル発生時の最初の一言、最初の共有、最初の連絡文をすぐ作ります。"
        inputLabel="緊急対応で今ほしい文"
        placeholder="例）まず理事長に共有する文と、社内に回す初動メモを短く出したいです。"
        buttonText="初動文を作る"
        resultTitle="緊急初動文"
        tips={[
          '初動が遅れやすい案件で効果が高いです。',
          'まず何をどう伝えるかをすぐ形にできます。',
          '事故の拡大防止に向いています。',
        ]}
      />
    </div>
  )
}