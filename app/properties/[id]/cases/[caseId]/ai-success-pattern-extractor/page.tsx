import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiSuccessPatternExtractorPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="success_pattern_extractor"
      title="AI 成功対応パターン抽出"
      description="この案件でうまくいった対応を抜き出し、他案件でも再利用できそうな型として整理します。"
      placeholder="特にうまく進んだやり取りや、再利用したい対応があればここへ書いてください。"
      tips={[
        '成功した対応を抽出します。',
        'なぜ良かったかも出します。',
        '再利用できる型へ変換します。',
        '社内共有ナレッジに向いています。',
      ]}
    />
  )
}