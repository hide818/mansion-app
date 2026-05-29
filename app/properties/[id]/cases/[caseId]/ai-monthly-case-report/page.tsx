import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiMonthlyCaseReportPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="monthly_case_report"
      title="AI 月次報告生成"
      description="この案件単位で、今月の状況、実施したこと、未解決事項、来月の予定を月次共有文としてまとめます。社内共有や報告の下書きに向いています。"
      placeholder="今月の補足、特別な事情、来月やりたいことがあればここに追記してください。"
      tips={[
        '案件単位の月次共有文を作ります。',
        '今月やったことと来月予定を分けて出します。',
        '上司共有の叩き台に使いやすいです。',
        '案件のログが多いほど精度が上がります。',
      ]}
    />
  )
}