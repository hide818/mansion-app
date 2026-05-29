import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

export default async function AiHistoryStructurerPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  return (
    <CaseAiWorkbenchClient
      propertyId={id}
      caseId={caseId}
      mode="history_structuring"
      title="AI 対応履歴の構造化"
      description="ログやタスクの積み上がった案件を、発端・経過・論点・決定・残課題に整理します。引き継ぎや上司共有の前に便利な機能です。"
      placeholder="特に整理したい経緯、分かりにくいポイント、共有したい論点があればここに追記してください。"
      tips={[
        '時系列ログを見やすい構造へ変えます。',
        '途中参加の人が追いやすくなります。',
        '今の論点と未解決事項を分けて出します。',
        '引き継ぎ前に使うと強いです。',
      ]}
    />
  )
}