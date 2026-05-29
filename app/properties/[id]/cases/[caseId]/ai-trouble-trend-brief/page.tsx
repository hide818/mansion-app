import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiTroubleTrendBriefPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="trouble_trend_brief"
        title="AI 過去トラブル傾向表示"
        description="この物件や似た案件で起きやすいトラブルの傾向を、今後の注意点として整理して返します。"
        inputLabel="見たいトラブル傾向"
        placeholder="例）住民不満が出やすい論点、理事会で揉めやすいテーマ、業者対応で詰まりやすい点を見たいです。"
        buttonText="トラブル傾向を出す"
        resultTitle="過去トラブル傾向"
        tips={[
          '物件ごとのクセを把握しやすくなります。',
          '先回りの注意喚起に向いています。',
          '物件カルテ強化としてかなり強いです。',
        ]}
      />
    </div>
  )
}