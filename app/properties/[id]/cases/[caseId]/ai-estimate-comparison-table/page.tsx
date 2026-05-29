import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiEstimateComparisonTablePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="estimate_comparison_table"
      title="AI 見積比較表生成"
      description="複数見積をコピペしやすい比較表へまとめます。社内共有や理事会資料の下書きにそのまま使いやすい形で出す機能です。"
      placeholder="複数社の見積内容をここへまとめて貼ってください。会社名、金額、工事項目、保証などがあると比較表が作りやすくなります。"
      tips={[
        'コピーしやすいテキスト比較表で出します。',
        '金額だけでなく範囲や保証も比較に入れます。',
        '最後に違いの要点も短く整理します。',
        '理事会向けの叩き台に向いています。',
      ]}
    />
  )
}