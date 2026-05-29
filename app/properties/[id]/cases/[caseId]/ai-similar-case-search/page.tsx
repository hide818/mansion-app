import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSimilarCaseSearchPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="similar_case_search"
        title="AI 類似案件検索"
        description="案件の性質、温度感、関係者、争点を踏まえて、似た案件として扱えるパターンを探します。"
        inputLabel="似た案件として見たい観点"
        placeholder="例）クレーム化しやすい、理事会で反対が出やすい、業者比較が難しい案件として近いものを見たいです。"
        buttonText="類似案件を探す"
        resultTitle="類似案件検索結果"
        tips={[
          '過去案件検索より“似ている型”寄りです。',
          '今の案件の立ち位置が見えやすくなります。',
          'ナレッジ検索と並ぶ革新枠です。',
        ]}
      />
    </div>
  )
}