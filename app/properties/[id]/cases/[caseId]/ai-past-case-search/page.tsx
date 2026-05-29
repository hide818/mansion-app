import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiPastCaseSearchPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="past_case_search"
        title="AI 過去案件検索"
        description="今の案件に近い過去案件の進め方、ハマりポイント、使えそうな対応パターンを探すための検索AIです。"
        inputLabel="探したい過去案件の特徴"
        placeholder="例）理事会で見積比較が争点になった修繕案件、住民不満が出やすい工事案件を探したいです。"
        buttonText="過去案件を探す"
        resultTitle="過去案件検索結果"
        tips={[
          '過去事例ベースで今の判断を楽にできます。',
          '新担当でも戦いやすくなります。',
          '案件の再利用価値を高める機能です。',
        ]}
      />
    </div>
  )
}