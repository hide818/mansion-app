import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiOngoingCaseKeypointsPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="ongoing_case_keypoints"
        title="AI 継続案件の要点表示"
        description="長く続いている案件について、今も効いている要点だけを抜き出して表示する整理AIです。"
        inputLabel="継続案件で押さえたいこと"
        placeholder="例）ずっと続いている案件なので、今なお重要な論点だけを短く見たいです。"
        buttonText="要点を整理する"
        resultTitle="継続案件の要点"
        tips={[
          '長期案件の再理解に向いています。',
          '全部読むのがしんどい時に強いです。',
          '引き継ぎ・上司共有・理事会前の全部で使えます。',
        ]}
      />
    </div>
  )
}