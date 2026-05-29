import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiIndustryBenchmarkPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="industry_benchmark"
        title="AI 業界ベンチマーク機能"
        description="今の案件の進め方や説明の仕方が、一般的に見てどこが強くどこが弱そうかをベンチマーク感覚で整理します。"
        inputLabel="比較したい基準"
        placeholder="例）理事会への上げ方、住民周知の丁寧さ、見積比較の深さが一般的に見てどうかを知りたいです。"
        buttonText="ベンチマークを出す"
        resultTitle="業界ベンチマーク結果"
        tips={[
          '完全な業界データではなく、判断補助として使う前提です。',
          '社内改善ポイントが見つけやすくなります。',
          '見せ方次第でかなり売れる機能です。',
        ]}
      />
    </div>
  )
}